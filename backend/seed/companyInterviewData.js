const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });
if (!process.env.MONGO_URI) {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

const CompanyInterviewData = require('../models/CompanyInterviewData');

// 18 Standardized Categories
const VALID_CATEGORIES = [
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
];

/**
 * Main Seed / Import Function
 */
async function importCompanyInterviewDatabase() {
  console.log('====================================================');
  console.log('🚀 IMPORTING COMPANY INTERVIEW DATASET INTO MONGODB');
  console.log('====================================================');

  const jsonPath = path.join(__dirname, '../data/company_interviews.json');

  // If JSON does not exist, run extraction script
  if (!fs.existsSync(jsonPath)) {
    console.log('📦 JSON data not found. Executing python extraction...');
    const pyScript = path.join(__dirname, '../scripts/extractInterviews.py');
    execSync(`python "${pyScript}"`, { stdio: 'inherit' });
  }

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Failed to find extracted interview dataset at ${jsonPath}`);
  }

  const rawJson = fs.readFileSync(jsonPath, 'utf8');
  const extractedData = JSON.parse(rawJson);
  const companyNames = Object.keys(extractedData);

  console.log(`🏢 Extracted data verified for ${companyNames.length} companies.`);

  // Connect to MongoDB using existing connection string
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/careertwin';
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB host:', mongoose.connection.host);

  const importSummary = {};
  let totalAllQuestions = 0;

  // Transform and Upsert each Company document
  for (const company of companyNames) {
    const questions = extractedData[company];
    const compSlug = company.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Initialize category buckets
    const categoriesDoc = {};
    VALID_CATEGORIES.forEach((cat) => {
      categoriesDoc[cat] = [];
    });

    const availableCategoriesSet = new Set();

    questions.forEach((q, idx) => {
      const qCat = VALID_CATEGORIES.includes(q.category) ? q.category : 'other';
      const qId = `${compSlug}_${qCat}_${(idx + 1).toString().padStart(3, '0')}`;
      const item = {
        id: qId,
        question: q.question,
        category: qCat,
        sourceType: 'database_question',
        company,
        datasetSource: 'uploaded_word_document',
      };

      if (!categoriesDoc[qCat]) {
        categoriesDoc[qCat] = [];
      }
      categoriesDoc[qCat].push(item);
      availableCategoriesSet.add(qCat);
    });

    const docToUpsert = {
      company,
      categories: categoriesDoc,
      metadata: {
        source: 'Uploaded Company Interview Dataset',
        datasetSource: 'uploaded_word_document',
        importedAt: new Date(),
        totalQuestions: questions.length,
        availableCategories: Array.from(availableCategoriesSet),
      },
    };

    // Safe Idempotent Upsert (does NOT touch any other collections)
    await CompanyInterviewData.findOneAndUpdate(
      { company },
      docToUpsert,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    importSummary[company] = questions.length;
    totalAllQuestions += questions.length;
  }

  // Verification Summary (Requirement 25)
  console.log('\n====================================================');
  console.log('📊 Company Interview Database Import Summary');
  console.log('====================================================');
  for (const [comp, count] of Object.entries(importSummary)) {
    console.log(`  ${comp.padEnd(25)}: ${count} questions`);
  }
  console.log('----------------------------------------------------');
  console.log(`  TOTAL QUESTIONS IMPORTED : ${totalAllQuestions} questions`);
  console.log('====================================================\n');

  return { success: true, summary: importSummary, totalQuestions: totalAllQuestions };
}

// Execute directly if run via CLI
if (require.main === module) {
  importCompanyInterviewDatabase()
    .then(() => {
      console.log('✅ Company interview data imported successfully.');
      mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Import failed:', err);
      mongoose.disconnect();
      process.exit(1);
    });
}

module.exports = {
  importCompanyInterviewDatabase,
  VALID_CATEGORIES,
};
