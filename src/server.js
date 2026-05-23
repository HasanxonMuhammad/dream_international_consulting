import path from 'node:path';
import express from 'express';
import session from 'express-session';
import { config, ROOT } from './config.js';
import { attachUser, requireAuth } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { documentsRouter } from './routes/documents.js';
import { templatesRouter } from './routes/templates.js';
import { statsRouter } from './routes/stats.js';
import './db/index.js'; // bazani ishga tushiradi

const app = express();
const publicDir = path.join(ROOT, 'public');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 12 }, // 12 soat
  })
);
app.use(attachUser);

// API yo'nalishlari
app.use('/api/auth', authRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/stats', statsRouter);

// Login sahifasi himoyasiz; qolgan sahifalar himoyalangan
app.get('/login.html', (req, res) =>
  res.sendFile(path.join(publicDir, 'login.html'))
);

// Bosh sahifa -> dashboard
app.get('/', (req, res) => res.redirect('/dashboard.html'));

// Himoyalangan HTML sahifalar (kirish talab qilinadi)
const protectedPages = ['/dashboard.html', '/portal.html', '/archive.html', '/reports.html', '/settings.html'];
for (const page of protectedPages) {
  app.get(page, requireAuth, (req, res) =>
    res.sendFile(path.join(publicDir, page))
  );
}

// Statik fayllar (css/js/rasm). HTML'lar yuqorida himoyalandi.
app.use(express.static(publicDir));

// Xatoliklarni qaytarish
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: String(err.message || err) });
});

app.listen(config.port, config.host, () => {
  console.log('====================================================');
  console.log('  Dream International — Tarjima tizimi ishga tushdi');
  console.log(`  Manzil:  http://localhost:${config.port}`);
  console.log(`  Tarmoq:  http://<server-IP>:${config.port}  (boshqa kompyuterlar uchun)`);
  console.log(`  Tarjima: ${config.mockTranslation ? 'MOCK rejim (Google kaliti yo\'q)' : 'Google Cloud Translation'}`);
  console.log('====================================================');
});
