const mongoose = require('mongoose');

const interventionSchema = new mongoose.Schema(
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
      default: null,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    triggerType: {
      type: String,
      enum: [
        'CONSECUTIVE_FAILURES',
        'CONFLICTING_EVIDENCE_HIGH_UNCERTAINTY',
        'PREREQUISITE_STALL',
        'MANUAL_TEACHER',
        'KNOWLEDGE_DECAY_STALL',
      ],
      required: true,
      index: true,
    },
    triggerDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'],
      default: 'PENDING',
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Intervention', interventionSchema);
