const mongoose = require('mongoose');

const decisionSchema = new mongoose.Schema(
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
    action: {
      type: String,
      enum: ['ADVANCE', 'PRACTICE', 'REVIEW', 'REMEDIATE_PREREQUISITE', 'CHALLENGE', 'TEACHER_INTERVENTION'],
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    decisionFactors: {
      mastery: { type: Number, default: 0 },
      uncertainty: { type: Number, default: 100 },
      prerequisiteBlocked: { type: Boolean, default: false },
      blockedPrerequisites: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Concept',
        },
      ],
      staleEvidence: { type: Boolean, default: false },
      recentFailures: { type: Number, default: 0 },
      transferPerformance: { type: Number, default: null },
      evidenceQuality: { type: Number, default: 1.0 },
      thresholdsApplied: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    previousState: {
      mastery: { type: Number, default: 0 },
      uncertainty: { type: Number, default: 100 },
    },
    resultingState: {
      mastery: { type: Number, default: 0 },
      uncertainty: { type: Number, default: 100 },
    },
    evidenceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attempt',
      },
    ],
    configurationVersion: {
      type: String,
      default: '1.0',
    },
    masteryVersion: {
      type: Number,
      default: 1,
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

decisionSchema.index({ learnerId: 1, timestamp: -1 });

module.exports = mongoose.model('Decision', decisionSchema);
