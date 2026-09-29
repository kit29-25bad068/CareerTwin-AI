const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    conceptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Concept',
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: [true, 'Question prompt is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['MCQ', 'Code Output', 'Debugging', 'Coding', 'Scenario', 'Transfer'],
      default: 'MCQ',
      index: true,
    },
    difficulty: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 3,
      index: true,
    },
    options: [
      {
        type: String,
        trim: true,
      },
    ],
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer is required'],
      trim: true,
    },
    codeSnippet: {
      type: String,
      default: '',
    },
    explanation: {
      type: String,
      required: [true, 'Explanation is required for evidence feedback'],
      trim: true,
    },
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Concept',
      },
    ],
    questionVersion: {
      type: Number,
      default: 1,
    },
    generatedBy: {
      type: String,
      enum: ['curriculum_expert', 'ai_gemini', 'teacher'],
      default: 'curriculum_expert',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Question', questionSchema);
