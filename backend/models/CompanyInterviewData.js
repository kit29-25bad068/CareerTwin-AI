const mongoose = require('mongoose');

const questionItemSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'introduction',
        'resume',
        'project',
        'dsa',
        'programming',
        'oop',
        'dbms',
        'operatingSystems',
        'computerNetworks',
        'systemDesign',
        'behavioral',
        'hr',
        'problemSolving',
        'testing',
        'debugging',
        'performance',
        'scalability',
        'other',
      ],
      default: 'other',
    },
    sourceType: {
      type: String,
      default: 'database_question',
    },
    company: {
      type: String,
      required: true,
    },
    datasetSource: {
      type: String,
      default: 'uploaded_word_document',
    },
  },
  { _id: false }
);

const companyInterviewDataSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    categories: {
      introduction: [questionItemSchema],
      resume: [questionItemSchema],
      project: [questionItemSchema],
      dsa: [questionItemSchema],
      programming: [questionItemSchema],
      oop: [questionItemSchema],
      dbms: [questionItemSchema],
      operatingSystems: [questionItemSchema],
      computerNetworks: [questionItemSchema],
      systemDesign: [questionItemSchema],
      behavioral: [questionItemSchema],
      hr: [questionItemSchema],
      problemSolving: [questionItemSchema],
      testing: [questionItemSchema],
      debugging: [questionItemSchema],
      performance: [questionItemSchema],
      scalability: [questionItemSchema],
      other: [questionItemSchema],
    },
    metadata: {
      source: {
        type: String,
        default: 'Uploaded Company Interview Dataset',
      },
      datasetSource: {
        type: String,
        default: 'uploaded_word_document',
      },
      importedAt: {
        type: Date,
        default: Date.now,
      },
      totalQuestions: {
        type: Number,
        default: 0,
      },
      availableCategories: [String],
    },
  },
  {
    timestamps: true,
    collection: 'companyInterviewData',
  }
);

module.exports = mongoose.model('CompanyInterviewData', companyInterviewDataSchema);
