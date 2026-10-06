const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const CareerProfile = require('../models/CareerProfile');
const GitHubProfile = require('../models/GitHubProfile');
const githubService = require('../services/githubService');
const CodolioProfile = require('../models/CodolioProfile');
const codolioService = require('../services/codolioService');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'careertwin_super_secure_jwt_secret_key_change_in_production_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Helper: Extract clean GitHub username from URL, @username, or raw username
function extractGitHubUsername(input) {
  if (!input) return null;
  let cleaned = input.trim().replace(/\/+$/, '');
  const match = cleaned.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_\-]+)/i);
  if (match && match[1]) {
    return match[1].toLowerCase();
  }
  cleaned = cleaned.replace(/^@/, '');
  return cleaned.toLowerCase();
}

// @desc    Register a new user & initialize empty CareerProfile + GitHub sync
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, githubUrl, codolioUrl } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    if (!githubUrl || !githubUrl.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide your GitHub profile link.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
    }

    const parsedGitHubUsername = extractGitHubUsername(githubUrl);
    if (!parsedGitHubUsername) {
      return res.status(400).json({ success: false, message: 'Please provide a valid GitHub profile link or username.' });
    }

    // Check if GitHub profile is already linked to another account
    const existingGithubUser = await User.findOne({ githubUsername: parsedGitHubUsername });
    if (existingGithubUser) {
      return res.status(400).json({
        success: false,
        message: `This GitHub profile (@${parsedGitHubUsername}) is already linked to another account. Each account must have a unique GitHub profile.`,
      });
    }

    const cleanGitHubUrl = githubUrl.trim().startsWith('http')
      ? githubUrl.trim()
      : `https://github.com/${parsedGitHubUsername}`;

    let parsedCodolioUsername = null;
    let cleanCodolioUrl = null;
    if (codolioUrl && codolioUrl.trim()) {
      parsedCodolioUsername = codolioService.extractCodolioUsername(codolioUrl);
      if (parsedCodolioUsername) {
        // Check if Codolio profile is already linked to another account
        const existingCodolioUser = await User.findOne({ codolioUsername: parsedCodolioUsername });
        if (existingCodolioUser) {
          return res.status(400).json({
            success: false,
            message: `This Codolio profile (@${parsedCodolioUsername}) is already linked to another account. Each account must have a unique Codolio profile.`,
          });
        }
        cleanCodolioUrl = codolioUrl.trim().startsWith('http')
          ? codolioUrl.trim()
          : `https://codolio.com/profile/${parsedCodolioUsername}`;
      }
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      githubUrl: cleanGitHubUrl,
      githubUsername: parsedGitHubUsername,
      codolioUrl: cleanCodolioUrl,
      codolioUsername: parsedCodolioUsername,
    });

    // Automatically create initial CareerProfile
    await CareerProfile.create({
      user: user._id,
      targetRole: 'Full Stack Developer',
      experienceLevel: 'student',
    });

    // Automatically trigger GitHub profile sync
    if (parsedGitHubUsername) {
      try {
        const githubData = await githubService.fetchAndAnalyzeGitHub(parsedGitHubUsername, 'Full Stack Developer');
        await GitHubProfile.findOneAndUpdate(
          { user: user._id },
          { user: user._id, ...githubData },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn('[GitHub Auto-Sync Warning]:', err.message);
      }
    }

    // Automatically trigger Codolio coding platform performance sync in background
    if (parsedCodolioUsername) {
      codolioService.fetchAndAnalyzeCodolio(parsedCodolioUsername, user._id)
        .then((codolioData) => {
          return CodolioProfile.findOneAndUpdate(
            { user: user._id },
            { user: user._id, ...codolioData },
            { upsert: true, new: true }
          );
        })
        .catch((err) => {
          console.warn('[Codolio Auto-Sync Warning]:', err.message);
        });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully with GitHub & Codolio profiles.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        githubUsername: user.githubUsername,
        githubUrl: user.githubUrl,
        codolioUsername: user.codolioUsername,
        codolioUrl: user.codolioUrl,
        privacySettings: user.privacySettings,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || '';
      if (field === 'githubUsername') {
        return res.status(400).json({
          success: false,
          message: 'This GitHub profile is already linked to another Career Twin account.',
        });
      }
      if (field === 'codolioUsername') {
        return res.status(400).json({
          success: false,
          message: 'This Codolio profile is already linked to another Career Twin account.',
        });
      }
      if (field === 'email') {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists.',
        });
      }
    }
    next(error);
  }
};

