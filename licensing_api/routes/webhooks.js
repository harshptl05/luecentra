const Stripe = require('stripe');
const { query } = require('../db');

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' }) : null;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

async function stripeWebhookHandler(req, res) {
  if (!stripe || !WEBHOOK_SECRET) {
    return res.status(503).send('Webhooks not configured');
  }
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const subId = session.subscription;
        if (userId && subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const customerId = session.customer;
          await query(
            `INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end, updated_at)
             VALUES ($1, $2, $3, $4, to_timestamp($5), NOW())
             ON CONFLICT (user_id) DO UPDATE SET
               stripe_customer_id = EXCLUDED.stripe_customer_id,
               stripe_subscription_id = EXCLUDED.stripe_subscription_id,
               status = EXCLUDED.status,
               current_period_end = EXCLUDED.current_period_end,
               updated_at = NOW()`,
            [userId, customerId, subId, sub.status, sub.current_period_end]
          );
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const { rows } = await query(
          'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1',
          [sub.id]
        );
        if (rows.length > 0) {
          await query(
            `UPDATE subscriptions SET status = $1, current_period_end = to_timestamp($2), updated_at = NOW() WHERE user_id = $3`,
            [sub.status, sub.current_period_end, rows[0].user_id]
          );
        } else {
          const customerId = sub.customer;
          const { rows: byCustomer } = await query(
            'SELECT user_id FROM subscriptions WHERE stripe_customer_id = $1',
            [customerId]
          );
          if (byCustomer.length > 0) {
            await query(
              `UPDATE subscriptions SET stripe_subscription_id = $1, status = $2, current_period_end = to_timestamp($3), updated_at = NOW() WHERE user_id = $4`,
              [sub.id, sub.status, sub.current_period_end, byCustomer[0].user_id]
            );
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await query(
          'UPDATE subscriptions SET status = $1, updated_at = NOW() WHERE stripe_subscription_id = $2',
          ['canceled', sub.id]
        );
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.subscription && invoice.billing_reason === 'subscription_cycle') {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription);
          await query(
            'UPDATE subscriptions SET current_period_end = to_timestamp($1), updated_at = NOW() WHERE stripe_subscription_id = $2',
            [sub.current_period_end, sub.id]
          );
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          await query(
            'UPDATE subscriptions SET status = $1, updated_at = NOW() WHERE stripe_subscription_id = $2',
            ['past_due', invoice.subscription]
          );
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).send('Webhook handler failed');
  }
  res.json({ received: true });
}

module.exports = { stripeWebhookHandler };
