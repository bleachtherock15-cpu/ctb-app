require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const rateLimit  = require('express-rate-limit');

const authRoutes   = require('./routes/auth');
const sharesRoutes = require('./routes/shares');
const geoRoutes    = require('./routes/geo');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : (process.env.FRONTEND_URL || 'http://localhost:5500'),
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min — global API
  max: 100,
  message: { error: 'TOO_MANY_REQUESTS' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min — login/register
  max: 10,                   // ลดจาก 20 → 10 ครั้ง
  message: { error: 'TOO_MANY_AUTH_ATTEMPTS' },
  standardHeaders: true,
  legacyHeaders: false,
});

const geoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ชั่วโมง — ป้องกัน Groq API quota หมด
  max: 20,                   // 20 ครั้ง/ชั่วโมง/IP
  message: { error: 'GEO_RATE_LIMIT_EXCEEDED' },
  standardHeaders: true,
  legacyHeaders: false,
});

const downloadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,  // 5 นาที — ป้องกัน download spam
  max: 30,
  message: { error: 'DOWNLOAD_RATE_LIMIT_EXCEEDED' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);
app.use('/api/geo/', geoLimiter);
app.use('/api/shares/dl/', downloadLimiter);

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',   authRoutes);
app.use('/api/shares', sharesRoutes);
app.use('/api/geo',    geoRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ONLINE', version: '3.0.0', timestamp: new Date().toISOString() });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'frontend')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
  });
}

// ── Error handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(413).json({ error: 'FILE_TOO_LARGE_MAX_50MB' });
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
});

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════╗
  ║   SECURESHARE BACKEND v3.0.0       ║
  ║   http://localhost:${PORT}           ║
  ╚════════════════════════════════════╝
  `);
});
