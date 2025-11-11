const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Assessment = require('../models/Assessment');
const Session = require('../models/Session');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('assessments')
      .select('-passwordHash -refreshTokens');

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
    });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('profile.phone')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Invalid phone number format'),
  body('profile.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('profile.location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  body('profile.bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('profile.age')
    .optional()
    .isInt({ min: 13, max: 120 })
    .withMessage('Age must be between 13 and 120'),
  body('profile.gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
    .withMessage('Invalid gender option'),
  body('profile.emergencyContact.name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Emergency contact name cannot exceed 100 characters'),
  body('profile.emergencyContact.phone')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Invalid phone number format'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { name, profile } = req.body;
    const user = req.user;

    // Update fields if provided
    if (name) user.name = name;
    if (profile) {
      // Only update the fields that are provided in the profile object
      Object.keys(profile).forEach(key => {
        if (profile[key] !== undefined) {
          user.profile[key] = profile[key];
        }
      });
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: user.toJSON() },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
});

// @route   PUT /api/user/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', [
  body('voiceEnabled')
    .optional()
    .isBoolean()
    .withMessage('Voice enabled must be a boolean'),
  body('notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications must be a boolean'),
  body('theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be light or dark'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { voiceEnabled, notifications, theme } = req.body;
    const user = req.user;

    // Update preferences
    if (voiceEnabled !== undefined) user.preferences.voiceEnabled = voiceEnabled;
    if (notifications !== undefined) user.preferences.notifications = notifications;
    if (theme !== undefined) user.preferences.theme = theme;

    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: { preferences: user.preferences },
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
    });
  }
});

// @route   GET /api/user/dashboard
// @desc    Get dashboard data
// @access  Private
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get recent assessments
    const recentAssessments = await Assessment.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent sessions
    const recentSessions = await Session.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('type title createdAt duration sentiment');

    // Calculate statistics
    const totalAssessments = await Assessment.countDocuments({ userId });
    const totalSessions = await Session.countDocuments({ userId });

    // Get mood trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const moodTrends = await Session.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: thirtyDaysAgo },
          'mood.after': { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          averageMood: { $avg: { $switch: {
            branches: [
              { case: { $eq: ['$mood.after', 'very-low'] }, then: 1 },
              { case: { $eq: ['$mood.after', 'low'] }, then: 2 },
              { case: { $eq: ['$mood.after', 'neutral'] }, then: 3 },
              { case: { $eq: ['$mood.after', 'good'] }, then: 4 },
              { case: { $eq: ['$mood.after', 'very-good'] }, then: 5 },
            ],
            default: 3,
          }}},
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get assessment summary
    const assessmentSummary = await Assessment.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          averageScore: { $avg: '$percentage' },
          latestScore: { $last: '$percentage' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        user: req.user.toJSON(),
        stats: {
          totalAssessments,
          totalSessions,
          assessmentTypes: assessmentSummary.length,
        },
        recentAssessments,
        recentSessions,
        moodTrends,
        assessmentSummary,
      },
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
    });
  }
});

// @route   GET /api/user/assessments
// @desc    Get user assessments with pagination
// @access  Private
router.get('/assessments', async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const userId = req.user._id;

    const query = { userId };
    if (type) query.type = type;

    const assessments = await Assessment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Assessment.countDocuments(query);

    res.json({
      success: true,
      data: {
        assessments,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assessments',
    });
  }
});

// @route   GET /api/user/sessions
// @desc    Get user sessions with pagination
// @access  Private
router.get('/sessions', async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const userId = req.user._id;

    const query = { userId };
    if (type) query.type = type;

    const sessions = await Session.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-messages'); // Exclude messages for performance

    const total = await Session.countDocuments(query);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sessions',
    });
  }
});

// @route   DELETE /api/user/account
// @desc    Delete user account
// @access  Private
router.delete('/account', [
  body('password')
    .notEmpty()
    .withMessage('Password is required to delete account'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { password } = req.body;
    const user = req.user;

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }

    // Soft delete - deactivate account
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save();

    // Note: In a production environment, you might want to:
    // 1. Anonymize user data instead of deleting
    // 2. Keep assessments and sessions for research (anonymized)
    // 3. Send confirmation email
    // 4. Log the deletion for audit purposes

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
    });
  }
});

// @route   GET /api/user/export
// @desc    Export user data
// @access  Private
router.get('/export', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all user data
    const user = await User.findById(userId).select('-passwordHash -refreshTokens');
    const assessments = await Assessment.find({ userId });
    const sessions = await Session.find({ userId });

    const exportData = {
      user: user.toJSON(),
      assessments,
      sessions,
      exportedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export user data',
    });
  }
});

module.exports = router;