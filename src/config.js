import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');

export const config = {
  port: Number(process.env.PORT) || 3000,
  // 0.0.0.0 = kompaniya tarmog'idagi boshqa kompyuterlar ham kira oladi
  host: process.env.HOST || '0.0.0.0',
  sessionSecret: process.env.SESSION_SECRET || 'dream-dev-secret-change-me',

  // Fayllar saqlanadigan joylar
  dataDir: path.join(ROOT, 'data'),
  uploadDir: path.join(ROOT, 'storage', 'uploads'),
  translatedDir: path.join(ROOT, 'storage', 'translated'),
  dbPath: path.join(ROOT, 'data', 'app.db'),

  maxFileSizeMB: Number(process.env.MAX_FILE_SIZE_MB) || 50,

  // Google Cloud Translation sozlamalari
  google: {
    projectId: process.env.GOOGLE_PROJECT_ID || '',
    location: process.env.GOOGLE_LOCATION || 'us-central1',
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
  },

  // Kirish rejimi: 'name' = parolsiz, ism tanlash (hisobot ajralishi uchun)
  //               'password' = login+parol;  'off' = umuman so'ramaydi
  authMode: process.env.AUTH_MODE || 'name',

  // Til yo'nalishi: o'zbekdan inglizga
  sourceLang: process.env.SOURCE_LANG || 'uz',
  targetLang: process.env.TARGET_LANG || 'en',

  // Google kaliti yo'q bo'lsa, ilova "mock" rejimda ishlaydi (test uchun)
  get mockTranslation() {
    return !this.google.projectId || !this.google.keyFile;
  },
};
