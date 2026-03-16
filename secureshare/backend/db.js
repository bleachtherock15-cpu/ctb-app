const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'secureshare.db');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        TEXT PRIMARY KEY,
    email     TEXT UNIQUE NOT NULL,
    password  TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS shares (
    id             TEXT PRIMARY KEY,
    user_id        TEXT NOT NULL,
    filename       TEXT NOT NULL,
    original_name  TEXT NOT NULL,
    file_size      INTEGER NOT NULL,
    file_type      TEXT,
    token          TEXT UNIQUE NOT NULL,
    expires_at     TEXT,
    max_downloads  INTEGER,
    download_count INTEGER NOT NULL DEFAULT 0,
    password_hash  TEXT,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_shares_token ON shares(token);
  CREATE INDEX IF NOT EXISTS idx_shares_user  ON shares(user_id);

  CREATE TABLE IF NOT EXISTS download_logs (
    id          TEXT PRIMARY KEY,
    share_id    TEXT NOT NULL,
    ip          TEXT,
    user_agent  TEXT,
    country     TEXT,
    city        TEXT,
    isp         TEXT,
    downloaded_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (share_id) REFERENCES shares(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_dlogs_share ON download_logs(share_id);
`);

// Migration: add password_hash column if not exists
try {
  db.exec(`ALTER TABLE shares ADD COLUMN password_hash TEXT`);
} catch (_) { /* column already exists */ }

module.exports = db;
