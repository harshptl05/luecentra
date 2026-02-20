const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireDevice } = require('../middleware/device');
const { requirePremium } = require('../middleware/subscription');

const router = express.Router();

// Example protected AI endpoint: gating logic only; echoes input for now.
// Later: proxy to OpenAI/Deepgram and return real response.
router.post('/answer', requireAuth, requireDevice, requirePremium, async (req, res) => {
  try {
    const body = req.body || {};
    const { message, context } = body;
    res.json({
      success: true,
      echo: { message: message || '', context: context || '' },
      note: 'Replace this with real AI provider call (OpenAI/Deepgram proxy).',
    });
  } catch (err) {
    console.error('AI answer error:', err);
    res.status(500).json({ error: 'AI request failed' });
  }
});

module.exports = router;
