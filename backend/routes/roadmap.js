const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const { generatePersonalizedRoadmap } = require('../services/aiService');

// GET /api/roadmap  — get or generate roadmap
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.careerDomain)
      return res.status(400).json({ message: 'Complete domain assessment first' });

    // Check if roadmap exists in DB
    if (user.roadmap && user.roadmap.years && user.roadmap.years.length > 0) {
      return res.json({ roadmap: user.roadmap, progress: Object.fromEntries(user.roadmapProgress || new Map()) });
    }

    // Generate new roadmap
    const roadmap = await generatePersonalizedRoadmap(user.careerDomain, user);
    user.roadmap = roadmap;
    await user.save();
    res.json({ roadmap, progress: {} });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/roadmap/regenerate  — force regenerate
router.post('/regenerate', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.careerDomain)
      return res.status(400).json({ message: 'Complete domain assessment first' });
    const roadmap = await generatePersonalizedRoadmap(user.careerDomain, user);
    user.roadmap = roadmap;
    user.roadmapProgress = new Map();
    await user.save();
    res.json({ roadmap, progress: {} });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/roadmap/progress  — update topic progress
router.patch('/progress', protect, async (req, res) => {
  try {
    const { topicKey, completed } = req.body;
    const user = await User.findById(req.user._id);
    if (!user.roadmapProgress) user.roadmapProgress = new Map();
    user.roadmapProgress.set(topicKey, completed);
    user.markModified('roadmapProgress');
    await user.save();
    res.json({ progress: Object.fromEntries(user.roadmapProgress) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
