const mongoose = require('mongoose');

const adaptiveConfigSchema = new mongoose.Schema(
  {
    configurationVersion: {
      type: String,
      required: true,
      unique: true,
      default: '1.0',
    },
    practiceThreshold: {
      type: Number,
      default: 60,
      min: 0,
      max: 100,
      description: 'Mastery below this threshold triggers PRACTICE',
    },
    advanceThreshold: {
      type: Number,
      default: 75,
      min: 0,
      max: 100,
      description: 'Mastery above this threshold with low uncertainty triggers ADVANCE',
    },
    challengeThreshold: {
      type: Number,
      default: 85,
      min: 0,
      max: 100,
      description: 'High mastery with uncertainty triggers CHALLENGE verification',
    },
    uncertaintyThreshold: {
      type: Number,
      default: 40,
      min: 0,
      max: 100,
      description: 'Uncertainty level above which verification is required',
    },
    prerequisiteThreshold: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
      description: 'Minimum prerequisite mastery required to unlock/advance concept',
    },
    decayWindowDays: {
      type: Number,
      default: 14,
      min: 1,
      description: 'Days of inactivity before evidence is considered stale',
    },
    hintPenalty: {
      type: Number,
      default: 0.25,
      min: 0,
      max: 1,
      description: 'Evidence weight reduction per hint',
    },
    retryPenalty: {
      type: Number,
      default: 0.35,
      min: 0,
      max: 1,
      description: 'Evidence weight reduction for rapid repeat attempts',
    },
    transferWeight: {
      type: Number,
      default: 1.5,
      min: 1.0,
      max: 3.0,
      description: 'Evidence weight multiplier for transfer/deep application tasks',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AdaptiveConfig', adaptiveConfigSchema);
