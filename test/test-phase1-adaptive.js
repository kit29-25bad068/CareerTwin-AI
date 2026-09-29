const http = require('http');
const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Concept = require('../backend/models/Concept');
const Question = require('../backend/models/Question');
const Attempt = require('../backend/models/Attempt');
const Decision = require('../backend/models/Decision');
const LearningPath = require('../backend/models/LearningPath');
const AdaptiveConfig = require('../backend/models/AdaptiveConfig');
const User = require('../backend/models/User');

const PORT = 5002;
process.env.PORT = PORT;
process.env.NODE_ENV = 'test';

async function runPhase1Tests() {
  console.log('🧪 ====================================================');
  console.log('🧪 Starting Phase 1 Adaptive System Verification Tests');
  console.log('🧪 ====================================================\n');

  const app = require('../backend/server');
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`[Test Server] Live on http://localhost:${PORT}`);

  const baseUrl = `http://localhost:${PORT}/api/adaptive`;

  try {
    // 1. Verify Database Connection
    console.log('\n--- 1. Database Connection & Concept Graph Verification ---');
    const concepts = await Concept.find().populate('prerequisites');
    console.log(`✅ Total Concepts in Database: ${concepts.length} (Expected: 12)`);
    if (concepts.length !== 12) {
      throw new Error(`Expected 12 concepts, found ${concepts.length}`);
    }

    // Verify Prerequisite Integrity
    let edgesCount = 0;
    concepts.forEach((c) => {
      edgesCount += c.prerequisites.length;
    });
    console.log(`✅ Total Prerequisite Edges: ${edgesCount}`);

    // Recursive Prerequisite Traversal Test
    console.log('\n--- 2. Recursive Prerequisite Graph Traversal ---');
    const conceptMap = new Map();
    concepts.forEach((c) => conceptMap.set(c._id.toString(), c));

    function getRecursiveAncestors(conceptId, visited = new Set()) {
      const c = conceptMap.get(conceptId.toString());
      if (!c) return visited;
      for (const p of c.prerequisites) {
        const pId = p._id ? p._id.toString() : p.toString();
        if (!visited.has(pId)) {
          visited.add(pId);
          getRecursiveAncestors(pId, visited);
        }
      }
      return visited;
    }

    const problemSolvingConcept = concepts.find((c) => c.slug === 'problem-solving');
    if (!problemSolvingConcept) throw new Error('Problem Solving concept not found');

    const ancestorIds = getRecursiveAncestors(problemSolvingConcept._id);
    const ancestorNames = Array.from(ancestorIds).map((id) => conceptMap.get(id)?.name);
    console.log(`✅ "Problem Solving" Recursive Ancestor Dependencies (${ancestorNames.length}):`);
    console.log(`   -> ${ancestorNames.join(' -> ')}`);

    if (!ancestorNames.includes('Programming Basics')) {
      throw new Error('Recursive prerequisite resolution failed to reach root Programming Basics');
    }
    console.log('✅ Recursive prerequisite traversal reaches root Programming Basics successfully.');

    // 3. Question Model & Multi-Type Distribution
    console.log('\n--- 3. Multi-Type Question Model Distribution ---');
    const questions = await Question.find();
    console.log(`✅ Total Seeded Questions: ${questions.length} (Expected >= 40)`);
    if (questions.length < 40) {
      throw new Error(`Expected at least 40 questions, found ${questions.length}`);
    }

    const typeCounts = {};
    questions.forEach((q) => {
      typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
    });
    console.log('✅ Question Distribution by Type:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`   - ${type.padEnd(14)}: ${count}`);
    });

    const requiredTypes = ['MCQ', 'Code Output', 'Debugging', 'Coding', 'Scenario', 'Transfer'];
    for (const t of requiredTypes) {
      if (!typeCounts[t]) {
        throw new Error(`Missing question type: ${t}`);
      }
    }
    console.log('✅ All 6 question types are represented in active curriculum.');

    // 4. Attempt Schema Validation (userAnswer, questionVersion, sessionId)
    console.log('\n--- 4. Attempt Model Schema & Integrity Check ---');
    const testUser = await User.findOne({ email: 'alex@careertwin.ai' });
    const sampleQuestion = questions[0];

    const testAttempt = await Attempt.create({
      learnerId: testUser._id,
      questionId: sampleQuestion._id,
      conceptId: sampleQuestion.conceptId,
      correct: true,
      userAnswer: 'Java Virtual Machine (JVM)',
      difficulty: sampleQuestion.difficulty,
      responseTime: 18.5,
      confidence: 4,
      hintsUsed: 0,
      attemptNumber: 1,
      evidenceWeight: 1.25,
      evidenceQuality: 'STRONG',
      questionType: sampleQuestion.type,
      questionVersion: 1,
      sessionId: 'session_test_abc123',
    });
    console.log(`✅ Attempt Saved Successfully: ID ${testAttempt._id}`);
    console.log(`   userAnswer: "${testAttempt.userAnswer}", session: "${testAttempt.sessionId}", weight: ${testAttempt.evidenceWeight}`);
    await Attempt.findByIdAndDelete(testAttempt._id);

    // 5. Decision Model Schema Validation (structured decisionFactors)
    console.log('\n--- 5. Decision Model Structured Explainability Check ---');
    const testDecision = await Decision.create({
      learnerId: testUser._id,
      conceptId: sampleQuestion.conceptId,
      action: 'PRACTICE',
      reason: 'Practice Functions because mastery is 54% and two recent debugging attempts failed.',
      decisionFactors: {
        mastery: 54,
        uncertainty: 37,
        prerequisiteBlocked: false,
        blockedPrerequisites: [],
        staleEvidence: false,
        recentFailures: 2,
        transferPerformance: 42,
        evidenceQuality: 0.61,
        thresholdsApplied: { practiceThreshold: 60, advanceThreshold: 75 },
      },
      previousState: { mastery: 50, uncertainty: 45 },
      resultingState: { mastery: 54, uncertainty: 37 },
      configurationVersion: '1.0',
    });
    console.log(`✅ Decision Saved Successfully: Action [${testDecision.action}]`);
    console.log(`   Machine Factors: Mastery=${testDecision.decisionFactors.mastery}%, Uncertainty=${testDecision.decisionFactors.uncertainty}%`);
    console.log(`   Human Reason: "${testDecision.reason}"`);
    await Decision.findByIdAndDelete(testDecision._id);

    // 6. LearningPath Model Validation
    console.log('\n--- 6. LearningPath Pipeline Node Check ---');
    const testPathNode = await LearningPath.create({
      learnerId: testUser._id,
      conceptId: sampleQuestion.conceptId,
      status: 'ready',
      recommendedAction: 'PRACTICE',
      priority: 8,
      reason: 'Immediate next activity in sequence',
      position: 1,
    });
    console.log(`✅ LearningPath Node Created: Status [${testPathNode.status}], Action [${testPathNode.recommendedAction}]`);
    await LearningPath.findByIdAndDelete(testPathNode._id);

    // 7. HTTP API Endpoint Verification
    console.log('\n--- 7. REST API Verification ---');
    
    // GET /api/adaptive/concepts
    const conceptsRes = await axios.get(`${baseUrl}/concepts`);
    console.log(`✅ GET /api/adaptive/concepts -> Status: ${conceptsRes.status}, Count: ${conceptsRes.data.count}`);
    
    // GET /api/adaptive/concepts/graph
    const graphRes = await axios.get(`${baseUrl}/concepts/graph`);
    console.log(`✅ GET /api/adaptive/concepts/graph -> Nodes: ${graphRes.data.graph.totalNodes}, Edges: ${graphRes.data.graph.totalEdges}`);

    // GET /api/adaptive/questions?type=Debugging
    const debugQRes = await axios.get(`${baseUrl}/questions?type=Debugging`);
    console.log(`✅ GET /api/adaptive/questions?type=Debugging -> Found: ${debugQRes.data.count} debugging questions`);

    // GET /api/adaptive/config
    const configRes = await axios.get(`${baseUrl}/config`);
    console.log(`✅ GET /api/adaptive/config -> Version: ${configRes.data.config.configurationVersion}, Advance Threshold: ${configRes.data.config.advanceThreshold}%`);

    console.log('\n====================================================');
    console.log('🎉 [Phase 1 Passed] All Foundational Architecture Verified!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Phase 1 test failed:', err.response?.data || err.message);
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
  runPhase1Tests();
}

module.exports = runPhase1Tests;
