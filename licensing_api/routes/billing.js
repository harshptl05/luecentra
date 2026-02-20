const express = require('express');
const Stripe = require('stripe');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' }) : null;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;

router.post('/create-checkout-session', requireAuth, async (req, res) => {
  if (!stripe || !STRIPE_PRICE_ID) {
    return res.status(503).json({ error: 'Billing not configured' });
  }
  try {
    const userId = req.userId;
    const { rows: userRows } = await query('SELECT id, email FROM users WHERE id = $1', [userId]);
    if (userRows.length === 0) return res.status(404).json({ error: 'User not found' });
    const email = userRows[0].email;

    const { rows: subRows } = await query('SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1', [userId]);
    let customerId = subRows.length > 0 ? subRows[0].stripe_customer_id : null;
    if (!customerId) {
      const customer = await stripe.customers.create({ email });
      customerId = customer.id;
      await query(
        'INSERT INTO subscriptions (user_id, stripe_customer_id, status) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = EXCLUDED.stripe_customer_id',
        [userId, customerId, 'inactive']
      );
    }

    const origin = req.get('origin') || process.env.DOWNLOAD_BASE_URL || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/dashboard?checkout=cancel`,
      subscription_data: { trial_period_days: 0 },
      metadata: { user_id: userId },
    });
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Checkout session error:', err);
    res.status(500).json({ error: err.message || 'Failed to create checkout session' });
  }
});

router.get('/status', requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT status, current_period_end FROM subscriptions WHERE user_id = $1',
      [req.userId]
    );
    const { getSubscriptionStatus } = require('../middleware/subscription');
    const status = rows.length > 0
      ? getSubscriptionStatus(rows[0].status, rows[0].current_period_end)
      : 'inactive';
    res.json({ status, premium_active: status === 'premium_active' || status === 'premium_grace' });
  } catch (err) {
    console.error('Billing status error:', err);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

router.get('/portal-session', requireAuth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Billing not configured' });
  try {
    const { rows } = await query('SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1', [req.userId]);
    if (rows.length === 0 || !rows[0].stripe_customer_id) {
      return res.status(400).json({ error: 'No billing customer found' });
    }
    const origin = req.get('origin') || process.env.DOWNLOAD_BASE_URL || 'http://localhost:3000';
    const session = await stripe.billingPortal.sessions.create({
      customer: rows[0].stripe_customer_id,
      return_url: `${origin}/dashboard`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Portal session error:', err);
    res.status(500).json({ error: err.message || 'Failed to create portal session' });
  }
});

module.exports = router;
