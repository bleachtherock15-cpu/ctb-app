const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS shares (
      id             TEXT PRIMARY KEY,
      user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      filename       TEXT NOT NULL,
      original_name  TEXT NOT NULL,
      file_size      INTEGER NOT NULL,
      file_type      TEXT,
      token          TEXT UNIQUE NOT NULL,
      expires_at     TIMESTAMPTZ,
      max_downloads  INTEGER,
      download_count INTEGER NOT NULL DEFAULT 0,
      password_hash  TEXT,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_shares_token ON shares(token);
    CREATE INDEX IF NOT EXISTS idx_shares_user  ON shares(user_id);

    CREATE TABLE IF NOT EXISTS download_logs (
      id            TEXT PRIMARY KEY,
      share_id      TEXT NOT NULL REFERENCES shares(id) ON DELETE CASCADE,
      ip            TEXT,
      user_agent    TEXT,
      country       TEXT,
      city          TEXT,
      isp           TEXT,
      downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_dlogs_share ON download_logs(share_id);
  `);
  console.log('[DB] PostgreSQL tables ready');
}

initDb().catch(err => {
  console.error('[DB INIT ERROR]', err.message);
  process.exit(1);
});

module.exports = pool;
