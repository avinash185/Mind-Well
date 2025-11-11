const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'articles',
      'videos',
      'podcasts',
      'helplines',
      'crisis-support',
      'self-help',
      'therapy',
      'meditation',
      'exercise',
      'nutrition',
      'sleep',
      'stress-management',
      'anxiety-support',
      'depression-support',
      'general-wellness'
    ],
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['article', 'video', 'podcast', 'helpline', 'app', 'website', 'book', 'tool'],
  },
  link: {
    type: String,
    required: [true, 'Link is required'],
    trim: true,
  },
  coverImage: {
    type: String,
    trim: true,
    default: null,
  },
  author: {
    type: String,
    trim: true,
  },
  organization: {
    type: String,
    trim: true,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  duration: {
    type: String, // e.g., "5 minutes", "30 minutes", "1 hour"
    trim: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5,
  },
  isEmergency: {
    type: Boolean,
    default: false,
  },
  isFree: {
    type: Boolean,
    default: true,
  },
  language: {
    type: String,
    default: 'English',
  },
  targetAudience: [{
    type: String,
    enum: ['teens', 'adults', 'seniors', 'parents', 'caregivers', 'professionals'],
  }],
  conditions: [{
    type: String,
    enum: ['anxiety', 'depression', 'stress', 'ptsd', 'bipolar', 'eating-disorders', 'addiction', 'grief', 'general'],
  }],
  contact: {
    phone: String,
    email: String,
    hours: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  lastVerified: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
resourceSchema.index({ category: 1, isActive: 1 });
resourceSchema.index({ type: 1 });
resourceSchema.index({ tags: 1 });
resourceSchema.index({ conditions: 1 });
resourceSchema.index({ isEmergency: 1 });
resourceSchema.index({ rating: -1 });
resourceSchema.index({ views: -1 });

// Text search index
resourceSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  author: 'text',
  organization: 'text',
});

// Method to increment views
resourceSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Static method to find emergency resources
resourceSchema.statics.findEmergencyResources = function() {
  return this.find({ isEmergency: true, isActive: true })
    .sort({ rating: -1, views: -1 });
};

// Static method to find resources by category
resourceSchema.statics.findByCategory = function(category, limit = 10) {
  return this.find({ category, isActive: true })
    .sort({ rating: -1, views: -1 })
    .limit(limit);
};

// Static method to search resources
resourceSchema.statics.searchResources = function(query, filters = {}) {
  const searchQuery = {
    $text: { $search: query },
    isActive: true,
    ...filters,
  };
  
  return this.find(searchQuery, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, rating: -1 });
};

module.exports = mongoose.model('Resource', resourceSchema);