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
const User = require('../backend/models/User');

const { evaluateEvidence } = require('../backend/services/evidenceEngine');
const { computeMasteryUpdate } = require('../backend/services/masteryEngine');
const { computeUncertaintyUpdate } = require('../backend/services/uncertaintyEngine');
const { analyzeGamingPatterns } = require('../backend/services/antiGamingEngine');

const PORT = 5003;
process.env.PORT = PORT;
process.env.NODE_ENV = 'test';

async function runPhase2Tests() {
  console.log('🧪 ====================================================');
  console.log('🧪 Starting Phase 2 Adaptive Core Engine Verification');
  console.log('🧪 ====================================================\n');

  const app = require('../backend/server');
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`[Test Server] Live on http://localhost:${PORT}`);

  const baseUrl = `http://localhost:${PORT}/api/adaptive`;

  try {
    // 1. Anti-Gaming Detection Unit Tests
    console.log('--- 1. Anti-Gaming Engine Tests ---');
    const dummyQ = { difficulty: 3, type: 'MCQ' };

    // Rapid retry test
    const rapidRetryResult = analyzeGamingPatterns({
      question: dummyQ,
      responseTime: 2.0,
      hintsUsed: 0,
      priorAttemptsOnQuestion: [{ timestamp: new Date(), correct: false }],
    });
    console.log(`✅ Rapid Retry Detected: ${rapidRetryResult.isRapidRetry}, Penalty Multiplier: ${rapidRetryResult.penaltyMultiplier}`);
    if (!rapidRetryResult.isRapidRetry || rapidRetryResult.penaltyMultiplier >= 1.0) {
      throw new Error('Anti-gaming failed to penalize rapid retry');
    }

    // Excessive hints test
    const hintResult = analyzeGamingPatterns({
      question: dummyQ,
      responseTime: 25.0,
      hintsUsed: 2,
      priorAttemptsOnQuestion: [],
    });
    console.log(`✅ Excessive Hints Flagged: ${hintResult.flags.includes('EXCESSIVE_HINTS')}, Multiplier: ${hintResult.penaltyMultiplier}`);
    if (hintResult.penaltyMultiplier >= 0.8) {
      throw new Error('Anti-gaming failed to penalize excessive hints');
    }

    // 2. Evidence Weighting Unit Tests
    console.log('\n--- 2. Evidence Engine Tests ---');
    const easyQ = { difficulty: 1, type: 'MCQ' };
    const hardTransferQ = { difficulty: 5, type: 'Transfer' };

    const weakEv = evaluateEvidence({
      question: easyQ,
      correct: true,
      responseTime: 10,
      confidence: 2,
      hintsUsed: 1,
      priorAttemptsOnQuestion: [],
    });
    console.log(`✅ Easy Q + Hint -> Quality: ${weakEv.evidenceQuality}, Weight: ${weakEv.evidenceWeight}`);
    if (weakEv.evidenceQuality === 'STRONG') {
      throw new Error('Easy question with hint should not produce STRONG evidence');
    }

    const strongEv = evaluateEvidence({
      question: hardTransferQ,
      correct: true,
      responseTime: 45,
      confidence: 5,
      hintsUsed: 0,
      priorAttemptsOnQuestion: [],
    });
    console.log(`✅ Hard Transfer Q -> Quality: ${strongEv.evidenceQuality}, Weight: ${strongEv.evidenceWeight}`);
    if (strongEv.evidenceQuality !== 'STRONG' || strongEv.evidenceWeight <= weakEv.evidenceWeight) {
      throw new Error('Hard Transfer Q should produce superior evidence weight and STRONG quality');
    }

    // 3. Mastery Gradual Update & Jump Cap Tests
    console.log('\n--- 3. Mastery Engine Incremental Jump Cap Tests ---');
    const baselineMastery = 52;
    const updateResult = computeMasteryUpdate({
      currentMastery: baselineMastery,
      evidenceEvaluation: strongEv,
      masteryVersion: 1,
    });
    console.log(`✅ Mastery Update: ${baselineMastery}% -> ${updateResult.newMastery}% (Delta: +${updateResult.masteryDelta}%)`);
    if (updateResult.newMastery >= 90 || updateResult.masteryDelta > 12) {
      throw new Error(`Mastery jumped too drastically! (Jumped to ${updateResult.newMastery}%, delta was ${updateResult.masteryDelta}%)`);
    }

    // 4. Uncertainty Engine Fluctuation & Transfer Failure Tests
    console.log('\n--- 4. Uncertainty Engine Tests ---');
    const initialUncertainty = 60;
    
    // Success on transfer reduces uncertainty
    const uSuccess = computeUncertaintyUpdate({
      currentUncertainty: initialUncertainty,
      evidenceEvaluation: strongEv,
      recentAttemptsOnConcept: [{ correct: true }, { correct: true }],
      distinctTypesPassed: new Set(['MCQ', 'Code Output', 'Transfer']),
    });
    console.log(`✅ Transfer Success Uncertainty: ${initialUncertainty}% -> ${uSuccess.newUncertainty}% (Delta: ${uSuccess.uncertaintyDelta}%)`);
    if (uSuccess.newUncertainty >= initialUncertainty) {
      throw new Error('Consistent transfer success should reduce uncertainty');
    }

    // Failure on transfer increases uncertainty
    const failedTransferEv = evaluateEvidence({
      question: hardTransferQ,
      correct: false,
      responseTime: 30,
      confidence: 4,
      hintsUsed: 0,
    });
    const uFailure = computeUncertaintyUpdate({
      currentUncertainty: 40,
      evidenceEvaluation: failedTransferEv,
      recentAttemptsOnConcept: [{ correct: true }], // Contradiction: was correct, now failed transfer
    });
    console.log(`✅ Transfer Failure Uncertainty: 40% -> ${uFailure.newUncertainty}% (Delta: +${uFailure.uncertaintyDelta}%)`);
    if (uFailure.newUncertainty <= 40) {
      throw new Error('Transfer failure should increase uncertainty');
    }

    // 5. End-to-End Attempt Submission API Verification
    console.log('\n--- 5. POST /api/adaptive/attempts API Test ---');
    const testStudent = await User.findOne({ email: 'alex@careertwin.ai' });
    const loopsConcept = await Concept.findOne({ slug: 'loops' });
    const loopQuestion = await Question.findOne({ conceptId: loopsConcept._id, type: 'Code Output' });

    // Clean any prior attempts for test student on this question
    await Attempt.deleteMany({ learnerId: testStudent._id });
    await LearnerState.deleteMany({ learnerId: testStudent._id });

    // Attempt 1: Correct submission
    const res1 = await axios.post(`${baseUrl}/attempts`, {
      learnerId: testStudent._id,
      questionId: loopQuestion._id,
      userAnswer: loopQuestion.correctAnswer,
      responseTime: 22,
      confidence: 4,
      hintsUsed: 0,
    });

    console.log(`✅ Attempt 1 Result: Correct=${res1.data.correct}, Mastery: ${res1.data.stateUpdate.previousMastery}% -> ${res1.data.stateUpdate.newMastery}%`);
    console.log(`   Uncertainty: ${res1.data.stateUpdate.previousUncertainty}% -> ${res1.data.stateUpdate.newUncertainty}%`);

    if (res1.data.stateUpdate.newMastery <= 0 || res1.data.stateUpdate.newMastery > 15) {
      throw new Error(`First attempt produced unrealistic mastery: ${res1.data.stateUpdate.newMastery}%`);
    }

    // Attempt 2: Verify GET /api/adaptive/mastery
    const masteryRes = await axios.get(`${baseUrl}/mastery?learnerId=${testStudent._id}`);
    console.log(`✅ GET /api/adaptive/mastery returned ${masteryRes.data.count} concepts for learner.`);
    const loopsState = masteryRes.data.mastery.find((m) => m.slug === 'loops');
    console.log(`   Loops Concept Verified: Mastery=${loopsState.mastery}%, Uncertainty=${loopsState.uncertainty}%, EvidenceCount=${loopsState.evidenceCount}`);

    if (loopsState.evidenceCount !== 1 || loopsState.mastery !== res1.data.stateUpdate.newMastery) {
      throw new Error('Mastery overview does not reflect stored LearnerState');
    }

    console.log('\n====================================================');
    console.log('🎉 [Phase 2 Passed] All Core Adaptive Engines Verified!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Phase 2 test failed:', err.response?.data || err.message);
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
  runPhase2Tests();
}

module.exports = runPhase2Tests;
