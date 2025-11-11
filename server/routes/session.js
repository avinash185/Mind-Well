const express = require('express');
const { body, validationResult } = require('express-validator');
const Session = require('../models/Session');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/sessions
// @desc    Get user's sessions with pagination and filtering
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      mood,
      startDate,
      endDate,
      sort = 'newest'
    } = req.query;

    // Build query
    const query = { userId: req.user.id };
    
    if (type) query.type = type;
    if (mood) query.mood = mood;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Sort options
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      longest: { duration: -1 },
      shortest: { duration: 1 }
    };

    const sessions = await Session.find(query)
      .sort(sortOptions[sort] || sortOptions.newest)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-messages.metadata -flags'); // Exclude sensitive data

    const total = await Session.countDocuments(query);

    // Get session statistics
    const stats = await Session.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          averageDuration: { $avg: '$duration' },
          moodDistribution: {
            $push: '$mood'
          },
          typeDistribution: {
            $push: '$type'
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
        stats: stats[0] || {
          totalSessions: 0,
          totalDuration: 0,
          averageDuration: 0,
          moodDistribution: [],
          typeDistribution: []
        }
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

// @route   GET /api/sessions/:id
// @desc    Get specific session by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const session = await Session.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    res.json({
      success: true,
      data: { session },
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session',
    });
  }
});

// @route   GET /api/sessions/analytics/overview
// @desc    Get session analytics overview
// @access  Private
router.get('/analytics/overview', authenticateToken, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const analytics = await Session.aggregate([
      {
        $match: {
          userId: req.user.id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          averageDuration: { $avg: '$duration' },
          moodTrend: {
            $push: {
              date: '$createdAt',
              mood: '$mood'
            }
          },
          topTopics: {
            $push: '$topics'
          },
          sentimentTrend: {
            $push: {
              date: '$createdAt',
              sentiment: '$sentiment'
            }
          }
        }
      },
      {
        $project: {
          totalSessions: 1,
          totalDuration: 1,
          averageDuration: 1,
          moodTrend: 1,
          sentimentTrend: 1,
          topTopics: {
            $reduce: {
              input: '$topTopics',
              initialValue: [],
              in: { $concatArrays: ['$$value', '$$this'] }
            }
          }
        }
      }
    ]);

    // Process top topics
    const result = analytics[0] || {
      totalSessions: 0,
      totalDuration: 0,
      averageDuration: 0,
      moodTrend: [],
      sentimentTrend: [],
      topTopics: []
    };

    // Count topic frequency
    const topicCounts = {};
    result.topTopics.forEach(topic => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });

    result.topTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    res.json({
      success: true,
      data: { analytics: result },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
    });
  }
});

// @route   GET /api/sessions/analytics/mood-trends
// @desc    Get mood trends over time
// @access  Private
router.get('/analytics/mood-trends', authenticateToken, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const moodTrends = await Session.aggregate([
      {
        $match: {
          userId: req.user.id,
          createdAt: { $gte: startDate },
          mood: { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            mood: '$mood'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          moods: {
            $push: {
              mood: '$_id.mood',
              count: '$count'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: { moodTrends },
    });
  } catch (error) {
    console.error('Get mood trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get mood trends',
    });
  }
});

// @route   PUT /api/sessions/:id/feedback
// @desc    Add feedback to a session
// @access  Private
router.put('/:id/feedback', [
  authenticateToken,
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment must be less than 500 characters'),
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

    const { id } = req.params;
    const { rating, comment } = req.body;

    const session = await Session.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      {
        feedback: {
          rating,
          comment,
          submittedAt: new Date()
        }
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    res.json({
      success: true,
      message: 'Feedback added successfully',
      data: { session },
    });
  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add feedback',
    });
  }
});

// @route   DELETE /api/sessions/:id
// @desc    Delete a session
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const session = await Session.findOneAndDelete({
      _id: id,
      userId: req.user.id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    res.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete session',
    });
  }
});

// @route   GET /api/sessions/export
// @desc    Export user's session data
// @access  Private
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;

    const query = { userId: req.user.id };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sessions = await Session.find(query)
      .select('-flags -messages.metadata')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      // Convert to CSV format
      const csv = sessions.map(session => ({
        id: session._id,
        type: session.type,
        date: session.createdAt.toISOString(),
        duration: session.duration,
        mood: session.mood,
        sentiment: session.sentiment,
        topics: session.topics.join('; '),
        summary: session.summary,
        messageCount: session.messages.length
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sessions.csv');
      
      // Simple CSV conversion
      const headers = Object.keys(csv[0] || {});
      const csvContent = [
        headers.join(','),
        ...csv.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');
      
      res.send(csvContent);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=sessions.json');
      res.json({
        exportDate: new Date().toISOString(),
        totalSessions: sessions.length,
        sessions
      });
    }
  } catch (error) {
    console.error('Export sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export sessions',
    });
  }
});

module.exports = router;