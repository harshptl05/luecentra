const jwt = require('jsonwebtoken');
const { query } = require('../db');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
if (!JWT_ACCESS_SECRET || JWT_ACCESS_SECRET.length < 32) {
  console.warn('[Auth] JWT_ACCESS_SECRET should be at least 32 characters');
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET);
    req.userId = payload.sub;
    req.email = payload.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return next();
  }
  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET);
    req.userId = payload.sub;
    req.email = payload.email;
  } catch (_) {}
  next();
}

module.exports = { requireAuth, optionalAuth };
