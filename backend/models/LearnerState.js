const mongoose = require('mongoose');

const learnerStateSchema = new mongoose.Schema(
  {
    learnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conceptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Concept',
      required: true,
      index: true,
    },
    mastery: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    uncertainty: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 100,
    },
    evidenceCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    recentPerformance: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    historicalPerformance: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
    lastStrongEvidenceAt: {
      type: Date,
      default: null,
    },
    hintRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    rapidRetryCount: {
      type: Number,
      default: 0,
    },
    transferPerformance: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    masteryVersion: {
      type: Number,
      default: 1,
    },
    isStale: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

learnerStateSchema.index({ learnerId: 1, conceptId: 1 }, { unique: true });

module.exports = mongoose.model('LearnerState', learnerStateSchema);