// @desc    Authenticate user & get token (supports email OR GitHub username)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email or GitHub username and password.' });
    }

    const cleanInput = email.toLowerCase().trim();
    const parsedUsername = extractGitHubUsername(cleanInput);

    // Support sign in via email address OR GitHub username OR full GitHub URL
    const user = await User.findOne({
      $or: [
        { email: cleanInput },
        { githubUsername: parsedUsername },
        { githubUrl: cleanInput },
      ],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email or GitHub username. Please click "Create Career Twin" to register.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please check your password and try again.' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        githubUsername: user.githubUsername,
        githubUrl: user.githubUrl,
        privacySettings: user.privacySettings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate or register user via Google Sign-In
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res, next) => {
  try {
    const { credential, email, name, googleId, avatar } = req.body;

    let userEmail = email;
    let userName = name;
    let userGoogleId = googleId;
    let userAvatar = avatar;

    // Decode Google JWT credential if supplied via Google One-Tap / Identity Services
    if (credential) {
      try {
        const payloadBase64 = credential.split('.')[1];
        if (payloadBase64) {
          const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
          userEmail = decoded.email || userEmail;
          userName = decoded.name || userName;
          userGoogleId = decoded.sub || userGoogleId;
          userAvatar = decoded.picture || userAvatar;
        }
      } catch (err) {
        console.warn('[Google Auth Warning] Could not decode credential payload:', err.message);
      }
    }

    if (!userEmail) {
      return res.status(400).json({ success: false, message: 'Google account email is required.' });
    }

    userEmail = userEmail.toLowerCase().trim();
    userName = userName ? userName.trim() : userEmail.split('@')[0];

    // Find existing user by email or googleId
    let user = await User.findOne({
      $or: [
        { email: userEmail },
        ...(userGoogleId ? [{ googleId: userGoogleId }] : []),
      ],
    });

    if (!user) {
      // Create new user for first-time Google sign-in
      const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!';
      const defaultGithub = userEmail.split('@')[0].replace(/[^a-zA-Z0-9_\-]/g, '');

      // Ensure githubUsername doesn't conflict
      let uniqueGithub = defaultGithub || `user_${Date.now()}`;
      const existingGh = await User.findOne({ githubUsername: uniqueGithub });
      if (existingGh) {
        uniqueGithub = `${uniqueGithub}_${Math.floor(1000 + Math.random() * 9000)}`;
      }

      user = await User.create({
        name: userName,
        email: userEmail,
        password: randomPassword,
        googleId: userGoogleId || `google_${Date.now()}`,
        avatar: userAvatar,
        authProvider: 'google',
        githubUrl: `https://github.com/${uniqueGithub}`,
        githubUsername: uniqueGithub,
      });

      // Automatically create initial CareerProfile
      await CareerProfile.create({
        user: user._id,
        targetRole: 'Full Stack Developer',
        experienceLevel: 'student',
      });
    } else {
      let needsSave = false;
      if (userGoogleId && !user.googleId) {
        user.googleId = userGoogleId;
        needsSave = true;
      }
      if (userAvatar && !user.avatar) {
        user.avatar = userAvatar;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Signed in successfully with Google.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        githubUsername: user.githubUsername,
        githubUrl: user.githubUrl,
        codolioUsername: user.codolioUsername,
        codolioUrl: user.codolioUrl,
        avatar: user.avatar,
        privacySettings: user.privacySettings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current authenticated user info
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        githubUsername: user.githubUsername,
        githubUrl: user.githubUrl,
        privacySettings: user.privacySettings,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update privacy settings
// @route   PUT /api/auth/privacy-settings
// @access  Private
exports.updatePrivacySettings = async (req, res, next) => {
  try {
    const { defaultPrivacyMode, cameraPermission, micPermission } = req.body;
    const user = await User.findById(req.user._id);

    if (defaultPrivacyMode && ['privacy', 'replay'].includes(defaultPrivacyMode)) {
      user.privacySettings.defaultPrivacyMode = defaultPrivacyMode;
    }
    if (typeof cameraPermission === 'boolean') {
      user.privacySettings.cameraPermission = cameraPermission;
    }
    if (typeof micPermission === 'boolean') {
      user.privacySettings.micPermission = micPermission;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Privacy settings updated successfully.',
      privacySettings: user.privacySettings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate password reset token & link
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your email address.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address. Please check your spelling or register.',
      });
    }

    // Generate token (hashed and saved in DB with 15-minute expiry)
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Construct reset URL
    const host = req.get('host');
    const protocol = req.protocol;
    const resetUrl = `${protocol}://${host}/reset-password.html?token=${resetToken}`;

    res.status(200).json({
      success: true,
      message: 'Password reset link generated successfully. Valid for 15 minutes.',
      resetToken,
      resetUrl,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const resetToken = req.params.token || req.body.token;
    const { password } = req.body;

    if (!resetToken) {
      return res.status(400).json({ success: false, message: 'Password reset token is missing.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    // Hash the plain incoming token using SHA-256 to compare with stored token
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token. Please request a new link.',
      });
    }

    // Set new password (pre-save hook will hash it with bcrypt)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now sign in with your new password.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

