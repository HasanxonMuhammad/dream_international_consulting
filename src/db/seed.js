// Boshlang'ich foydalanuvchilarni yaratadi.
// Ishga tushirish: npm run init-db
import bcrypt from 'bcryptjs';
import { db } from './index.js';

// Kompaniyadagi 10 xodim. Parollarni keyin Settings'dan o'zgartirish mumkin.
// Format: [login, To'liq ism, parol, rol]
const USERS = [
  ['admin', 'Administrator', 'admin123', 'admin'],
  ['tarjimon1', 'Tarjimon 1', 'parol123', 'translator'],
  ['tarjimon2', 'Tarjimon 2', 'parol123', 'translator'],
  ['tarjimon3', 'Tarjimon 3', 'parol123', 'translator'],
  ['tarjimon4', 'Tarjimon 4', 'parol123', 'translator'],
  ['tarjimon5', 'Tarjimon 5', 'parol123', 'translator'],
  ['tarjimon6', 'Tarjimon 6', 'parol123', 'translator'],
  ['tarjimon7', 'Tarjimon 7', 'parol123', 'translator'],
  ['tarjimon8', 'Tarjimon 8', 'parol123', 'translator'],
  ['tarjimon9', 'Tarjimon 9', 'parol123', 'translator'],
];

const insert = db.prepare(
  `INSERT OR IGNORE INTO users (username, full_name, password_hash, role) VALUES (?, ?, ?, ?)`
);

let added = 0;
for (const [username, fullName, password, role] of USERS) {
  const hash = bcrypt.hashSync(password, 10);
  const res = insert.run(username, fullName, hash, role);
  if (res.changes) added++;
}

console.log(`Tayyor. ${added} ta yangi foydalanuvchi qo'shildi (jami ${USERS.length}).`);
console.log("Kirish: login 'admin', parol 'admin123' (keyin o'zgartiring).");
