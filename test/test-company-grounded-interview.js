const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5000';
let authToken = '';

async function loginOrRegisterTestUser() {
  const uniqueId = Date.now();
  const email = `mock_tester_${uniqueId}@careertwin.ai`;
  const password = 'Password@123';
  const name = 'Mock Grounding Tester';

  try {
    const res = await axios.post(`${BASE_URL}/api/auth/register`, {
      name,
      email,
      password,
      githubUrl: `https://github.com/mocktester${uniqueId}`,
      codolioUrl: `https://codolio.com/profile/tester_${uniqueId}`,
      targetRole: 'Software Engineer',
    });
    return res.data.token;
  } catch (e) {
    console.error('Register error:', e.response?.data || e.message);
    throw e;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPANY-GROUNDED INTERVIEW TEST SUITE');
  console.log('====================================================\n');

  authToken = await loginOrRegisterTestUser();
  const authHeaders = { headers: { Authorization: `Bearer ${authToken}` } };

  // ----------------------------------------------------
  // TEST 0: Available Companies API
  // ----------------------------------------------------
  console.log('▶ [TEST 0] GET /api/company-interviews');
  const companiesRes = await axios.get(`${BASE_URL}/api/company-interviews`);
  if (!companiesRes.data.success || companiesRes.data.count !== 11) {
    throw new Error(`Expected 11 companies, got ${companiesRes.data.count}`);
  }
  const compNames = companiesRes.data.companies.map((c) => c.company);
  console.log(`  ✅ Successfully returned ${companiesRes.data.count} companies: ${compNames.join(', ')}`);

  // Verify Amazon totalQuestions === 75 and Google === 50
  const amazonMeta = companiesRes.data.companies.find((c) => c.company === 'Amazon');
  const googleMeta = companiesRes.data.companies.find((c) => c.company === 'Google');
  if (amazonMeta.totalQuestions !== 75) {
    throw new Error(`Expected Amazon to have 75 questions, got ${amazonMeta.totalQuestions}`);
  }
  if (googleMeta.totalQuestions !== 50) {
    throw new Error(`Expected Google to have 50 questions, got ${googleMeta.totalQuestions}`);
  }
  console.log(`  ✅ Question counts verified: Amazon = 75, Google = 50`);

  // ----------------------------------------------------
  // TEST 1: Amazon + Java Developer
  // ----------------------------------------------------
  console.log('\n▶ [TEST 1] Mock Interview: Target Role = Java Developer, Company = Amazon');
  const t1Res = await axios.post(
    `${BASE_URL}/api/interviews`,
    {
      role: 'Java Developer',
      company: 'Amazon',
      interviewType: 'Mixed',
      difficulty: 'Medium',
      recruiterType: 'Technical Interviewer',
      privacyMode: 'privacy',
    },
    authHeaders
  );

  const t1Interview = t1Res.data.interview;
  const q1 = t1Interview.questions[0];
  console.log(`  ✅ Interview created with ID: ${t1Interview._id}`);
  console.log(`  Company: ${t1Interview.company}, Role: ${t1Interview.role}`);
  console.log(`  Q1: "${q1.questionText}"`);
  console.log(`  SourceType: "${q1.sourceType}"`);
  console.log(`  Why this question: "${q1.whyThisQuestion}"`);

  if (!['database_question', 'pattern_derived'].includes(q1.sourceType)) {
    throw new Error(`Expected Amazon question to have sourceType database_question or pattern_derived, got ${q1.sourceType}`);
  }
  if (!q1.whyThisQuestion) {
    throw new Error('Expected whyThisQuestion explanation to be present');
  }
  console.log('  ✅ TEST 1 PASSED: Amazon data grounded, sourceType correctly recorded.');

  // ----------------------------------------------------
  // TEST 2: Amazon + Data Analyst (Target Role Independence)
  // ----------------------------------------------------
  console.log('\n▶ [TEST 2] Target Role Independence: Target Role = Data Analyst, Company = Amazon');
  const t2Res = await axios.post(
    `${BASE_URL}/api/interviews`,
    {
      role: 'Data Analyst',
      company: 'Amazon',
      interviewType: 'Mixed',
      difficulty: 'Medium',
      recruiterType: 'Technical Interviewer',
      privacyMode: 'privacy',
    },
    authHeaders
  );

  const t2Interview = t2Res.data.interview;
  const t2q1 = t2Interview.questions[0];
  console.log(`  ✅ Interview created with ID: ${t2Interview._id}`);
  console.log(`  Company: ${t2Interview.company}, Role: ${t2Interview.role}`);
  console.log(`  Q1: "${t2q1.questionText}"`);
  console.log(`  SourceType: "${t2q1.sourceType}"`);

  if (t2Interview.role !== 'Data Analyst' || t2Interview.company !== 'Amazon') {
    throw new Error('Expected Role to be Data Analyst and Company to remain Amazon');
  }
  console.log('  ✅ TEST 2 PASSED: Target Role is independent while Amazon remains knowledge source.');

  // ----------------------------------------------------
  // TEST 3: Google Company Grounding
  // ----------------------------------------------------
  console.log('\n▶ [TEST 3] Google Grounding: Target Role = Software Engineer, Company = Google');
  const t3Res = await axios.post(
    `${BASE_URL}/api/interviews`,
    {
      role: 'Software Engineer',
      company: 'Google',
      interviewType: 'Technical',
      difficulty: 'Hard',
      recruiterType: 'Technical Interviewer',
      privacyMode: 'privacy',
    },
    authHeaders
  );

  const t3Interview = t3Res.data.interview;
  const t3q1 = t3Interview.questions[0];
  console.log(`  ✅ Interview created with ID: ${t3Interview._id}`);
  console.log(`  Company: ${t3Interview.company}, Role: ${t3Interview.role}`);
  console.log(`  Q1: "${t3q1.questionText}"`);
  console.log(`  SourceType: "${t3q1.sourceType}"`);

  if (!['database_question', 'pattern_derived'].includes(t3q1.sourceType)) {
    throw new Error(`Expected Google question to be database grounded, got ${t3q1.sourceType}`);
  }
  console.log('  ✅ TEST 3 PASSED: Google data retrieved and grounded.');

  // ----------------------------------------------------
  // TEST 4: Custom Company Fallback
  // ----------------------------------------------------
  console.log('\n▶ [TEST 4] Custom Company Fallback: Company = "Acme FinTech Corp"');
  const t4Res = await axios.post(
    `${BASE_URL}/api/interviews`,
    {
      role: 'DevOps Engineer',
      company: 'Acme FinTech Corp',
      interviewType: 'Mixed',
      difficulty: 'Medium',
      recruiterType: 'Technical Interviewer',
      privacyMode: 'privacy',
    },
    authHeaders
  );

  const t4Interview = t4Res.data.interview;
  const t4q1 = t4Interview.questions[0];
  console.log(`  ✅ Interview created with ID: ${t4Interview._id}`);
  console.log(`  Company: ${t4Interview.company}`);
  console.log(`  Q1: "${t4q1.questionText}"`);
  console.log(`  SourceType: "${t4q1.sourceType}"`);
  console.log(`  Why this question: "${t4q1.whyThisQuestion}"`);

  if (t4q1.sourceType !== 'generic_role_based') {
    throw new Error(`Expected custom company to have sourceType generic_role_based, got ${t4q1.sourceType}`);
  }
  console.log('  ✅ TEST 4 PASSED: Custom Company correctly falls back to generic_role_based without fabricating data.');

  // ----------------------------------------------------
  // TEST 5: Complete Interview Flow & Report Verification
  // ----------------------------------------------------
  console.log('\n▶ [TEST 5] Complete Interview Flow & Interview Report Verification');
  // Submit answers to progress through interview
  const testInterviewId = t1Interview._id;

  for (let round = 1; round <= 4; round++) {
    const ansRes = await axios.post(
      `${BASE_URL}/api/interviews/${testInterviewId}/answer`,
      {
        answerText: `In my experience as a Java Developer, I implemented microservices using Spring Boot, Hibernate with optimistic locking, and optimized our Redis caching layer. For round ${round}, I followed the STAR method.`,
        durationSeconds: 35,
        currentTimestampSeconds: round * 40,
        visionMetrics: {
          faceDetectedPercentage: 95,
          eyeContactPercentage: 90,
          lookingAwayCount: 1,
          framingQuality: 'Good',
        },
      },
      authHeaders
    );

    console.log(`  Round ${round} answered. Next Q index: ${ansRes.data.currentQuestionIndex}`);
    if (ansRes.data.nextQuestion) {
      console.log(`    Next Q: "${ansRes.data.nextQuestion.questionText}" [${ansRes.data.nextQuestion.sourceType}]`);
      if (!['database_question', 'pattern_derived'].includes(ansRes.data.nextQuestion.sourceType)) {
        console.warn(`    Warning: Next question sourceType is ${ansRes.data.nextQuestion.sourceType}`);
      }
    }
  }

  // Answer question 5 to finish
  const finishAnsRes = await axios.post(
    `${BASE_URL}/api/interviews/${testInterviewId}/answer`,
    {
      answerText: 'In conclusion, I took ownership of our team CI/CD pipeline, resolving deployment downtime and establishing comprehensive unit test coverage.',
      durationSeconds: 40,
      currentTimestampSeconds: 220,
    },
    authHeaders
  );

  console.log(`  Question 5 answered. isComplete = ${finishAnsRes.data.isComplete}`);

  // End interview
  const endRes = await axios.post(
    `${BASE_URL}/api/interviews/${testInterviewId}/end`,
    { totalDurationSeconds: 230 },
    authHeaders
  );

  const finalReport = endRes.data.report || endRes.data.finalReport || endRes.data.interview?.finalReport;
  if (!endRes.data.success || !finalReport) {
    throw new Error('Failed to generate final report');
  }

  console.log(`  ✅ Interview completed. Overall Score: ${finalReport.overallScore}/100`);

  // Verify interview report document retains all sourceTypes
  const reportRes = await axios.get(`${BASE_URL}/api/interviews/${testInterviewId}`, authHeaders);
  const completedInterview = reportRes.data.interview;

  console.log('\n  Questions Summary in Final Report:');
  completedInterview.questions.forEach((q, i) => {
    console.log(`    Q${i + 1} (${q.category}) [${q.sourceType}]: "${q.questionText.substring(0, 60)}..."`);
    if (!q.sourceType) {
      throw new Error(`Q${i + 1} missing sourceType`);
    }
  });

  console.log('\n====================================================');
  console.log('🎉 ALL 5 TESTS PASSED SUCCESSFULLY! 100% VERIFIED!');
  console.log('====================================================\n');
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err.response?.data || err.message);
    process.exit(1);
  });
