const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const CompanyInterviewData = require('../models/CompanyInterviewData');

let localCompanyCache = null;

/**
 * Loads verified company dataset from local JSON file if database is empty or offline.
 */
function getLocalCompanyData() {
  if (localCompanyCache) return localCompanyCache;
  try {
    const filePath = path.join(__dirname, '..', 'data', 'company_interviews.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      const formatted = {};

      for (const [companyName, questions] of Object.entries(parsed)) {
        const categories = {};
        const categoryCounts = {};

        questions.forEach((q, idx) => {
          const cat = q.category || 'other';
          if (!categories[cat]) categories[cat] = [];
          const item = {
            id: `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${cat}_${idx + 1}`,
            question: q.question,
            category: cat,
            sourceType: 'database_question',
            company: companyName,
            datasetSource: 'company_interviews_dataset',
          };
          categories[cat].push(item);
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        formatted[companyName] = {
          company: companyName,
          categories,
          categoryCounts,
          totalQuestions: questions.length,
          availableCategories: Object.keys(categoryCounts),
          metadata: {
            source: 'Verified Company Interview Dataset',
            datasetSource: 'company_interviews_dataset',
            totalQuestions: questions.length,
            availableCategories: Object.keys(categoryCounts),
          },
        };
      }

      localCompanyCache = formatted;
      return localCompanyCache;
    }
  } catch (err) {
    console.error('Error loading fallback company dataset:', err.message);
  }
  return null;
}

// @desc    Get all available companies from MongoDB with question counts & category metadata
// @route   GET /api/company-interviews
// @access  Public
exports.getCompanies = async (req, res, next) => {
  try {
    let companyList = [];

    // Query DB only if connection is active
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const companies = await CompanyInterviewData.find({}, 'company metadata categories').lean();
        if (companies && companies.length > 0) {
          companyList = companies.map((c) => {
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
                source: c.metadata?.source || 'Verified Company Interview Dataset',
                datasetSource: c.metadata?.datasetSource || 'company_interviews_dataset',
                importedAt: c.metadata?.importedAt,
              },
            };
          });
        }
      } catch (dbErr) {
        console.warn('MongoDB query failed for company interviews, falling back to local dataset:', dbErr.message);
      }
    }

    // Fallback to local verified dataset if database is offline or returned 0 records
    if (companyList.length === 0) {
      const localData = getLocalCompanyData();
      if (localData) {
        companyList = Object.values(localData).map((c) => ({
          company: c.company,
          totalQuestions: c.totalQuestions,
          availableCategories: c.availableCategories,
          categoryCounts: c.categoryCounts,
          metadata: c.metadata,
        }));
      }
    }

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
    let companyData = null;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        companyData = await CompanyInterviewData.findOne({
          company: new RegExp('^' + companyParam.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', 'i'),
        });
      } catch (dbErr) {
        console.warn('MongoDB lookup failed for company by name, checking local dataset:', dbErr.message);
      }
    }

    // Fallback to local verified dataset
    if (!companyData) {
      const localData = getLocalCompanyData();
      if (localData) {
        const foundKey = Object.keys(localData).find(
          (k) => k.toLowerCase() === companyParam.toLowerCase()
        );
        if (foundKey) {
          companyData = localData[foundKey];
        }
      }
    }

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
    let companyData = null;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        companyData = await CompanyInterviewData.findOne({
          company: new RegExp('^' + company.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', 'i'),
        });
      } catch (dbErr) {
        console.warn('MongoDB lookup failed for category questions, checking local dataset:', dbErr.message);
      }
    }

    // Fallback to local verified dataset
    if (!companyData) {
      const localData = getLocalCompanyData();
      if (localData) {
        const foundKey = Object.keys(localData).find(
          (k) => k.toLowerCase() === company.trim().toLowerCase()
        );
        if (foundKey) {
          companyData = localData[foundKey];
        }
      }
    }

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

