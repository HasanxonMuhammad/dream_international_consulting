import express from 'express';
import bcrypt from 'bcryptjs';
import { db, logActivity } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = express.Router();

authRouter.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Login va parolni kiriting' });
  }

  const user = db
    .prepare('SELECT * FROM users WHERE username = ?')
    .get(String(username).trim());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Login yoki parol noto'g'ri" });
  }

  req.session.userId = user.id;
  req.session.username = user.username;
  req.session.fullName = user.full_name;
  req.session.role = user.role;

  logActivity({ userId: user.id, action: 'login' });

  res.json({
    user: {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
    },
  });
});

authRouter.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// Joriy foydalanuvchi haqida ma'lumot (frontend tekshiruvi uchun)
authRouter.get('/me', requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.session.userId,
      username: req.session.username,
      fullName: req.session.fullName,
      role: req.session.role,
    },
  });
});

// Parolni o'zgartirish
authRouter.post('/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "Yangi parol kamida 6 ta belgidan iborat bo'lsin" });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!bcrypt.compareSync(currentPassword || '', user.password_hash)) {
    return res.status(401).json({ error: "Joriy parol noto'g'ri" });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
  res.json({ ok: true });
});
