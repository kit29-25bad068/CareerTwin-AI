const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema(
  {
    learnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true,
    },
    conceptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Concept',
      required: true,
      index: true,
    },
    correct: {
      type: Boolean,
      required: true,
    },
    userAnswer: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    difficulty: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    responseTime: {
      type: Number,
      required: true,
      min: 0,
      description: 'Response time in seconds',
    },
    confidence: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    hintsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    attemptNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
    evidenceWeight: {
      type: Number,
      default: 1.0,
      min: 0.0,
      max: 3.0,
    },
    evidenceQuality: {
      type: String,
      enum: ['STRONG', 'MODERATE', 'WEAK', 'NEGATIVE', 'NEUTRAL'],
      default: 'MODERATE',
    },
    isRapidRetry: {
      type: Boolean,
      default: false,
    },
    isRepeatedQuestion: {
      type: Boolean,
      default: false,
    },
    questionType: {
      type: String,
      enum: ['MCQ', 'Code Output', 'Debugging', 'Coding', 'Scenario', 'Transfer'],
      default: 'MCQ',
    },
    questionVersion: {
      type: Number,
      default: 1,
    },
    sessionId: {
      type: String,
      default: null,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

attemptSchema.index({ learnerId: 1, conceptId: 1, timestamp: -1 });

module.exports = mongoose.model('Attempt', attemptSchema);
