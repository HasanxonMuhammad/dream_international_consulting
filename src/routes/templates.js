import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import multer from 'multer';
import { config, ROOT } from '../config.js';
import { db, logActivity } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { REGISTRY } from '../templates/registry.js';
import { fillTemplate } from '../services/templateFiller.js';
import { transliterate } from '../services/translit.js';
import { extractPdfText } from '../services/pdfExtract.js';
import { parseDocument, hasParser } from '../services/parsers.js';
import { STATUS } from '../constants.js';

export const templatesRouter = express.Router();

// Asl PDF'ni xotirada qabul qilamiz (avtomatik o'qish uchun)
const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.maxFileSizeMB * 1024 * 1024 } });

const BUILT_DIR = path.join(ROOT, 'src', 'templates', 'built');

function isBuilt(type) {
  return fs.existsSync(path.join(BUILT_DIR, `${type}.docx`));
}

// GET /api/templates — mavjud (tayyorlangan) hujjat turlari
templatesRouter.get('/', requireAuth, (req, res) => {
  const list = Object.entries(REGISTRY).map(([key, def]) => ({
    key,
    label: def.label,
    ready: isBuilt(key),
    fieldCount: def.fields.length,
  }));
  res.json({ templates: list });
});

// GET /api/templates/:type/fields — forma sxemasi
templatesRouter.get('/:type/fields', requireAuth, (req, res) => {
  const def = REGISTRY[req.params.type];
  if (!def) return res.status(404).json({ error: 'Hujjat turi topilmadi' });
  res.json({
    type: req.params.type,
    label: def.label,
    ready: isBuilt(req.params.type),
    fields: def.fields.map((f) => ({
      name: f.name,
      label: f.label,
      translit: !!f.translit,
      placeholder: f.placeholder || '',
    })),
    table: def.table
      ? {
          loop: def.table.loop,
          columns: def.table.columns,
          labels: def.table.columns.map((c) => def.table.rowLabels?.[c] || c),
        }
      : null,
  });
});

// POST /api/templates/:type/extract — asl PDF'dan formani avtomatik to'ldirish
templatesRouter.post('/:type/extract', requireAuth, (req, res) => {
  memUpload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const type = req.params.type;
    if (!REGISTRY[type]) return res.status(404).json({ error: 'Hujjat turi topilmadi' });
    if (!req.file) return res.status(400).json({ error: 'Fayl tanlanmadi' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== '.pdf') {
      return res.status(400).json({ error: 'Avtomatik o\'qish faqat PDF uchun. Boshqa fayllarni qo\'lda kiriting.' });
    }

    try {
      const { text, tables, hasText } = await extractPdfText(req.file.buffer);
      if (!hasText) {
        // Skaner (rasm) PDF — matn yo'q. (OCR keyinroq qo'shiladi)
        return res.json({ scanned: true, values: {}, message: 'Bu skaner hujjat — matn topilmadi. Qo\'lda to\'ldiring (OCR keyin qo\'shiladi).' });
      }
      if (!hasParser(type)) {
        return res.json({ scanned: false, values: {}, message: 'Bu tur uchun avtomatik o\'qish hali sozlanmagan. Qo\'lda to\'ldiring.' });
      }
      const values = parseDocument(type, text, tables);
      res.json({ scanned: false, values });
    } catch (e) {
      res.status(500).json({ error: 'PDF o\'qishda xatolik: ' + e.message });
    }
  });
});

// POST /api/templates/transliterate — yordamchi (matnni translit qiladi)
templatesRouter.post('/transliterate', requireAuth, (req, res) => {
  res.json({ result: transliterate(req.body?.text || '') });
});

// POST /api/templates/:type/generate — formani to'ldirib DOCX yaratadi
templatesRouter.post('/:type/generate', requireAuth, (req, res) => {
  const type = req.params.type;
  const def = REGISTRY[type];
  if (!def) return res.status(404).json({ error: 'Hujjat turi topilmadi' });
  if (!isBuilt(type)) return res.status(400).json({ error: 'Bu tur uchun shablon hali tayyorlanmagan' });

  const values = req.body?.values || {};

  let buffer;
  try {
    ({ buffer } = fillTemplate(type, values));
  } catch (e) {
    return res.status(500).json({ error: 'Shablonni to\'ldirishda xatolik: ' + e.message });
  }

  // Arxiv uchun nom: tur + birinchi to'ldirilgan maydon qiymati
  const titleVal = def.fields.map((f) => values[f.name]).find((v) => v && v.trim());
  const docName = `${def.label}${titleVal ? ' — ' + titleVal : ''}.docx`;

  const storedName = `${Date.now()}_${type}.docx`;
  fs.writeFileSync(path.join(config.translatedDir, storedName), buffer);

  const info = db
    .prepare(
      `INSERT INTO documents
        (user_id, original_name, stored_name, translated_name, doc_type, source_lang, target_lang, size_bytes, status, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .run(req.session.userId, docName, '', storedName, type, 'uz', 'en', buffer.length, STATUS.DONE);

  const docId = info.lastInsertRowid;
  logActivity({ userId: req.session.userId, action: 'upload', documentId: docId, detail: docName });
  logActivity({ userId: req.session.userId, action: 'translate_done', documentId: docId, detail: def.label });

  res.json({ id: docId, name: docName, downloadUrl: `/api/documents/${docId}/download?which=translated` });
});
