require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { stripeWebhookHandler } = require('./routes/webhooks');

const authRoutes = require('./routes/auth');
const billingRoutes = require('./routes/billing');
const deviceRoutes = require('./routes/device');
const aiRoutes = require('./routes/ai');
const downloadsRoutes = require('./routes/downloads');

const app = express();
const PORT = process.env.PORT || 4000;

// Stripe webhook must receive raw body
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookHandler);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'pulse-licensing-api' });
});

app.use('/auth', authRoutes);
app.use('/billing', billingRoutes);
app.use('/device', deviceRoutes);
app.use('/ai', aiRoutes);
app.use('/downloads', downloadsRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Pulse Licensing API listening on port ${PORT}`);
});
