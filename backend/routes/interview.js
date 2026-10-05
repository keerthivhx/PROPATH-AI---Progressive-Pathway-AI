const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const {
  generateInterviewQuestion,
  evaluateInterviewAnswer,
  generateInterviewResult
} = require('../services/aiService');

// Active interview sessions stored in memory (keyed by userId)
const interviewSessions = new Map();

// POST /api/interview/start  — start new interview session
router.post('/start', protect, async (req, res) => {
  try {
    const { language } = req.body;
    const user = await User.findById(req.user._id);
    if (!user.careerDomain)
      return res.status(400).json({ message: 'Complete domain assessment first' });

    const completedTopics = user.roadmapProgress
      ? Array.from(user.roadmapProgress.entries()).filter(([, v]) => v).map(([k]) => k)
      : [];

    const session = {
      domain: user.careerDomain,
      language: language || 'English',
      history: [],
      completedTopics,
      startedAt: new Date()
    };
    interviewSessions.set(user._id.toString(), session);

    // Generate first question
    const firstQuestion = await generateInterviewQuestion(
      session.domain, [], completedTopics, session.language
    );

    session.history.push({ question: firstQuestion.trim(), answer: '', evaluation: '', score: 0 });

    res.json({
      sessionId: user._id.toString(),
      question: firstQuestion.trim(),
      questionNumber: 1,
      domain: session.domain,
      language: session.language
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/interview/answer  — submit answer, get evaluation + next question
router.post('/answer', protect, async (req, res) => {
  try {
    const { answer, finish } = req.body;
    const session = interviewSessions.get(req.user._id.toString());
    if (!session) return res.status(400).json({ message: 'No active interview session. Start first.' });

    const currentEntry = session.history[session.history.length - 1];
    currentEntry.answer = answer;

    // Evaluate the answer
    const evaluation = await evaluateInterviewAnswer(
      currentEntry.question, answer, session.domain, session.language
    );
    currentEntry.evaluation = evaluation.feedback;
    currentEntry.score = evaluation.score;
    currentEntry.keyPoints = evaluation.keyPoints;
    currentEntry.improvement = evaluation.improvement;

    const questionCount = session.history.length;

    // Finish if 10 questions or user requests finish
    if (finish || questionCount >= 10) {
      const result = await generateInterviewResult(session.domain, session.history);
      const user = await User.findById(req.user._id);
      user.interviewResults.push({
        domain: session.domain,
        score: result.overallScore,
        level: result.level,
        strongAreas: result.strongAreas,
        improvementAreas: result.improvementAreas,
        feedback: result.overallFeedback,
        questions: session.history.map(h => ({
          question: h.question,
          answer: h.answer,
          evaluation: h.evaluation,
          score: h.score
        }))
      });
      await user.save();
      interviewSessions.delete(req.user._id.toString());
      return res.json({ completed: true, evaluation, result, history: session.history });
    }

    // Generate next question
    const nextQuestion = await generateInterviewQuestion(
      session.domain, session.history, session.completedTopics, session.language
    );
    session.history.push({ question: nextQuestion.trim(), answer: '', evaluation: '', score: 0 });

    res.json({
      completed: false,
      evaluation,
      nextQuestion: nextQuestion.trim(),
      questionNumber: questionCount + 1
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/interview/results  — get all past interview results
router.get('/results', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('interviewResults');
    res.json(user.interviewResults);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
