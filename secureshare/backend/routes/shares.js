const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { v4: uuidv4 } = require('uuid');
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

// ── Helper ─────────────────────────────────────────────────
function isExpired(share) {
  return share.expires_at && new Date(share.expires_at) < new Date();
}
function isLimitReached(share) {
  return share.max_downloads && share.download_count >= share.max_downloads;
}

// ── POST /api/shares  (upload) ─────────────────────────────
router.post('/', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'NO_FILE_PROVIDED' });

  const { ttl, maxDownloads } = req.body;
  const token = uuidv4();
  const id    = uuidv4();

  const expiresAt = ttl
    ? new Date(Date.now() + parseInt(ttl) * 3600 * 1000).toISOString()
    : null;

  db.prepare(`
    INSERT INTO shares (id, user_id, filename, original_name, file_size, file_type, token, expires_at, max_downloads)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    req.user.id,
    req.file.filename,
    req.file.originalname,
    req.file.size,
    req.file.mimetype,
    token,
    expiresAt,
    maxDownloads ? parseInt(maxDownloads) : null,
  );

  const share = db.prepare('SELECT * FROM shares WHERE id = ?').get(id);
  res.status(201).json({ share: sanitize(share) });
});

// ── GET /api/shares  (list for current user) ───────────────
router.get('/', auth, (req, res) => {
  const shares = db.prepare('SELECT * FROM shares WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ shares: shares.map(sanitize) });
});

// ── DELETE /api/shares/:id ─────────────────────────────────
router.delete('/:id', auth, (req, res) => {
  const share = db.prepare('SELECT * FROM shares WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!share) return res.status(404).json({ error: 'SHARE_NOT_FOUND' });

  // Delete file from disk
  const filePath = path.join(process.env.UPLOAD_DIR || './uploads', share.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db.prepare('DELETE FROM shares WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── GET /api/shares/dl/:token  (public download) ──────────
router.get('/dl/:token', (req, res) => {
  const share = db.prepare('SELECT * FROM shares WHERE token = ?').get(req.params.token);
  if (!share) return res.status(404).json({ error: 'SHARE_NOT_FOUND' });

  if (isExpired(share))
    return res.status(410).json({ error: 'SHARE_EXPIRED' });

  if (isLimitReached(share))
    return res.status(410).json({ error: 'DOWNLOAD_LIMIT_REACHED' });

  const filePath = path.join(process.env.UPLOAD_DIR || './uploads', share.filename);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: 'FILE_NOT_FOUND_ON_DISK' });

  // Increment download count
  db.prepare('UPDATE shares SET download_count = download_count + 1 WHERE id = ?').run(share.id);

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(share.original_name)}"`);
  res.setHeader('Content-Type', share.file_type || 'application/octet-stream');
  res.sendFile(path.resolve(filePath));
});

// ── GET /api/shares/info/:token  (public share info) ──────
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
    created_at: s.created_at,
    expired: isExpired(s),
    limit_reached: isLimitReached(s),
  };
}

module.exports = router;
