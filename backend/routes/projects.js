const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const { validateProject, validateTaskAnswer } = require('../services/aiService');

// POST /api/projects/submit  — submit project for AI validation
router.post('/submit', protect, async (req, res) => {
  try {
    const { title, description, repoUrl, language, code } = req.body;
    if (!title || !code)
      return res.status(400).json({ message: 'Title and code are required' });

    const user = await User.findById(req.user._id);
    const validation = await validateProject({
      title, description, repoUrl, language, code,
      domain: user.careerDomain
    });

    const submission = {
      title,
      description,
      repoUrl: repoUrl || '',
      language: language || 'javascript',
      code,
      validationResult: validation.feedback,
      validationScore: validation.score,
      status: validation.status === 'validated' ? 'validated' : validation.status === 'rejected' ? 'rejected' : 'pending'
    };

    user.projectSubmissions.push(submission);
    await user.save();

    res.json({
      submission,
      validation
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/projects  — get all project submissions
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('projectSubmissions');
    res.json(user.projectSubmissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects/validate-task  — validate a roadmap learning task answer
router.post('/validate-task', protect, async (req, res) => {
  try {
    const { task, answer, language } = req.body;
    if (!task || !answer)
      return res.status(400).json({ message: 'Task and answer required' });
    const result = await validateTaskAnswer(task, answer, language);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
