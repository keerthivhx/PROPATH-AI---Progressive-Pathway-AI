const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  linkedin: { type: String, default: '' },
  github: { type: String, default: '' },
  avatar: { type: String, default: '' },
  careerDomain: { type: String, default: '' },
  assessmentCompleted: { type: Boolean, default: false },
  assessmentHistory: [
    {
      question: String,
      answer: String,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  skills: [String],
  roadmapProgress: {
    type: Map,
    of: Boolean,
    default: {}
  },
  roadmap: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  interviewResults: [
    {
      domain: String,
      score: Number,
      level: String,
      strongAreas: [String],
      improvementAreas: [String],
      feedback: String,
      questions: [
        {
          question: String,
          answer: String,
          evaluation: String,
          score: Number
        }
      ],
      completedAt: { type: Date, default: Date.now }
    }
  ],
  projectSubmissions: [
    {
      title: String,
      description: String,
      repoUrl: String,
      language: String,
      code: String,
      validationResult: String,
      validationScore: Number,
      status: { type: String, enum: ['pending', 'validated', 'rejected'], default: 'pending' },
      submittedAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
