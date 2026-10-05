const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const {
  generateNextAssessmentQuestion,
  analyzeAssessmentAndIdentifyDomain
} = require('../services/aiService');

// GET /api/assessment/question  — get next adaptive question
router.get('/question', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.assessmentCompleted)
      return res.status(400).json({ message: 'Assessment already completed', domain: user.careerDomain });

    if (user.assessmentHistory.length >= 10) {
      // Auto-finalize if somehow reached 10 without completing
      const result = await analyzeAssessmentAndIdentifyDomain(user.assessmentHistory, user);
      user.careerDomain = result.domain;
      user.assessmentCompleted = true;
      if (result.suggestedSkills) user.skills = result.suggestedSkills;
      await user.save();
      return res.json({ completed: true, result });
    }

    const question = await generateNextAssessmentQuestion(user.assessmentHistory, user);
    res.json({
      question: question.trim(),
      questionNumber: user.assessmentHistory.length + 1,
      totalQuestions: 10
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/assessment/answer  — submit answer, get next question or result
router.post('/answer', protect, async (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer)
      return res.status(400).json({ message: 'Question and answer required' });

    const user = await User.findById(req.user._id);
    if (user.assessmentCompleted)
      return res.status(400).json({ message: 'Assessment already completed' });

    user.assessmentHistory.push({ question, answer });
    await user.save();

    if (user.assessmentHistory.length >= 10) {
      // All 10 questions answered — analyze
      const result = await analyzeAssessmentAndIdentifyDomain(user.assessmentHistory, user);
      user.careerDomain = result.domain;
      user.assessmentCompleted = true;
      if (result.suggestedSkills) user.skills = result.suggestedSkills;
      await user.save();
      return res.json({ completed: true, result });
    }

    // Get next adaptive question
    const nextQuestion = await generateNextAssessmentQuestion(user.assessmentHistory, user);
    res.json({
      completed: false,
      nextQuestion: nextQuestion.trim(),
      questionNumber: user.assessmentHistory.length + 1,
      totalQuestions: 10
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/assessment/result  — get stored result
router.get('/result', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.assessmentCompleted)
      return res.status(400).json({ message: 'Assessment not completed yet' });
    res.json({
      domain: user.careerDomain,
      history: user.assessmentHistory,
      skills: user.skills
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/assessment/reset  — reset and retake
router.delete('/reset', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.assessmentHistory = [];
    user.assessmentCompleted = false;
    user.careerDomain = '';
    await user.save();
    res.json({ message: 'Assessment reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
