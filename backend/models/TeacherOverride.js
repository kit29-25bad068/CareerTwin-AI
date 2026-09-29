const mongoose = require('mongoose');

const teacherOverrideSchema = new mongoose.Schema(
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
    },
    originalDecisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Decision',
      required: true,
    },
    originalAction: {
      type: String,
      required: true,
    },
    teacherAction: {
      type: String,
      enum: ['ADVANCE', 'PRACTICE', 'REVIEW', 'REMEDIATE_PREREQUISITE', 'CHALLENGE', 'TEACHER_INTERVENTION'],
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Teacher must provide an instructional rationale for overriding the adaptive engine'],
      trim: true,
    },
    configurationVersion: {
      type: String,
      default: '1.0',
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

module.exports = mongoose.model('TeacherOverride', teacherOverrideSchema);
