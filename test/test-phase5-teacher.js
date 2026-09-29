/**
 * Phase 5 Verification Test: Teacher Dashboard & Controls
 */

const assert = require('assert');

async function runPhase5Tests() {
  console.log('====================================================');
  console.log('TESTING PHASE 5: TEACHER DASHBOARD & OVERRIDES');
  console.log('====================================================\n');

  const BASE_URL = 'http://localhost:5000';
  const ALEX_ID = '64f1a2b3c4d5e6f7a8b9c0d1';

  // 1. Check Teacher Dashboard Page HTTP 200
  console.log('1. Checking HTTP 200 for /teacher-dashboard.html...');
  const pageRes = await fetch(`${BASE_URL}/teacher-dashboard.html`);
  assert.strictEqual(pageRes.status, 200);
  const pageHtml = await pageRes.text();
  assert(pageHtml.includes('Teacher &amp; Cohort Intelligence') || pageHtml.includes('Teacher & Cohort Intelligence'));
  console.log(`   ✓ /teacher-dashboard.html loaded (${pageHtml.length} bytes, HTTP 200)`);

  // 2. Test Cohort List
  console.log('\n2. Testing /api/teacher/cohort...');
  const cohortRes = await fetch(`${BASE_URL}/api/teacher/cohort`);
  assert.strictEqual(cohortRes.status, 200);
  const cohortData = await cohortRes.json();
  assert(cohortData.success, 'Cohort endpoint returned success: false');
  assert(cohortData.count > 0, 'No students found in cohort');
  const targetLearnerId = cohortData.cohort[0].id;
  console.log(`   ✓ Retrieved ${cohortData.count} students in cohort (Target learner: ${cohortData.cohort[0].name}, ID: ${targetLearnerId}):`);
  cohortData.cohort.forEach((s) => {
    console.log(`     - ${s.name} (${s.email}): Avg Mastery ${s.avgMastery}%, Uncertainty ${s.avgUncertainty}%, Action: ${s.currentAction}`);
  });


  // 3. Test Interventions
  console.log('\n3. Testing /api/teacher/interventions...');
  const intervRes = await fetch(`${BASE_URL}/api/teacher/interventions`);
  assert.strictEqual(intervRes.status, 200);
  const intervData = await intervRes.json();
  assert(intervData.success);
  console.log(`   ✓ Active interventions count: ${intervData.count}`);

  // 4. Test Teacher Override Validation (Missing Rationale)
  console.log('\n4. Testing Teacher Override Validation (Must reject without rationale)...');
  const conceptsRes = await fetch(`${BASE_URL}/api/adaptive/concepts`);
  const conceptsData = await conceptsRes.json();
  const targetConcept = conceptsData.concepts[1]; // Variables & Data Types

  const invalidOverrideRes = await fetch(`${BASE_URL}/api/teacher/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      learnerId: targetLearnerId,
      conceptId: targetConcept._id,
      teacherAction: 'CHALLENGE',
      reason: '', // Empty reason should fail!
    }),
  });
  assert.strictEqual(invalidOverrideRes.status, 400, 'Should reject override without rationale');
  console.log('   ✓ Rejected empty rationale with HTTP 400 as required');

  // 5. Test Valid Teacher Override Execution
  console.log('\n5. Executing Valid Teacher Override (Enforce CHALLENGE on Variables & Data Types)...');
  const validOverridePayload = {
    learnerId: targetLearnerId,
    conceptId: targetConcept._id,
    teacherAction: 'CHALLENGE',
    reason: 'Alex passed in-person code review on basic syntax; ready for advanced data type challenges.',
  };

  const validOverrideRes = await fetch(`${BASE_URL}/api/teacher/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validOverridePayload),
  });
  assert.strictEqual(validOverrideRes.status, 201, 'Valid override failed');
  const overrideResult = await validOverrideRes.json();
  assert(overrideResult.success);
  assert.strictEqual(overrideResult.override.teacherAction, 'CHALLENGE');
  console.log(`   ✓ Teacher override successfully created and persisted`);
  console.log(`     Rationale: "${overrideResult.override.reason}"`);

  // 6. Verify Adaptive Engine Respects Teacher Override
  console.log('\n6. Verifying Adaptive Engine respects Teacher Override on /api/adaptive/next-action...');
  const nextRes = await fetch(`${BASE_URL}/api/adaptive/next-action?learnerId=${targetLearnerId}`);
  assert.strictEqual(nextRes.status, 200);
  const nextData = await nextRes.json();
  assert.strictEqual(nextData.action, 'CHALLENGE', `Expected action CHALLENGE, got ${nextData.action}`);
  assert.strictEqual(nextData.targetConcept._id, targetConcept._id, 'Expected target concept to match override');
  console.log(`   ✓ Adaptive Engine now returns: ACTION=${nextData.action} on ${nextData.targetConcept.name}`);
  console.log(`     Decision Rationale: "${nextData.reason}"`);

  // 7. Test Immutable Audit Log
  console.log('\n7. Verifying /api/teacher/audit-log records the override...');
  const auditRes = await fetch(`${BASE_URL}/api/teacher/audit-log`);
  assert.strictEqual(auditRes.status, 200);
  const auditData = await auditRes.json();
  assert(auditData.success);
  assert(auditData.count > 0, 'Audit log empty');
  const latestAudit = auditData.logs[0];
  assert.strictEqual(latestAudit.action, 'TEACHER_OVERRIDE');
  assert.strictEqual(latestAudit.details.teacherAction, 'CHALLENGE');
  console.log(`   ✓ Audit log confirmed: Action ${latestAudit.action} at ${latestAudit.timestamp}`);
  console.log(`     Logged Reason: "${latestAudit.details.reason}"`);

  console.log('\n====================================================');
  console.log('✅ ALL PHASE 5 TEACHER DASHBOARD TESTS PASSED!');
  console.log('====================================================');
}

runPhase5Tests().catch((err) => {
  console.error('\n❌ Phase 5 Test Failed:', err);
  process.exit(1);
});
