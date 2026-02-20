const { query } = require('../db');

const MAX_DEVICES = parseInt(process.env.MAX_DEVICES_PER_USER || '1', 10);

async function requireDevice(req, res, next) {
  const deviceId = req.headers['x-device-id'];
  if (!deviceId || typeof deviceId !== 'string' || !deviceId.trim()) {
    return res.status(400).json({ error: 'X-Device-ID header required' });
  }
  const userId = req.userId;
  const { rows } = await query(
    `SELECT id, revoked_at FROM devices WHERE user_id = $1 AND device_id = $2`,
    [userId, deviceId.trim()]
  );
  if (rows.length === 0) {
    return res.status(403).json({ error: 'Device not activated. Activate this device first.' });
  }
  if (rows[0].revoked_at) {
    return res.status(403).json({ error: 'Device has been revoked.' });
  }
  req.deviceId = deviceId.trim();
  // Optionally update last_seen_at
  await query(
    `UPDATE devices SET last_seen_at = NOW() WHERE user_id = $1 AND device_id = $2`,
    [userId, deviceId.trim()]
  );
  next();
}

async function checkDeviceLimit(userId) {
  const { rows } = await query(
    `SELECT COUNT(*) AS c FROM devices WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
  return parseInt(rows[0].c, 10) >= MAX_DEVICES;
}

module.exports = { requireDevice, checkDeviceLimit, MAX_DEVICES };
