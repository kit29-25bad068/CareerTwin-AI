const User = require('../models/User');
const CodolioProfile = require('../models/CodolioProfile');
const codolioService = require('../services/codolioService');

// @desc    Get user's Codolio profile & coding metrics
// @route   GET /api/codolio
// @access  Private / Optional Auth
exports.getCodolioProfile = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    let profile = await CodolioProfile.findOne({ user: userId });
    if (!profile) {
      // Check if user has codolioUsername or codolioUrl in User document
      const user = await User.findById(userId);
      if (user?.codolioUsername || user?.codolioUrl) {
        const username = user.codolioUsername || codolioService.extractCodolioUsername(user.codolioUrl);
        if (username) {
          const syncedData = await codolioService.fetchAndAnalyzeCodolio(username, userId);
          profile = await CodolioProfile.findOneAndUpdate(
            { user: userId },
            { user: userId, ...syncedData },
            { upsert: true, new: true }
          );
        }
      }
    }

    if (!profile) {
      return res.status(200).json({
        success: true,
        hasCodolio: false,
        profile: null,
      });
    }

    res.status(200).json({
      success: true,
      hasCodolio: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually sync or re-sync Codolio metrics
// @route   POST /api/codolio/sync
// @access  Private
exports.syncCodolio = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const codolioInput = req.body.codolioUrl || req.body.username || user.codolioUrl || user.codolioUsername;
    if (!codolioInput) {
      return res.status(400).json({
        success: false,
        message: 'No Codolio profile link or username provided to sync.',
      });
    }

    const username = codolioService.extractCodolioUsername(codolioInput);
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Codolio profile link or username.',
      });
    }

    // Check if this Codolio profile is already linked to another account
    const existingCodolioUser = await User.findOne({
      codolioUsername: username,
      _id: { $ne: user._id },
    });
    if (existingCodolioUser) {
      return res.status(400).json({
        success: false,
        message: `This Codolio profile (@${username}) is already linked to another Career Twin account.`,
      });
    }

    const cleanUrl = codolioInput.startsWith('http') ? codolioInput : `https://codolio.com/profile/${username}`;

    // Update User record
    user.codolioUrl = cleanUrl;
    user.codolioUsername = username;
    await user.save();

    // Fetch and analyze
    const syncedData = await codolioService.fetchAndAnalyzeCodolio(username, userId);
    const profile = await CodolioProfile.findOneAndUpdate(
      { user: userId },
      { user: userId, ...syncedData },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Codolio coding portfolio synchronized successfully.',
      profile,
    });
  } catch (error) {
    next(error);
  }
};
