const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const { chatWithAI } = require('../services/aiService');

// POST /api/chat  — general chatbot
router.post('/', protect, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages))
      return res.status(400).json({ message: 'Messages array required' });

    const user = await User.findById(req.user._id).select('name careerDomain skills');
    const reply = await chatWithAI(messages, user);
    res.json({ reply: reply.trim() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
