const express = require('express');
const router = express.Router();
const adaptiveController = require('../controllers/adaptiveController');

router.get('/concepts', adaptiveController.getConcepts);
router.get('/concepts/graph', adaptiveController.getConceptGraph);
router.get('/questions', adaptiveController.getQuestions);
router.get('/config', adaptiveController.getAdaptiveConfig);
router.post('/attempts', adaptiveController.submitAttempt);
router.get('/attempts', adaptiveController.getAttempts);
router.get('/diagnostic-questions', adaptiveController.getDiagnosticQuestions);
router.get('/mastery', adaptiveController.getLearnerMastery);
router.get('/next-action', adaptiveController.getNextAction);
router.get('/learning-path', adaptiveController.getLearningPath);
router.get('/decisions', adaptiveController.getDecisions);
router.get('/career-evidence', adaptiveController.getCareerEvidence);

const { optionalProtect } = require('../middleware/auth');
const { uploadResume: multerResumeUpload } = require('../middleware/upload');

// Diagnostic Room: Unified Skill Extraction Endpoints
router.get('/diagnostic/inventory', optionalProtect, adaptiveController.getDiagnosticSkillInventory);
router.post('/diagnostic/extract', optionalProtect, adaptiveController.extractDiagnosticSkills);
router.post('/diagnostic/upload-resume', optionalProtect, multerResumeUpload.single('resume'), adaptiveController.uploadDiagnosticResume);
router.delete('/diagnostic/inventory', optionalProtect, adaptiveController.deleteDiagnosticSkillInventory);

module.exports = router;


