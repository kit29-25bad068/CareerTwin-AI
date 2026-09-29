const CompanyInterviewData = require('../models/CompanyInterviewData');

// @desc    Get all available companies from MongoDB with question counts & category metadata
// @route   GET /api/company-interviews
// @access  Public
exports.getCompanies = async (req, res, next) => {
  try {
    const companies = await CompanyInterviewData.find({}, 'company metadata categories').lean();

    const companyList = companies.map((c) => {
      // Calculate category counts
      const categoryCounts = {};
      let totalCount = 0;

      if (c.categories) {
        Object.keys(c.categories).forEach((cat) => {
          const count = Array.isArray(c.categories[cat]) ? c.categories[cat].length : 0;
          if (count > 0) {
            categoryCounts[cat] = count;
            totalCount += count;
          }
        });
      }

      return {
        company: c.company,
        totalQuestions: c.metadata?.totalQuestions || totalCount,
        availableCategories: c.metadata?.availableCategories || Object.keys(categoryCounts),
        categoryCounts,
        metadata: {
          source: c.metadata?.source || 'Uploaded Company Interview Dataset',
          datasetSource: c.metadata?.datasetSource || 'uploaded_word_document',
          importedAt: c.metadata?.importedAt,
        },
      };
    });

    // Sort alphabetically by company name
    companyList.sort((a, b) => a.company.localeCompare(b.company));

    res.status(200).json({
      success: true,
      count: companyList.length,
      companies: companyList,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get full interview database for a specific company
// @route   GET /api/company-interviews/:company
// @access  Public
exports.getCompanyByName = async (req, res, next) => {
  try {
    const companyParam = req.params.company.trim();

    // Case-insensitive lookup
    const companyData = await CompanyInterviewData.findOne({
      company: new RegExp('^' + companyParam.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', 'i'),
    });

    if (!companyData) {
      return res.status(404).json({
        success: false,
        message: `Company interview data for "${companyParam}" is not available in the database.`,
      });
    }

    res.status(200).json({
      success: true,
      data: companyData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get questions for a specific category within a company
// @route   GET /api/company-interviews/:company/categories/:category
// @access  Public
exports.getCompanyCategoryQuestions = async (req, res, next) => {
  try {
    const { company, category } = req.params;

    const companyData = await CompanyInterviewData.findOne({
      company: new RegExp('^' + company.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', 'i'),
    });

    if (!companyData) {
      return res.status(404).json({
        success: false,
        message: `Company "${company}" not found in interview database.`,
      });
    }

    const catKey = category.trim();
    const questions = companyData.categories?.[catKey] || [];

    res.status(200).json({
      success: true,
      company: companyData.company,
      category: catKey,
      count: questions.length,
      questions,
    });
  } catch (error) {
    next(error);
  }
};
