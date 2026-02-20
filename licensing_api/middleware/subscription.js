const { query } = require('../db');

const ALLOWED_STATUSES = ['active', 'trialing'];
const GRACE_STATUSES = ['past_due']; // optional: allow for 2-3 days
const GRACE_DAYS = 3;

async function requirePremium(req, res, next) {
  const userId = req.userId;
  const { rows } = await query(
    `SELECT status, current_period_end FROM subscriptions WHERE user_id = $1`,
    [userId]
  );
  if (rows.length === 0) {
    return res.status(402).json({ error: 'No active subscription. Please subscribe to use this feature.' });
  }
  const sub = rows[0];
  if (ALLOWED_STATUSES.includes(sub.status)) {
    return next();
  }
  if (GRACE_STATUSES.includes(sub.status) && sub.current_period_end) {
    const end = new Date(sub.current_period_end);
    const graceEnd = new Date(end);
    graceEnd.setDate(graceEnd.getDate() + GRACE_DAYS);
    if (new Date() <= graceEnd) {
      return next();
    }
  }
  return res.status(402).json({ error: 'Subscription inactive or expired. Please renew.' });
}

function getSubscriptionStatus(status, currentPeriodEnd) {
  if (ALLOWED_STATUSES.includes(status)) return 'premium_active';
  if (GRACE_STATUSES.includes(status) && currentPeriodEnd) {
    const end = new Date(currentPeriodEnd);
    const graceEnd = new Date(end);
    graceEnd.setDate(graceEnd.getDate() + GRACE_DAYS);
    if (new Date() <= graceEnd) return 'premium_grace';
  }
  return 'inactive';
}

module.exports = { requirePremium, getSubscriptionStatus };
