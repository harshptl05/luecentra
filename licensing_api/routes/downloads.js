const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { getSubscriptionStatus } = require('../middleware/subscription');

const router = express.Router();
const DOWNLOAD_BASE_URL = process.env.DOWNLOAD_BASE_URL || 'http://localhost:4000';

// Optional: serve DMG by id (for MVP, no auth on this path; expires is query param)
router.get('/serve/:id', async (req, res) => {
  const { id } = req.params;
  const expires = req.query.expires;
  if (!expires || new Date(expires) < new Date()) {
    return res.status(403).json({ error: 'Download link expired' });
  }
  const { rows } = await query('SELECT id, version, dmg_storage_key FROM downloads WHERE id = $1', [id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Download not found' });
  const row = rows[0];
  const staticUrl = process.env.DMG_PUBLIC_URL || process.env.STORAGE_PUBLIC_BASE;
  if (staticUrl) {
    return res.redirect(302, `${staticUrl}/${row.dmg_storage_key}`);
  }
  res.status(501).json({ message: 'Configure DMG_PUBLIC_URL or storage to enable file download.', version: row.version });
});

router.get('/signed-url', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { rows: subRows } = await query(
      'SELECT status, current_period_end FROM subscriptions WHERE user_id = $1',
      [userId]
    );
    const status = subRows.length > 0
      ? getSubscriptionStatus(subRows[0].status, subRows[0].current_period_end)
      : 'inactive';
    if (status !== 'premium_active' && status !== 'premium_grace') {
      return res.status(402).json({ error: 'Active subscription required to download.' });
    }

    const { rows: downloadRows } = await query(
      'SELECT id, version, dmg_storage_key FROM downloads ORDER BY created_at DESC LIMIT 1'
    );
    if (downloadRows.length === 0) {
      return res.status(404).json({ error: 'No download available yet.' });
    }
    const row = downloadRows[0];
    // For MVP: use a short-lived token in the URL (or a signed path). No S3/R2 yet.
    const expiresIn = 60 * 15; // 15 minutes
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    const signedPath = `/api/downloads/serve/${row.id}?expires=${expiresAt}`;
    const signedUrl = `${DOWNLOAD_BASE_URL}${signedPath}`;
    res.json({
      url: signedUrl,
      version: row.version,
      expires_in: expiresIn,
    });
  } catch (err) {
    console.error('Signed URL error:', err);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

module.exports = router;
