import express from 'express';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { DOCUMENT_TYPES, STATUS, documentTypeLabel } from '../constants.js';

export const statsRouter = express.Router();

// GET /api/stats/dashboard — yuqoridagi kartalar va jadval uchun
statsRouter.get('/dashboard', requireAuth, (req, res) => {
  const today = db
    .prepare(
      `SELECT COUNT(*) n FROM documents WHERE date(created_at) = date('now','localtime')`
    )
    .get().n;

  const yesterday = db
    .prepare(
      `SELECT COUNT(*) n FROM documents WHERE date(created_at) = date('now','-1 day','localtime')`
    )
    .get().n;

  const processing = db
    .prepare(`SELECT COUNT(*) n FROM documents WHERE status IN (?, ?)`)
    .get(STATUS.PENDING, STATUS.PROCESSING).n;

  const done = db.prepare(`SELECT COUNT(*) n FROM documents WHERE status = ?`).get(STATUS.DONE).n;
  const errors = db.prepare(`SELECT COUNT(*) n FROM documents WHERE status = ?`).get(STATUS.ERROR).n;

  // Bugun faol bo'lgan tarjimonlar
  const activeTranslators = db
    .prepare(
      `SELECT COUNT(DISTINCT user_id) n FROM activity_log
       WHERE date(created_at) = date('now','localtime')`
    )
    .get().n;

  // Hujjat turlari bo'yicha hajm (foiz uchun)
  const byTypeRows = db
    .prepare(`SELECT doc_type, COUNT(*) n FROM documents GROUP BY doc_type`)
    .all();
  const total = byTypeRows.reduce((s, r) => s + r.n, 0) || 1;
  const byType = byTypeRows
    .map((r) => ({
      key: r.doc_type,
      label: documentTypeLabel(r.doc_type),
      count: r.n,
      percent: Math.round((r.n / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // So'nggi faollik (Recent Activity)
  const recent = db
    .prepare(
      `SELECT a.action, a.detail, a.created_at, u.full_name AS user, d.status AS doc_status
       FROM activity_log a
       LEFT JOIN users u ON u.id = a.user_id
       LEFT JOIN documents d ON d.id = a.document_id
       ORDER BY a.created_at DESC LIMIT 8`
    )
    .all();

  // Faol hujjatlar jadvali (oxirgi yuklamalar)
  const pipeline = db
    .prepare(
      `SELECT d.id, d.original_name, d.source_lang, d.target_lang, d.status,
              d.created_at, u.full_name AS translator
       FROM documents d JOIN users u ON u.id = d.user_id
       ORDER BY d.created_at DESC LIMIT 8`
    )
    .all();

  const change =
    yesterday > 0 ? Math.round(((today - yesterday) / yesterday) * 100) : null;

  res.json({
    cards: {
      today,
      todayChangePercent: change,
      processing,
      done,
      errors,
      activeTranslators,
    },
    byType,
    recent,
    pipeline,
  });
});

// GET /api/stats/reports?date=YYYY-MM-DD — kunlik xodimlar hisoboti
statsRouter.get('/reports', requireAuth, (req, res) => {
  const date = req.query.date || null; // null => bugun
  const dateFilter = date ? `date(d.created_at) = date(?)` : `date(d.created_at) = date('now','localtime')`;
  const params = date ? [date] : [];

  // Har bir xodim bo'yicha kunlik ko'rsatkichlar
  const perUser = db
    .prepare(
      `SELECT u.id, u.full_name AS translator,
              COUNT(d.id) AS total,
              SUM(CASE WHEN d.status = '${STATUS.DONE}' THEN 1 ELSE 0 END) AS done,
              SUM(CASE WHEN d.status = '${STATUS.ERROR}' THEN 1 ELSE 0 END) AS errors,
              SUM(CASE WHEN d.status IN ('${STATUS.PENDING}','${STATUS.PROCESSING}') THEN 1 ELSE 0 END) AS in_progress,
              COALESCE(SUM(d.size_bytes),0) AS total_bytes
       FROM users u
       LEFT JOIN documents d ON d.user_id = u.id AND ${dateFilter}
       GROUP BY u.id
       HAVING total > 0
       ORDER BY total DESC`
    )
    .all(...params);

  // Kun davomidagi har bir hujjat (batafsil ro'yxat)
  const items = db
    .prepare(
      `SELECT d.id, d.original_name, d.doc_type, d.status, d.created_at, d.completed_at,
              u.full_name AS translator
       FROM documents d JOIN users u ON u.id = d.user_id
       WHERE ${dateFilter}
       ORDER BY d.created_at DESC`
    )
    .all(...params)
    .map((r) => ({ ...r, doc_type_label: documentTypeLabel(r.doc_type) }));

  const summary = {
    total: items.length,
    done: items.filter((i) => i.status === STATUS.DONE).length,
    errors: items.filter((i) => i.status === STATUS.ERROR).length,
    activeUsers: perUser.length,
  };

  res.json({ date: date || 'today', summary, perUser, items });
});

// GET /api/stats/meta — hujjat turlari ro'yxati (frontend filtrlari uchun)
statsRouter.get('/meta', requireAuth, (req, res) => {
  res.json({ documentTypes: DOCUMENT_TYPES });
});
