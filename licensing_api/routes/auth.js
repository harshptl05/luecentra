const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function hashToken(t) {
  return crypto.createHash('sha256').update(t).digest('hex');
}

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const emailNorm = String(email).trim().toLowerCase();
    const { rows: existing } = await query('SELECT id FROM users WHERE email = $1', [emailNorm]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const { rows: inserted } = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [emailNorm, password_hash]
    );
    const user = inserted[0];
    const access_token = jwt.sign(
      { sub: user.id, email: user.email },
      JWT_ACCESS_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRES_IN }
    );
    const refresh_token = jwt.sign(
      { sub: user.id, jti: uuidv4() },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );
    const refreshExpires = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 7);
    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, hashToken(refresh_token), refreshExpires]
    );
    res.status(201).json({
      user: { id: user.id, email: user.email },
      access_token,
      refresh_token,
      expires_in: 3600,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const emailNorm = String(email).trim().toLowerCase();
    const { rows } = await query('SELECT id, email, password_hash FROM users WHERE email = $1', [emailNorm]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const access_token = jwt.sign(
      { sub: user.id, email: user.email },
      JWT_ACCESS_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRES_IN }
    );
    const refresh_token = jwt.sign(
      { sub: user.id, jti: uuidv4() },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );
    const refreshExpires = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 7);
    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, hashToken(refresh_token), refreshExpires]
    );
    res.json({
      user: { id: user.id, email: user.email },
      access_token,
      refresh_token,
      expires_in: 3600,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token: token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'refresh_token required' });
    }
    const payload = jwt.verify(token, JWT_REFRESH_SECRET);
    const tokenHash = hashToken(token);
    const { rows } = await query(
      'SELECT id FROM refresh_tokens WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW()',
      [payload.sub, tokenHash]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    const { rows: userRows } = await query('SELECT id, email FROM users WHERE id = $1', [payload.sub]);
    if (userRows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    const user = userRows[0];
    const access_token = jwt.sign(
      { sub: user.id, email: user.email },
      JWT_ACCESS_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRES_IN }
    );
    res.json({ access_token, expires_in: 3600 });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await query('SELECT id, email, created_at FROM users WHERE id = $1', [req.userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

module.exports = router;
