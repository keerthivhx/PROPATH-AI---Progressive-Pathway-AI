const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateJobDescription } = require('../services/aiService');

// POST /api/jd/validate  — validate a job description
router.post('/validate', protect, async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription || jobDescription.trim().length < 50)
      return res.status(400).json({ message: 'Please provide a complete job description (minimum 50 characters)' });
    const result = await validateJobDescription(jobDescription);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
