const express = require('express');
const router = express.Router();
const { getCodolioProfile, syncCodolio } = require('../controllers/codolioController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getCodolioProfile);
router.post('/sync', protect, syncCodolio);

module.exports = router;
