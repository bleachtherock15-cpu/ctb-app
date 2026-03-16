const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db      = require('../db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'ctb_fallback_secret_change_me';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'EMAIL_AND_PASSWORD_REQUIRED' });

    if (password.length < 6)
      return res.status(400).json({ error: 'PASSWORD_MIN_6_CHARS' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ error: 'INVALID_EMAIL_FORMAT' });

    const existing = (await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])).rows[0];
    if (existing)
      return res.status(409).json({ error: 'EMAIL_ALREADY_REGISTERED' });

    const hash = await bcrypt.hash(password, 12);
    const id   = uuidv4();

    await db.query('INSERT INTO users (id, email, password) VALUES ($1, $2, $3)', [id, email.toLowerCase(), hash]);

    const token = jwt.sign({ id, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.status(201).json({ token, user: { id, email: email.toLowerCase() } });
  } catch (err) {
    console.error('[REGISTER ERROR]', err.message);
    res.status(500).json({ error: 'REGISTRATION_FAILED' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'EMAIL_AND_PASSWORD_REQUIRED' });

    const user = (await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()])).rows[0];
    if (!user)
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('[LOGIN ERROR]', err.message);
    res.status(500).json({ error: 'LOGIN_FAILED' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = (await db.query('SELECT id, email, created_at FROM users WHERE id = $1', [req.user.id])).rows[0];
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

module.exports = router;
