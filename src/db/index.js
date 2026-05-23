import fs from 'node:fs';
import Database from 'better-sqlite3';
import { config } from '../config.js';

// Kerakli papkalarni yaratamiz
for (const dir of [config.dataDir, config.uploadDir, config.translatedDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    full_name     TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'translator', -- translator | admin
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS documents (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id),
    original_name   TEXT NOT NULL,
    stored_name     TEXT NOT NULL,            -- diskdagi asl fayl nomi
    translated_name TEXT,                     -- diskdagi tarjima fayl nomi
    doc_type        TEXT NOT NULL,            -- yuridik, tibbiy, ...
    source_lang     TEXT NOT NULL,
    target_lang     TEXT NOT NULL,
    size_bytes      INTEGER NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',
    error_message   TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at    TEXT
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER REFERENCES users(id),
    action      TEXT NOT NULL,               -- login, upload, translate_done, translate_error, download
    document_id INTEGER REFERENCES documents(id),
    detail      TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
  CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at);
  CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at);
`);

export function logActivity({ userId, action, documentId = null, detail = null }) {
  db.prepare(
    `INSERT INTO activity_log (user_id, action, document_id, detail) VALUES (?, ?, ?, ?)`
  ).run(userId, action, documentId, detail);
}
