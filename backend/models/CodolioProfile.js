const mongoose = require('mongoose');

const codolioProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    profileUrl: {
      type: String,
      trim: true,
    },
    name: String,
    avatarUrl: String,
    bio: String,
    totalSolved: { type: Number, default: 0 },
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },
    activeStreakDays: { type: Number, default: 0 },
    totalContests: { type: Number, default: 0 },
    platforms: [
      {
        platform: String,
        handle: String,
        rating: Number,
        rank: String,
        solvedCount: Number,
        profileUrl: String,
      },
    ],
    topicBreakdown: [
      {
        topic: String,
        solvedCount: Number,
      },
    ],
    analysis: {
      codingScore: { type: Number, default: 0 },
      problemSolvingTier: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Competitive Master'],
        default: 'Intermediate',
      },
      consistencyScore: { type: Number, default: 0 },
      algorithmBreadthScore: { type: Number, default: 0 },
      strengths: [String],
      weaknesses: [String],
      recommendations: [String],
      summary: String,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CodolioProfile', codolioProfileSchema);
