const http = require('http');
const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Concept = require('../backend/models/Concept');
const Question = require('../backend/models/Question');
const Attempt = require('../backend/models/Attempt');
const LearnerState = require('../backend/models/LearnerState');
const Decision = require('../backend/models/Decision');
const LearningPath = require('../backend/models/LearningPath');
const User = require('../backend/models/User');

const { evaluatePrerequisites } = require('../backend/services/prerequisiteEngine');
const { evaluateConceptDecay } = require('../backend/services/decayEngine');
const { getNextLearningAction } = require('../backend/services/adaptiveEngine');
const { selectOptimalQuestion } = require('../backend/services/questionSelector');

const PORT = 5004;
process.env.PORT = PORT;
process.env.NODE_ENV = 'test';

async function runPhase3Tests() {
  console.log('🧪 =======================================================');
  console.log('🧪 Starting Phase 3 Adaptive Decision Engine Verification');
  console.log('🧪 =======================================================\n');

  const app = require('../backend/server');
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`[Test Server] Live on http://localhost:${PORT}`);

  const baseUrl = `http://localhost:${PORT}/api/adaptive`;

  try {
    const student = await User.findOne({ email: 'sam@careertwin.ai' });
    const concepts = await Concept.find({ active: true }).sort({ order: 1 });
    const cMap = new Map();
    concepts.forEach((c) => cMap.set(c.slug, c));

    // Clean test records for this learner
    await LearnerState.deleteMany({ learnerId: student._id });
    await Attempt.deleteMany({ learnerId: student._id });
    await Decision.deleteMany({ learnerId: student._id });
    await LearningPath.deleteMany({ learnerId: student._id });

    // ---------------------------------------------------------------
    // 1. Recursive Prerequisite Engine Tests
    // ---------------------------------------------------------------
    console.log('--- 1. Recursive Prerequisite Traversal Tests ---');
    // Set foundational concepts strong, but Functions weak (42%)
    await LearnerState.create([
      { learnerId: student._id, conceptId: cMap.get('programming-basics')._id, mastery: 85, uncertainty: 15, evidenceCount: 4 },
      { learnerId: student._id, conceptId: cMap.get('variables-datatypes')._id, mastery: 82, uncertainty: 18, evidenceCount: 3 },
      { learnerId: student._id, conceptId: cMap.get('operators')._id, mastery: 80, uncertainty: 20, evidenceCount: 3 },
      { learnerId: student._id, conceptId: cMap.get('conditionals')._id, mastery: 78, uncertainty: 22, evidenceCount: 3 },
      { learnerId: student._id, conceptId: cMap.get('loops')._id, mastery: 80, uncertainty: 20, evidenceCount: 3 },
      { learnerId: student._id, conceptId: cMap.get('functions')._id, mastery: 42, uncertainty: 45, evidenceCount: 2 }, // WEAK!
    ]);

    // Test direct prerequisite on OOP Basics (Functions -> OOP Basics)
    const oopPrereq = await evaluatePrerequisites(cMap.get('oop-basics')._id, student._id, 70);
    console.log(`✅ Direct Prereq Check on "OOP Basics": isBlocked=${oopPrereq.isBlocked}, Root=${oopPrereq.rootBlockingConcept?.name} (${oopPrereq.rootBlockingConcept?.mastery}%)`);
    if (!oopPrereq.isBlocked || oopPrereq.rootBlockingConcept.slug !== 'functions') {
      throw new Error('Prerequisite engine failed to detect weak direct prerequisite Functions for OOP Basics');
    }

    // Test recursive ancestor check on deep descendant "Problem Solving"
    const psPrereq = await evaluatePrerequisites(cMap.get('problem-solving')._id, student._id, 70);
    console.log(`✅ Recursive Prereq Check on "Problem Solving": isBlocked=${psPrereq.isBlocked}, Root=${psPrereq.rootBlockingConcept?.name}`);
    if (!psPrereq.isBlocked || psPrereq.rootBlockingConcept.slug !== 'functions') {
      throw new Error('Prerequisite engine failed to recursively trace back to weak Functions from Problem Solving');
    }

    // ---------------------------------------------------------------
    // 2. Decision: REMEDIATE_PREREQUISITE
    // ---------------------------------------------------------------
    console.log('\n--- 2. Adaptive Decision: REMEDIATE_PREREQUISITE ---');
    const actionRemediate = await getNextLearningAction(student._id, cMap.get('oop-basics')._id);
    console.log(`✅ Decision Generated: Action [${actionRemediate.action}], Target: [${actionRemediate.activeConcept.name}]`);
    console.log(`   Reason: "${actionRemediate.reason}"`);
    console.log(`   Machine Factors: PrerequisiteBlocked=${actionRemediate.decisionFactors.prerequisiteBlocked}, RootMastery=${actionRemediate.decisionFactors.mastery}%`);

    if (actionRemediate.action !== 'REMEDIATE_PREREQUISITE' || actionRemediate.activeConcept.slug !== 'functions') {
      throw new Error('Expected REMEDIATE_PREREQUISITE targeting Functions');
    }

    // ---------------------------------------------------------------
    // 3. Decision: CHALLENGE (High Mastery + High Uncertainty)
    // ---------------------------------------------------------------
    console.log('\n--- 3. Adaptive Decision: CHALLENGE ---');
    // Update Functions to 88% mastery, but high uncertainty (55%)
    await LearnerState.updateOne(
      { learnerId: student._id, conceptId: cMap.get('functions')._id },
      { $set: { mastery: 88, uncertainty: 55 } }
    );
    const actionChallenge = await getNextLearningAction(student._id, cMap.get('functions')._id);
    console.log(`✅ Decision Generated: Action [${actionChallenge.action}], Target: [${actionChallenge.activeConcept.name}]`);
    console.log(`   Reason: "${actionChallenge.reason}"`);
    console.log(`   Selected Question: [${actionChallenge.nextQuestion.type}] (Diff ${actionChallenge.nextQuestion.difficulty}) "${actionChallenge.nextQuestion.question.slice(0, 50)}..."`);

    if (actionChallenge.action !== 'CHALLENGE') {
      throw new Error(`Expected CHALLENGE for high mastery & high uncertainty, got ${actionChallenge.action}`);
    }

    // ---------------------------------------------------------------
    // 4. Decision: ADVANCE (High Mastery + Low Uncertainty)
    // ---------------------------------------------------------------
    console.log('\n--- 4. Adaptive Decision: ADVANCE ---');
    // Certify Functions with low uncertainty (18%)
    await LearnerState.updateOne(
      { learnerId: student._id, conceptId: cMap.get('functions')._id },
      { $set: { mastery: 88, uncertainty: 18 } }
    );
    const actionAdvance = await getNextLearningAction(student._id, cMap.get('functions')._id);
    console.log(`✅ Decision Generated: Action [${actionAdvance.action}], Target: [${actionAdvance.activeConcept.name}]`);
    console.log(`   Reason: "${actionAdvance.reason}"`);

    if (actionAdvance.action !== 'ADVANCE') {
      throw new Error(`Expected ADVANCE for high mastery & low uncertainty, got ${actionAdvance.action}`);
    }

    // ---------------------------------------------------------------
    // 5. Decision: REVIEW (Knowledge Decay on Inactive Concept)
    // ---------------------------------------------------------------
    console.log('\n--- 5. Knowledge Decay & Spaced REVIEW ---');
    // Set Loops to 20 days ago (exceeds 14-day threshold)
    const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
    await LearnerState.updateOne(
      { learnerId: student._id, conceptId: cMap.get('loops')._id },
      { $set: { lastAttemptAt: twentyDaysAgo, mastery: 86, uncertainty: 20 } }
    );

    const decayEval = evaluateConceptDecay(
      await LearnerState.findOne({ learnerId: student._id, conceptId: cMap.get('loops')._id }),
      14
    );
    console.log(`✅ Decay Evaluator: isStale=${decayEval.isStale}, DaysElapsed=${decayEval.daysElapsed}, DecayedMastery=${decayEval.decayedMastery}%, DecayedUncertainty=${decayEval.decayedUncertainty}%`);
    if (!decayEval.isStale || decayEval.decayedMastery === 0) {
      throw new Error('Decay engine failed or reset mastery to zero');
    }

    const actionReview = await getNextLearningAction(student._id);
    console.log(`✅ Global Decision with Decay: Action [${actionReview.action}], Target: [${actionReview.activeConcept.name}]`);
    console.log(`   Reason: "${actionReview.reason}"`);
    if (actionReview.action !== 'REVIEW') {
      throw new Error(`Expected REVIEW for stale decayed concept, got ${actionReview.action}`);
    }

    // ---------------------------------------------------------------
    // 6. Decision: TEACHER_INTERVENTION (Consecutive Failures)
    // ---------------------------------------------------------------
    console.log('\n--- 6. TEACHER_INTERVENTION on 3+ Failures ---');
    const oopQ = await Question.findOne({ conceptId: cMap.get('oop-basics')._id });
    // Insert 3 consecutive failed attempts
    for (let i = 0; i < 3; i++) {
      await Attempt.create({
        learnerId: student._id,
        questionId: oopQ._id,
        conceptId: oopQ.conceptId,
        correct: false,
        userAnswer: 'Wrong Answer',
        difficulty: oopQ.difficulty,
        responseTime: 12,
        confidence: 2,
        evidenceWeight: 0.8,
        evidenceQuality: 'MODERATE',
        timestamp: new Date(Date.now() + i * 1000),
      });
    }

    const actionIntervene = await getNextLearningAction(student._id);
    console.log(`✅ Consecutive Failures Decision: Action [${actionIntervene.action}], Target: [${actionIntervene.activeConcept.name}]`);
    console.log(`   Reason: "${actionIntervene.reason}"`);
    if (actionIntervene.action !== 'TEACHER_INTERVENTION') {
      throw new Error(`Expected TEACHER_INTERVENTION after 3 failures, got ${actionIntervene.action}`);
    }

    // ---------------------------------------------------------------
    // 7. REST API Verification (Next-Action, LearningPath, Decisions)
    // ---------------------------------------------------------------
    console.log('\n--- 7. REST API Integration Tests ---');
    
    // GET /api/adaptive/next-action
    const nextActionRes = await axios.get(`${baseUrl}/next-action?learnerId=${student._id}`);
    console.log(`✅ GET /api/adaptive/next-action: Action [${nextActionRes.data.action}], Target: [${nextActionRes.data.targetConcept.name}]`);

    // GET /api/adaptive/learning-path
    const pathRes = await axios.get(`${baseUrl}/learning-path?learnerId=${student._id}`);
    console.log(`✅ GET /api/adaptive/learning-path: Count=${pathRes.data.count} nodes.`);
    const activeNode = pathRes.data.learningPath.find((n) => n.status === 'in_progress');
    console.log(`   Active Node on Path: Concept [${activeNode?.conceptId?.name}], Recommended Action [${activeNode?.recommendedAction}]`);

    // GET /api/adaptive/decisions
    const decisionsRes = await axios.get(`${baseUrl}/decisions?learnerId=${student._id}`);
    console.log(`✅ GET /api/adaptive/decisions: Total Audit Records=${decisionsRes.data.count}`);
    const latestDec = decisionsRes.data.decisions[0];
    console.log(`   Latest Decision Log: Action [${latestDec.action}], Machine Factors: Mastery=${latestDec.decisionFactors.mastery}%`);

    console.log('\n========================================================');
    console.log('🎉 [Phase 3 Passed] Full Adaptive Decision Loop Verified!');
    console.log('========================================================\n');
  } catch (err) {
    console.error('❌ Phase 3 test failed:', err.response?.data || err.message);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
    if (require.main === module) {
      process.exit(process.exitCode || 0);
    }
  }
}

if (require.main === module) {
  runPhase3Tests();
}

module.exports = runPhase3Tests;
