const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// GET /api/profile  — get full profile
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/profile  — update profile fields
router.patch('/', protect, async (req, res) => {
  try {
    const { name, linkedin, github, avatar } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (linkedin !== undefined) user.linkedin = linkedin;
    if (github !== undefined) user.github = github;
    if (avatar !== undefined) user.avatar = avatar;
    await user.save();
    res.json({ message: 'Profile updated', user: { name: user.name, linkedin: user.linkedin, github: user.github, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/profile/portfolio  — get portfolio data
router.get('/portfolio', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const portfolio = {
      name: user.name,
      email: user.email,
      linkedin: user.linkedin,
      github: user.github,
      avatar: user.avatar,
      careerDomain: user.careerDomain,
      skills: user.skills,
      projects: user.projectSubmissions.filter(p => p.status === 'validated'),
      interviewResults: user.interviewResults,
      assessmentCompleted: user.assessmentCompleted,
      totalProjects: user.projectSubmissions.length,
      validatedProjects: user.projectSubmissions.filter(p => p.status === 'validated').length,
      bestInterviewScore: user.interviewResults.length > 0
        ? Math.max(...user.interviewResults.map(r => r.score))
        : null,
      roadmapProgress: Object.fromEntries(user.roadmapProgress || new Map()),
      joinedAt: user.createdAt
    };
    res.json(portfolio);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/profile/dashboard  — dashboard stats
router.get('/dashboard', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const progressMap = Object.fromEntries(user.roadmapProgress || new Map());
    const totalTopics = Object.keys(progressMap).length;
    const completedTopics = Object.values(progressMap).filter(Boolean).length;

    res.json({
      name: user.name,
      careerDomain: user.careerDomain,
      assessmentCompleted: user.assessmentCompleted,
      skills: user.skills,
      roadmapProgress: {
        total: totalTopics,
        completed: completedTopics,
        percentage: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0
      },
      projectStats: {
        total: user.projectSubmissions.length,
        validated: user.projectSubmissions.filter(p => p.status === 'validated').length,
        pending: user.projectSubmissions.filter(p => p.status === 'pending').length
      },
      interviewStats: {
        total: user.interviewResults.length,
        bestScore: user.interviewResults.length > 0
          ? Math.max(...user.interviewResults.map(r => r.score))
          : 0,
        latestLevel: user.interviewResults.length > 0
          ? user.interviewResults[user.interviewResults.length - 1].level
          : null
      },
      recentActivity: [
        ...user.projectSubmissions.slice(-3).map(p => ({
          type: 'project', title: p.title, status: p.status, date: p.submittedAt
        })),
        ...user.interviewResults.slice(-2).map(r => ({
          type: 'interview', title: `${r.domain} Interview`, status: r.level, date: r.completedAt
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
