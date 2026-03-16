const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { v4: uuidv4 } = require('uuid');
const bcrypt  = require('bcryptjs');
const db      = require('../db');
const auth    = require('../middleware/auth');

const router  = express.Router();

// ── Multer config ─────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 },
});

// ── Helpers ────────────────────────────────────────────────
function isExpired(share) {
  return share.expires_at && new Date(share.expires_at) < new Date();
}
function isLimitReached(share) {
  return share.max_downloads && share.download_count >= share.max_downloads;
}
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || 'unknown';
}
async function logDownload(shareId, req) {
  const ip        = getClientIp(req);
  const userAgent = req.headers['user-agent'] || '';
  let country = '', city = '', isp = '';
  try {
    const geo = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,isp,status`);
    const geoData = await geo.json();
    if (geoData.status === 'success') {
      country = geoData.country || '';
      city    = geoData.city    || '';
      isp     = geoData.isp     || '';
    }
  } catch (_) {}
  db.prepare(
    `INSERT INTO download_logs (id, share_id, ip, user_agent, country, city, isp) VALUES (?,?,?,?,?,?,?)`
  ).run(uuidv4(), shareId, ip, userAgent, country, city, isp);
}

// ── POST /api/shares  (upload) ─────────────────────────────
router.post('/', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'NO_FILE_PROVIDED' });

  const { ttl, maxDownloads, password } = req.body;
  const token = uuidv4();
  const id    = uuidv4();

  const expiresAt    = ttl ? new Date(Date.now() + parseInt(ttl) * 3600 * 1000).toISOString() : null;
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  db.prepare(`
    INSERT INTO shares (id, user_id, filename, original_name, file_size, file_type, token, expires_at, max_downloads, password_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, req.file.filename, req.file.originalname,
    req.file.size, req.file.mimetype, token, expiresAt,
    maxDownloads ? parseInt(maxDownloads) : null, passwordHash);

  const share = db.prepare('SELECT * FROM shares WHERE id = ?').get(id);
  res.status(201).json({ share: sanitize(share) });
});

// ── GET /api/shares  (list) ────────────────────────────────
router.get('/', auth, (req, res) => {
  const shares = db.prepare('SELECT * FROM shares WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ shares: shares.map(sanitize) });
});

// ── GET /api/shares/:id/logs  (download logs for owner) ───
router.get('/:id/logs', auth, (req, res) => {
  const share = db.prepare('SELECT * FROM shares WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!share) return res.status(404).json({ error: 'SHARE_NOT_FOUND' });
  const logs = db.prepare(
    `SELECT id, ip, user_agent, country, city, isp, downloaded_at FROM download_logs WHERE share_id = ? ORDER BY downloaded_at DESC`
  ).all(req.params.id);
  res.json({ logs });
});

// ── DELETE /api/shares/:id ─────────────────────────────────
router.delete('/:id', auth, (req, res) => {
  const share = db.prepare('SELECT * FROM shares WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!share) return res.status(404).json({ error: 'SHARE_NOT_FOUND' });

  const filePath = path.join(process.env.UPLOAD_DIR || './uploads', share.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db.prepare('DELETE FROM shares WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── GET /api/shares/dl/:token  (public download) ──────────
router.get('/dl/:token', async (req, res) => {
  const share = db.prepare('SELECT * FROM shares WHERE token = ?').get(req.params.token);
  if (!share) return res.status(404).json({ error: 'SHARE_NOT_FOUND' });
  if (isExpired(share))      return res.status(410).json({ error: 'SHARE_EXPIRED' });
  if (isLimitReached(share)) return res.status(410).json({ error: 'DOWNLOAD_LIMIT_REACHED' });
  if (share.password_hash)   return res.status(401).json({ error: 'PASSWORD_REQUIRED' });

  const filePath = path.join(process.env.UPLOAD_DIR || './uploads', share.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'FILE_NOT_FOUND_ON_DISK' });

  db.prepare('UPDATE shares SET download_count = download_count + 1 WHERE id = ?').run(share.id);
  logDownload(share.id, req).catch(() => {});

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(share.original_name)}"`);
  res.setHeader('Content-Type', share.file_type || 'application/octet-stream');
  res.sendFile(path.resolve(filePath));
});

// ── POST /api/shares/dl/:token  (password-protected download) ──
router.post('/dl/:token', async (req, res) => {
  const share = db.prepare('SELECT * FROM shares WHERE token = ?').get(req.params.token);
  if (!share) return res.status(404).json({ error: 'SHARE_NOT_FOUND' });
  if (isExpired(share))      return res.status(410).json({ error: 'SHARE_EXPIRED' });
  if (isLimitReached(share)) return res.status(410).json({ error: 'DOWNLOAD_LIMIT_REACHED' });

  if (share.password_hash) {
    const { password } = req.body;
    if (!password) return res.status(401).json({ error: 'PASSWORD_REQUIRED' });
    const ok = await bcrypt.compare(password, share.password_hash);
    if (!ok) return res.status(403).json({ error: 'WRONG_PASSWORD' });
  }

  const filePath = path.join(process.env.UPLOAD_DIR || './uploads', share.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'FILE_NOT_FOUND_ON_DISK' });

  db.prepare('UPDATE shares SET download_count = download_count + 1 WHERE id = ?').run(share.id);
  logDownload(share.id, req).catch(() => {});

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(share.original_name)}"`);
  res.setHeader('Content-Type', share.file_type || 'application/octet-stream');
  res.sendFile(path.resolve(filePath));
});

// ── GET /api/shares/info/:token ────────────────────────────
router.get('/info/:token', (req, res) => {
  const share = db.prepare('SELECT * FROM shares WHERE token = ?').get(req.params.token);
  if (!share) return res.status(404).json({ error: 'SHARE_NOT_FOUND' });
  res.json({
    share: {
      original_name: share.original_name,
      file_size: share.file_size,
      file_type: share.file_type,
      expires_at: share.expires_at,
      max_downloads: share.max_downloads,
      download_count: share.download_count,
      has_password: !!share.password_hash,
      expired: isExpired(share),
      limit_reached: isLimitReached(share),
    },
  });
});

function sanitize(s) {
  return {
    id: s.id,
    original_name: s.original_name,
    file_size: s.file_size,
    file_type: s.file_type,
    token: s.token,
    expires_at: s.expires_at,
    max_downloads: s.max_downloads,
    download_count: s.download_count,
    has_password: !!s.password_hash,
    created_at: s.created_at,
    expired: isExpired(s),
    limit_reached: isLimitReached(s),
  };
}

module.exports = router;
