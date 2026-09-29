const mongoose = require('mongoose');

const learningPathSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['locked', 'ready', 'in_progress', 'completed', 'review_needed'],
      default: 'locked',
      index: true,
    },
    recommendedAction: {
      type: String,
      enum: ['ADVANCE', 'PRACTICE', 'REVIEW', 'REMEDIATE_PREREQUISITE', 'CHALLENGE', 'TEACHER_INTERVENTION'],
      default: 'PRACTICE',
    },
    priority: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
    },
    reason: {
      type: String,
      default: '',
    },
    decisionFactors: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdFromDecisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Decision',
      default: null,
    },
    teacherOverrideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherOverride',
      default: null,
    },
    position: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

learningPathSchema.index({ learnerId: 1, conceptId: 1 }, { unique: true });
learningPathSchema.index({ learnerId: 1, position: 1 });

module.exports = mongoose.model('LearningPath', learningPathSchema);
