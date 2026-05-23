// Kirishni tekshiruvchi middleware'lar
import { config } from '../config.js';
import { db } from '../db/index.js';

// 'off' rejimida har bir so'rovga standart foydalanuvchini biriktiradi
function ensureDevUser(req) {
  if (req.session.userId) return;
  const u = db.prepare('SELECT * FROM users ORDER BY id LIMIT 1').get();
  if (u) {
    req.session.userId = u.id;
    req.session.username = u.username;
    req.session.fullName = u.full_name;
    req.session.role = u.role;
  }
}

export function requireAuth(req, res, next) {
  if (config.authMode === 'off') {
    ensureDevUser(req);
    return next();
  }
  // 'name' yoki 'password' rejimi — sessiya kerak
  if (req.session && req.session.userId) return next();
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: 'Avval ismingizni tanlang' });
  }
  return res.redirect('/login.html');
}

export function requireAdmin(req, res, next) {
  if (config.authMode === 'off') return next();
  if (req.session && req.session.role === 'admin') return next();
  return res.status(403).json({ error: 'Faqat administrator uchun' });
}

export function attachUser(req, res, next) {
  if (config.authMode === 'off') ensureDevUser(req);
  if (req.session && req.session.userId) {
    req.user = {
      id: req.session.userId,
      username: req.session.username,
      fullName: req.session.fullName,
      role: req.session.role,
    };
  }
  next();
}
