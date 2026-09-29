const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');

router.get('/cohort', teacherController.getCohort);
router.get('/interventions', teacherController.getInterventions);
router.post('/override', teacherController.postOverride);
router.get('/audit-log', teacherController.getAuditLog);
router.put('/interventions/:id/resolve', teacherController.resolveIntervention);

module.exports = router;
