const express = require('express');
const { body, validationResult } = require('express-validator');
const Resource = require('../models/Resource');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/resources
// @desc    Get resources with filtering and search
// @access  Public (with optional auth for personalization)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      type,
      search,
      emergency,
      free,
      condition,
      audience,
      sort = 'rating'
    } = req.query;

    // Build query
    const query = { isActive: true };
    
    if (category) query.category = category;
    if (type) query.type = type;
    if (emergency === 'true') query.isEmergency = true;
    if (free === 'true') query.isFree = true;
    if (condition) query.conditions = { $in: [condition] };
    if (audience) query.targetAudience = { $in: [audience] };

    let resources;
    
    if (search) {
      // Text search
      resources = await Resource.searchResources(search, query)
        .limit(limit * 1)
        .skip((page - 1) * limit);
    } else {
      // Regular query with sorting
      const sortOptions = {
        rating: { rating: -1, views: -1 },
        views: { views: -1 },
        newest: { createdAt: -1 },
        alphabetical: { title: 1 }
      };

      resources = await Resource.find(query)
        .sort(sortOptions[sort] || sortOptions.rating)
        .limit(limit * 1)
        .skip((page - 1) * limit);
    }

    const total = await Resource.countDocuments(query);

    // Get categories for filtering
    const categories = await Resource.distinct('category', { isActive: true });
    const types = await Resource.distinct('type', { isActive: true });
    const conditions = await Resource.distinct('conditions', { isActive: true });

    res.json({
      success: true,
      data: {
        resources,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
        filters: {
          categories,
          types,
          conditions,
        },
      },
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get resources',
    });
  }
});

// @route   GET /api/resources/emergency
// @desc    Get emergency resources
// @access  Public
router.get('/emergency', async (req, res) => {
  try {
    const emergencyResources = await Resource.findEmergencyResources();

    res.json({
      success: true,
      data: { resources: emergencyResources },
    });
  } catch (error) {
    console.error('Get emergency resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency resources',
    });
  }
});

// @route   GET /api/resources/categories
// @desc    Get resource categories with counts
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Resource.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories',
    });
  }
});

// @route   GET /api/resources/:id
// @desc    Get specific resource by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findById(id);
    if (!resource || !resource.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    // Increment view count
    await resource.incrementViews();

    // Get related resources
    const relatedResources = await Resource.find({
      _id: { $ne: id },
      $or: [
        { category: resource.category },
        { conditions: { $in: resource.conditions } },
        { tags: { $in: resource.tags } },
      ],
      isActive: true,
    })
      .sort({ rating: -1 })
      .limit(4);

    res.json({
      success: true,
      data: {
        resource,
        relatedResources,
      },
    });
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get resource',
    });
  }
});

// @route   GET /api/resources/category/:category
// @desc    Get resources by category
// @access  Public
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 10 } = req.query;

    const resources = await Resource.findByCategory(category, parseInt(limit));

    res.json({
      success: true,
      data: { resources },
    });
  } catch (error) {
    console.error('Get resources by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get resources by category',
    });
  }
});

// @route   POST /api/resources
// @desc    Create a new resource (admin only - for seeding)
// @access  Private
router.post('/', [
  authenticateToken,
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),
  body('category')
    .isIn([
      'articles', 'videos', 'podcasts', 'helplines', 'crisis-support',
      'self-help', 'therapy', 'meditation', 'exercise', 'nutrition',
      'sleep', 'stress-management', 'anxiety-support', 'depression-support',
      'general-wellness'
    ])
    .withMessage('Invalid category'),
  body('type')
    .isIn(['article', 'video', 'podcast', 'helpline', 'app', 'website', 'book', 'tool'])
    .withMessage('Invalid type'),
  body('link')
    .isURL()
    .withMessage('Valid URL is required'),
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

    const resourceData = req.body;
    const resource = new Resource(resourceData);
    await resource.save();

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: { resource },
    });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create resource',
    });
  }
});

// @route   PUT /api/resources/:id
// @desc    Update a resource (admin only)
// @access  Private
router.put('/:id', [
  authenticateToken,
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),
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
    const updateData = req.body;

    const resource = await Resource.findByIdAndUpdate(
      id,
      { ...updateData, lastVerified: new Date() },
      { new: true, runValidators: true }
    );

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    res.json({
      success: true,
      message: 'Resource updated successfully',
      data: { resource },
    });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update resource',
    });
  }
});

// @route   DELETE /api/resources/:id
// @desc    Delete a resource (admin only)
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    res.json({
      success: true,
      message: 'Resource deleted successfully',
    });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resource',
    });
  }
});

module.exports = router;