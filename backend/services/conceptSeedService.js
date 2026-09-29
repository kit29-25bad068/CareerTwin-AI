const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Concept = require('../models/Concept');
const Question = require('../models/Question');
const AdaptiveConfig = require('../models/AdaptiveConfig');
const User = require('../models/User');

const { CONCEPTS_DATA } = require('./conceptData');
const { QUESTIONS_DATA } = require('./questionData');

async function seedAdaptiveSystem() {
  console.log('🌱 [Adaptive Seeding] Initializing Concept Graph, Questions, Config, and Demo Users...');
  const connUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/careertwin';

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(connUri, { serverSelectionTimeoutMS: 8000 });
    console.log('[Adaptive Seeding] Connected to MongoDB Atlas.');
  }

  // 1. Seed or Update Adaptive Config
  let config = await AdaptiveConfig.findOne({ configurationVersion: '1.0' });
  if (!config) {
    config = await AdaptiveConfig.create({
      configurationVersion: '1.0',
      practiceThreshold: 60,
      advanceThreshold: 75,
      challengeThreshold: 85,
      uncertaintyThreshold: 40,
      prerequisiteThreshold: 70,
      decayWindowDays: 14,
      hintPenalty: 0.25,
      retryPenalty: 0.35,
      transferWeight: 1.5,
      isActive: true,
    });
    console.log('✅ Adaptive Config 1.0 initialized.');
  } else {
    console.log('ℹ️ Adaptive Config 1.0 verified.');
  }

  // 2. Seed Concepts with Prerequisites
  const slugToIdMap = {};
  for (const c of CONCEPTS_DATA) {
    let concept = await Concept.findOne({ slug: c.slug });
    if (!concept) {
      concept = await Concept.create({
        slug: c.slug,
        name: c.name,
        order: c.order,
        description: c.description,
        category: c.category,
        requiredMastery: c.requiredMastery,
        difficultyRange: c.difficultyRange,
        active: true,
      });
      console.log(`   + Created Concept [${c.order}]: ${c.name}`);
    } else {
      concept.name = c.name;
      concept.order = c.order;
      concept.description = c.description;
      concept.requiredMastery = c.requiredMastery;
      concept.difficultyRange = c.difficultyRange;
      await concept.save();
    }
    slugToIdMap[c.slug] = concept._id;
  }

  // Update prerequisite ObjectId links
  for (const c of CONCEPTS_DATA) {
    const prereqIds = (c.prereqSlugs || []).map((slug) => slugToIdMap[slug]).filter(Boolean);
    await Concept.updateOne({ slug: c.slug }, { $set: { prerequisites: prereqIds } });
  }
  console.log(`✅ ${CONCEPTS_DATA.length} Concepts verified with instructional prerequisite relationships.`);

  // 3. Seed Questions
  let questionsCreated = 0;
  for (const q of QUESTIONS_DATA) {
    const conceptId = slugToIdMap[q.conceptSlug];
    if (!conceptId) continue;

    const existing = await Question.findOne({ question: q.question });
    if (!existing) {
      await Question.create({
        conceptId,
        question: q.question,
        type: q.type,
        difficulty: q.difficulty,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        codeSnippet: q.codeSnippet || '',
        explanation: q.explanation,
        questionVersion: 1,
        generatedBy: 'curriculum_expert',
        active: true,
      });
      questionsCreated++;
    }
  }
  const totalQuestions = await Question.countDocuments();
  console.log(`✅ Questions Seeded. Total active in database: ${totalQuestions}`);

  // 4. Seed Demo Users (1 Teacher, 3 Students)
  const demoUsers = [
    {
      name: 'Prof. Marcus Vance',
      email: 'teacher@careertwin.ai',
      password: 'TeacherPass123!',
      role: 'teacher',
      githubUrl: 'https://github.com/careertwin-instructor',
    },
    {
      name: 'Alex Rivera (Steady Learner)',
      email: 'alex@careertwin.ai',
      password: 'StudentPass123!',
      role: 'student',
      githubUrl: 'https://github.com/alexrivera-dev',
    },
    {
      name: 'Sam Chen (Decay / Gap Learner)',
      email: 'sam@careertwin.ai',
      password: 'StudentPass123!',
      role: 'student',
      githubUrl: 'https://github.com/samchen-coder',
    },
    {
      name: 'Elena Gomez (Active Student)',
      email: 'elena@careertwin.ai',
      password: 'StudentPass123!',
      role: 'student',
      githubUrl: 'https://github.com/elenagomez-eng',
    },
  ];

  for (const u of demoUsers) {
    const existing = await User.findOne({ email: u.email });
    if (!existing) {
      await User.create({
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role,
        githubUrl: u.githubUrl,
        githubUsername: u.email.split('@')[0],
      });
      console.log(`   + Created Demo Account: [${u.role.toUpperCase()}] ${u.name} (${u.email})`);
    } else if (!existing.role || existing.role !== u.role) {
      existing.role = u.role;
      await existing.save();
    }
  }
  console.log('✅ Demo accounts verified.');

  console.log('🎉 [Adaptive Seeding] Phase 1 Seeding Complete!\n');
  return {
    conceptsCount: CONCEPTS_DATA.length,
    questionsCount: totalQuestions,
  };
}

if (require.main === module) {
  seedAdaptiveSystem()
    .then(() => {
      console.log('Seed execution finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seeding error:', err);
      process.exit(1);
    });
}

module.exports = { seedAdaptiveSystem };
