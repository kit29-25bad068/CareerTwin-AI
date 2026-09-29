const mongoose = require('mongoose');

const careerEvidenceSchema = new mongoose.Schema(
  {
    learnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    skillName: {
      type: String,
      required: true,
      trim: true,
    },
    conceptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Concept',
      default: null,
    },
    source: {
      type: String,
      enum: ['resume', 'github', 'project', 'manual'],
      default: 'manual',
    },
    claimedProficiency: {
      type: Number,
      min: 0,
      max: 100,
      default: 75,
    },
    verifiedProficiency: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    status: {
      type: String,
      enum: ['claimed', 'verifying', 'verified', 'stale'],
      default: 'claimed',
      index: true,
    },
    evidenceDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

careerEvidenceSchema.index({ learnerId: 1, skillName: 1 });

module.exports = mongoose.model('CareerEvidence', careerEvidenceSchema);
