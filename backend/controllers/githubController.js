const GitHubProfile = require('../models/GitHubProfile');
const CareerProfile = require('../models/CareerProfile');
const Skill = require('../models/Skill');
const User = require('../models/User');
const githubService = require('../services/githubService');

// @desc    Connect and analyze GitHub username
// @route   POST /api/github/sync
// @access  Private
exports.syncGitHub = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, message: 'Please provide a GitHub username.' });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');

    // Check if this GitHub username is already linked to another account
    const existingGithubUser = await User.findOne({
      githubUsername: cleanUsername,
      _id: { $ne: req.user._id },
    });
    if (existingGithubUser) {
      return res.status(400).json({
        success: false,
        message: `This GitHub profile (@${cleanUsername}) is already linked to another Career Twin account.`,
      });
    }

    // Update User record
    await User.findByIdAndUpdate(req.user._id, {
      githubUsername: cleanUsername,
      githubUrl: `https://github.com/${cleanUsername}`,
    });

    const profile = await CareerProfile.findOne({ user: req.user._id });
    const targetRole = profile?.targetRole || 'Software Engineer';

    // 1. Fetch & analyze via GitHub Service
    const githubData = await githubService.fetchAndAnalyzeGitHub(username, targetRole);

    // 2. Upsert GitHubProfile document
    const githubProfile = await GitHubProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        ...githubData,
      },
      { upsert: true, new: true }
    );

    // 3. Auto-sync top languages to Skill database
    if (githubData.topLanguages && Array.isArray(githubData.topLanguages)) {
      for (const lang of githubData.topLanguages) {
        if (lang.language && lang.language !== 'Unspecified') {
          await Skill.findOneAndUpdate(
            { user: req.user._id, name: lang.language },
            {
              $setOnInsert: {
                user: req.user._id,
                name: lang.language,
                category: 'Programming Languages',
                proficiency: Math.min(60 + (lang.percentage || 20), 95),
                source: 'github',
                isGap: false,
              },
            },
            { upsert: true }
          );
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `GitHub profile @${githubData.username} synced and analyzed successfully.`,
      github: githubProfile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's connected GitHub profile & insights
// @route   GET /api/github
// @access  Private
exports.getGitHubProfile = async (req, res, next) => {
  try {
    let github = await GitHubProfile.findOne({ user: req.user._id });

    // If user has a registered GitHub username but analysis document isn't saved yet, auto-sync it now
    if (!github && req.user.githubUsername) {
      try {
        const cleanUsername = req.user.githubUsername.trim().toLowerCase().replace(/^@/, '');
        const profile = await CareerProfile.findOne({ user: req.user._id });
        const targetRole = profile?.targetRole || 'Full Stack Developer';

        const githubData = await githubService.fetchAndAnalyzeGitHub(cleanUsername, targetRole);

        github = await GitHubProfile.findOneAndUpdate(
          { user: req.user._id },
          {
            user: req.user._id,
            ...githubData,
          },
          { upsert: true, new: true }
        );

        // Auto-sync top languages to Skill database
        if (githubData.topLanguages && Array.isArray(githubData.topLanguages)) {
          for (const lang of githubData.topLanguages) {
            if (lang.language && lang.language !== 'Unspecified') {
              await Skill.findOneAndUpdate(
                { user: req.user._id, name: lang.language },
                {
                  $setOnInsert: {
                    user: req.user._id,
                    name: lang.language,
                    category: 'Programming Languages',
                    proficiency: Math.min(60 + (lang.percentage || 20), 95),
                    source: 'github',
                    isGap: false,
                  },
                },
                { upsert: true }
              );
            }
          }
        }
      } catch (autoErr) {
        console.warn('[Auto GitHub Sync on GET Warning]:', autoErr.message);
      }
    }

    if (!github) {
      return res.status(200).json({
        success: true,
        isConnected: false,
        github: null,
        githubUsername: req.user.githubUsername || null,
        githubUrl: req.user.githubUrl || null,
      });
    }

    res.status(200).json({
      success: true,
      isConnected: true,
      github,
      githubUsername: req.user.githubUsername || github.username,
      githubUrl: req.user.githubUrl || `https://github.com/${github.username}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Disconnect GitHub profile
// @route   DELETE /api/github
// @access  Private
exports.disconnectGitHub = async (req, res, next) => {
  try {
    await GitHubProfile.findOneAndDelete({ user: req.user._id });
    res.status(200).json({
      success: true,
      message: 'GitHub profile disconnected and insights removed.',
    });
  } catch (error) {
    next(error);
  }
};
