const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleLogin,
  getMe,
  updatePrivacySettings,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.put('/reset-password/:token', resetPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/privacy-settings', protect, updatePrivacySettings);

module.exports = router;
