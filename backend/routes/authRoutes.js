const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleLogin,
  googleAuthorize,
  googleCallback,
  githubAuthorize,
  githubCallback,
  codolioStatus,
  getMe,
  updatePrivacySettings,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Local Authentication
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.put('/reset-password/:token', resetPassword);
router.post('/reset-password', resetPassword);

// Google OAuth
router.get('/google/login', googleAuthorize);
router.get('/google', googleAuthorize);
router.get('/google/callback', googleCallback);
router.post('/google', googleLogin);

// GitHub OAuth
router.get('/github/login', githubAuthorize);
router.get('/github', githubAuthorize);
router.get('/github/callback', githubCallback);

// Codolio Integration Status
router.get('/codolio', codolioStatus);

// User Session & Settings
router.get('/me', protect, getMe);
router.put('/privacy-settings', protect, updatePrivacySettings);

module.exports = router;
