const mongoose = require('mongoose');

const conceptSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, 'Concept name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      default: 'Java Programming Fundamentals',
    },
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Concept',
      },
    ],
    requiredMastery: {
      type: Number,
      min: 0,
      max: 100,
      default: 70,
    },
    order: {
      type: Number,
      required: true,
      default: 1,
    },
    difficultyRange: {
      min: { type: Number, default: 1 },
      max: { type: Number, default: 5 },
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

module.exports = mongoose.model('Concept', conceptSchema);
