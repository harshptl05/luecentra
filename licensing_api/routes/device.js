const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { checkDeviceLimit, MAX_DEVICES } = require('../middleware/device');

const router = express.Router();

router.post('/activate', requireAuth, async (req, res) => {
  try {
    const { device_id, device_name } = req.body;
    const did = (device_id && String(device_id).trim()) || null;
    if (!did) {
      return res.status(400).json({ error: 'device_id required' });
    }
    const userId = req.userId;
    const name = (device_name && String(device_name).trim()) || 'Pulse App';

    const { rows: existing } = await query(
      'SELECT id, revoked_at FROM devices WHERE user_id = $1 AND device_id = $2',
      [userId, did]
    );
    if (existing.length > 0) {
      if (existing[0].revoked_at) {
        return res.status(403).json({ error: 'This device has been revoked. Contact support.' });
      }
      await query(
        'UPDATE devices SET device_name = $1, last_seen_at = NOW() WHERE user_id = $2 AND device_id = $3',
        [name, userId, did]
      );
      return res.json({ success: true, message: 'Device already activated' });
    }

    const atLimit = await checkDeviceLimit(userId);
    if (atLimit) {
      return res.status(403).json({
        error: `Device limit reached (${MAX_DEVICES}). Deactivate another device first.`,
        code: 'DEVICE_LIMIT',
      });
    }

    await query(
      'INSERT INTO devices (user_id, device_id, device_name, last_seen_at) VALUES ($1, $2, $3, NOW())',
      [userId, did, name]
    );
    res.status(201).json({ success: true, message: 'Device activated' });
  } catch (err) {
    console.error('Activate error:', err);
    res.status(500).json({ error: 'Device activation failed' });
  }
});

router.get('/list', requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT device_id, device_name, created_at, last_seen_at, revoked_at FROM devices WHERE user_id = $1 ORDER BY last_seen_at DESC',
      [req.userId]
    );
    res.json({ devices: rows });
  } catch (err) {
    console.error('Device list error:', err);
    res.status(500).json({ error: 'Failed to list devices' });
  }
});

module.exports = router;
