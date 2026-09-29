const express = require('express');
const router = express.Router();
const {
  getCompanies,
  getCompanyByName,
  getCompanyCategoryQuestions,
} = require('../controllers/companyInterviewController');

// Routes for company interview knowledge base
router.get('/', getCompanies);
router.get('/:company', getCompanyByName);
router.get('/:company/categories/:category', getCompanyCategoryQuestions);

module.exports = router;
