const mongoose = require('mongoose');

const unifiedSkillSchema = new mongoose.Schema({
  skillName: {
    type: String,
    required: true,
    trim: true,
  },
  normalizedName: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    default: 'Other Technical Skills',
  },
  sources: {
    type: [String],
    enum: ['resume', 'github'],
    default: ['resume'],
  },
  primarySource: {
    type: String,
    enum: ['resume', 'github', 'both'],
    default: 'resume',
  },
  evidence: {
    resume: {
      found: { type: Boolean, default: false },
      section: { type: String, default: '' },
      excerpt: { type: String, default: '' },
      confidence: { type: Number, default: 0 },
    },
    github: [
      {
        repo: { type: String, default: '' },
        repoUrl: { type: String, default: '' },
        file: { type: String, default: '' },
        evidenceType: {
          type: String,
          enum: ['implementation', 'dependency', 'documentation'],
          default: 'implementation',
        },
        snippet: { type: String, default: '' },
        confidence: { type: Number, default: 0 },
      },
    ],
  },
  extractionConfidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 70,
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'verifying', 'verified'],
    default: 'unverified',
  },
  mastery: {
    type: Number,
    min: 0,
    max: 100,
    default: null,
  },
  verifiedAt: {
    type: Date,
    default: null,
  },
});

const unifiedSkillInventorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    summary: {
      totalUnique: { type: Number, default: 0 },
      resumeCount: { type: Number, default: 0 },
      githubCount: { type: Number, default: 0 },
      bothCount: { type: Number, default: 0 },
    },
    sourcesStatus: {
      hasResume: { type: Boolean, default: false },
      resumeFileName: { type: String, default: '' },
      hasGithub: { type: Boolean, default: false },
      githubUsername: { type: String, default: '' },
      analyzedReposCount: { type: Number, default: 0 },
      partialMode: {
        type: String,
        enum: ['complete', 'resume-only', 'github-only', 'none'],
        default: 'none',
      },
      extractionNotes: [String],
    },
    skills: [unifiedSkillSchema],
    lastExtractedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('UnifiedSkillInventory', unifiedSkillInventorySchema);
