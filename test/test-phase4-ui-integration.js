/**
 * Phase 4 Verification Test: Student Learning UI & Concept Visualizations Integration
 */

const assert = require('assert');

async function runPhase4Tests() {
  console.log('====================================================');
  console.log('TESTING PHASE 4: UI ROUTES & END-TO-END DATA FLOW');
  console.log('====================================================\n');

  const BASE_URL = 'http://localhost:5000';
  const DEMO_LEARNER = '64f1a2b3c4d5e6f7a8b9c0d1'; // Alex Rivers

  // 1. Verify Static Frontend Pages
  const pagesToTest = [
    '/dashboard.html',
    '/concept-graph.html',
    '/mastery.html',
    '/diagnostic.html',
    '/learning-history.html',
    '/css/adaptive.css',
    '/js/adaptive-api.js',
    '/js/navbar.js',
  ];

  console.log('1. Checking HTTP 200 for Phase 4 UI pages & assets...');
  for (const page of pagesToTest) {
    const res = await fetch(`${BASE_URL}${page}`);
    assert.strictEqual(res.status, 200, `Page ${page} failed to load (status: ${res.status})`);
    const text = await res.text();
    assert(text.length > 50, `Page ${page} returned empty content`);
    console.log(`   ✓ ${page} loaded (${text.length} bytes, HTTP 200)`);
  }

  // 2. Verify Diagnostic Questions Endpoint
  console.log('\n2. Testing /api/adaptive/diagnostic-questions...');
  const diagRes = await fetch(`${BASE_URL}/api/adaptive/diagnostic-questions`);
  assert.strictEqual(diagRes.status, 200);
  const diagData = await diagRes.json();
  assert(diagData.success, 'diagnostic-questions endpoint returned success: false');
  assert.strictEqual(diagData.count, 10, `Expected 10 diagnostic questions, got ${diagData.count}`);
  console.log(`   ✓ Successfully retrieved 10 diagnostic questions across foundation concepts`);
  console.log(`     Sample: "${diagData.questions[0].question.substring(0, 50)}..."`);

  // 3. Test Interactive Attempt Submission Flow
  console.log('\n3. Testing Interactive Attempt Submission (Diagnostic Question 1)...');
  const targetQ = diagData.questions[0];
  const attemptPayload = {
    learnerId: DEMO_LEARNER,
    questionId: targetQ._id,
    userAnswer: targetQ.options ? targetQ.options[0] : 'Bytecode',
    responseTime: 18,
    confidence: 4,
    hintsUsed: 0,
    sessionId: `diag_test_${Date.now()}`,
  };

  const submitRes = await fetch(`${BASE_URL}/api/adaptive/attempts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(attemptPayload),
  });

  assert.strictEqual(submitRes.status, 200, 'Attempt submission failed');
  const submitData = await submitRes.json();
  assert(submitData.success, 'Attempt submission success was false');
  assert(submitData.attemptId, 'Missing attemptId');
  assert(submitData.stateUpdate, 'Missing stateUpdate');
  console.log(`   ✓ Attempt registered. Correct: ${submitData.correct}`);
  console.log(`     New Mastery: ${submitData.stateUpdate.newMastery}% (Delta: ${submitData.stateUpdate.masteryDelta}%)`);
  console.log(`     New Uncertainty: ${submitData.stateUpdate.newUncertainty}% (Delta: ${submitData.stateUpdate.uncertaintyDelta}%)`);
  console.log(`     Evidence Weight: ${submitData.evidence.weight.toFixed(2)}x (${submitData.evidence.quality})`);

  // 4. Test Attempt History Audit Retrieval
  console.log('\n4. Testing /api/adaptive/attempts history retrieval...');
  const historyRes = await fetch(`${BASE_URL}/api/adaptive/attempts?learnerId=${DEMO_LEARNER}&limit=5`);
  assert.strictEqual(historyRes.status, 200);
  const historyData = await historyRes.json();
  assert(historyData.success);
  assert(historyData.count > 0, 'No attempts found in history');
  console.log(`   ✓ Retrieved ${historyData.count} attempts from history`);
  console.log(`     Latest attempt recorded at: ${historyData.attempts[0].timestamp || historyData.attempts[0].createdAt}`);

  // 5. Test Concept Graph Data Endpoint
  console.log('\n5. Testing /api/adaptive/concepts/graph...');
  const graphRes = await fetch(`${BASE_URL}/api/adaptive/concepts/graph`);
  assert.strictEqual(graphRes.status, 200);
  const graphData = await graphRes.json();
  assert(graphData.success);
  assert.strictEqual(graphData.graph.totalNodes, 12, `Expected 12 nodes, got ${graphData.graph.totalNodes}`);
  assert.strictEqual(graphData.graph.totalEdges, 15, `Expected 15 edges, got ${graphData.graph.totalEdges}`);
  console.log(`   ✓ Concept graph validated: 12 nodes and 15 dependency edges`);

  // 6. Test Learning Path Generation & Next Action
  console.log('\n6. Testing /api/adaptive/next-action and /api/adaptive/learning-path...');
  const nextRes = await fetch(`${BASE_URL}/api/adaptive/next-action?learnerId=${DEMO_LEARNER}`);
  assert.strictEqual(nextRes.status, 200);
  const nextData = await nextRes.json();
  assert(nextData.success);
  console.log(`   ✓ Recommended Action: ${nextData.action} on ${nextData.targetConcept?.name}`);
  console.log(`     Explainability Rationale: "${nextData.reason}"`);
  console.log(`     Decision Factors:`, JSON.stringify(nextData.decisionFactors));

  const pathRes = await fetch(`${BASE_URL}/api/adaptive/learning-path?learnerId=${DEMO_LEARNER}`);
  assert.strictEqual(pathRes.status, 200);
  const pathData = await pathRes.json();
  assert(pathData.success);
  assert.strictEqual(pathData.count, 12, `Expected 12 path nodes, got ${pathData.count}`);
  console.log(`   ✓ Learning path returned 12 nodes in instructional sequence`);

  console.log('\n====================================================');
  console.log('✅ ALL PHASE 4 UI & INTEGRATION TESTS PASSED!');
  console.log('====================================================');
}

runPhase4Tests().catch((err) => {
  console.error('\n❌ Phase 4 Test Failed:', err);
  process.exit(1);
});
