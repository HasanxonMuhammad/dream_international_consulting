import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import multer from 'multer';
import { config } from '../config.js';
import { db, logActivity } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import {
  ALLOWED_EXTENSIONS,
  DOCUMENT_TYPE_KEYS,
  STATUS,
  documentTypeLabel,
} from '../constants.js';
import { translateDocument } from '../services/translator.js';

export const documentsRouter = express.Router();

// --- Fayl yuklash sozlamasi ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSizeMB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error(`Format qo'llab-quvvatlanmaydi: ${ext}`));
    }
    cb(null, true);
  },
});

// Fayl nomidagi belgilarni to'g'rilash (multer latin1 deb o'qiydi)
function fixName(name) {
  try {
    return Buffer.from(name, 'latin1').toString('utf8');
  } catch {
    return name;
  }
}

/**
 * POST /api/documents/upload
 * Faylni yuklaydi, yozuv yaratadi va tarjimani fonda boshlaydi.
 */
documentsRouter.post('/upload', requireAuth, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Fayl tanlanmadi' });

    const docType = String(req.body.docType || 'general');
    if (!DOCUMENT_TYPE_KEYS.includes(docType)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Noto'g'ri hujjat turi" });
    }

    const originalName = fixName(req.file.originalname);
    const sourceLang = req.body.sourceLang || config.sourceLang;
    const targetLang = req.body.targetLang || config.targetLang;

    const info = db
      .prepare(
        `INSERT INTO documents
          (user_id, original_name, stored_name, doc_type, source_lang, target_lang, size_bytes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.session.userId,
        originalName,
        path.basename(req.file.path),
        docType,
        sourceLang,
        targetLang,
        req.file.size,
        STATUS.PROCESSING
      );

    const docId = info.lastInsertRowid;
    logActivity({
      userId: req.session.userId,
      action: 'upload',
      documentId: docId,
      detail: `${originalName} (${documentTypeLabel(docType)})`,
    });

    // Tarjimani fonda bajaramiz; foydalanuvchiga darhol javob qaytaramiz
    runTranslation(docId, {
      inputPath: req.file.path,
      originalName,
      sourceLang,
      targetLang,
      userId: req.session.userId,
    });

    res.json({ id: docId, status: STATUS.PROCESSING, originalName });
  });
});

async function runTranslation(docId, { inputPath, originalName, sourceLang, targetLang, userId }) {
  try {
    const { translatedName, translatedPath } = await translateDocument({
      inputPath,
      originalName,
      sourceLang,
      targetLang,
    });
    db.prepare(
      `UPDATE documents SET status = ?, translated_name = ?, completed_at = datetime('now') WHERE id = ?`
    ).run(STATUS.DONE, path.basename(translatedPath), docId);
    logActivity({ userId, action: 'translate_done', documentId: docId, detail: translatedName });
  } catch (e) {
    db.prepare(`UPDATE documents SET status = ?, error_message = ? WHERE id = ?`).run(
      STATUS.ERROR,
      String(e.message || e),
      docId
    );
    logActivity({ userId, action: 'translate_error', documentId: docId, detail: String(e.message || e) });
  }
}

/**
 * GET /api/documents — arxiv ro'yxati (filtr bilan)
 * query: type, status, q (qidiruv), mine=1
 */
documentsRouter.get('/', requireAuth, (req, res) => {
  const where = [];
  const params = [];

  if (req.query.mine === '1') {
    where.push('d.user_id = ?');
    params.push(req.session.userId);
  }
  if (req.query.type && DOCUMENT_TYPE_KEYS.includes(req.query.type)) {
    where.push('d.doc_type = ?');
    params.push(req.query.type);
  }
  if (req.query.status) {
    where.push('d.status = ?');
    params.push(req.query.status);
  }
  if (req.query.q) {
    where.push('d.original_name LIKE ?');
    params.push(`%${req.query.q}%`);
  }

  const sql = `
    SELECT d.id, d.original_name, d.doc_type, d.source_lang, d.target_lang,
           d.size_bytes, d.status, d.error_message, d.created_at, d.completed_at,
           u.full_name AS translator
    FROM documents d
    JOIN users u ON u.id = d.user_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY d.created_at DESC
    LIMIT 500`;

  const rows = db.prepare(sql).all(...params);
  res.json({ documents: rows });
});

// GET /api/documents/:id — bitta hujjat holati (progress tekshirish uchun)
documentsRouter.get('/:id', requireAuth, (req, res) => {
  const row = db
    .prepare(
      `SELECT d.*, u.full_name AS translator FROM documents d
       JOIN users u ON u.id = d.user_id WHERE d.id = ?`
    )
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Topilmadi' });
  res.json({ document: row });
});

// GET /api/documents/:id/download?which=original|translated
documentsRouter.get('/:id/download', requireAuth, (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Topilmadi' });

  const which = req.query.which === 'original' ? 'original' : 'translated';
  if (which === 'translated' && doc.status !== STATUS.DONE) {
    return res.status(409).json({ error: 'Tarjima hali tayyor emas' });
  }

  const fileName = which === 'original' ? doc.stored_name : doc.translated_name;
  const dir = which === 'original' ? config.uploadDir : config.translatedDir;
  const filePath = path.join(dir, fileName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Fayl topilmadi' });

  const ext = path.extname(doc.original_name);
  const base = path.basename(doc.original_name, ext);
  const downloadName =
    which === 'original' ? doc.original_name : `${base}_${doc.target_lang}${ext}`;

  logActivity({ userId: req.session.userId, action: 'download', documentId: doc.id });
  res.download(filePath, downloadName);
});
