const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testCompanyInterviewAPI() {
  console.log('Testing GET /api/company-interviews...');
  const res = await axios.get(`${BASE_URL}/api/company-interviews`);
  if (!res.data.success || res.data.count !== 11) {
    throw new Error(`Expected 11 companies, got ${res.data.count}`);
  }
  console.log('✅ GET /api/company-interviews passed. Total companies:', res.data.count);

  console.log('Testing GET /api/company-interviews/Amazon...');
  const amazonRes = await axios.get(`${BASE_URL}/api/company-interviews/Amazon`);
  if (!amazonRes.data.success || amazonRes.data.data.metadata.totalQuestions !== 75) {
    throw new Error(`Expected Amazon totalQuestions 75, got ${amazonRes.data.data?.metadata?.totalQuestions}`);
  }
  console.log('✅ GET /api/company-interviews/Amazon passed. Questions:', amazonRes.data.data.metadata.totalQuestions);

  console.log('Testing GET /api/company-interviews/Amazon/categories/behavioral...');
  const behavRes = await axios.get(`${BASE_URL}/api/company-interviews/Amazon/categories/behavioral`);
  if (!behavRes.data.success || behavRes.data.count < 1) {
    throw new Error('Expected behavioral questions for Amazon');
  }
  console.log('✅ GET /api/company-interviews/Amazon/categories/behavioral passed. Count:', behavRes.data.count);

  console.log('Testing GET /api/company-interviews/NonExistentCompany (404)...');
  try {
    await axios.get(`${BASE_URL}/api/company-interviews/NonExistentCompany`);
    throw new Error('Expected 404 for NonExistentCompany');
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.log('✅ Correctly returned 404 for unknown company.');
    } else {
      throw err;
    }
  }

  console.log('🎉 ALL API ENDPOINTS VERIFIED!');
}

testCompanyInterviewAPI()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('API Test failed:', e.message);
    process.exit(1);
  });
