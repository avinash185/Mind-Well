const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant', 'system'],
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    audioUrl: String, // For voice messages
    duration: Number, // Audio duration in seconds
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
    },
    confidence: Number, // AI confidence score
    topics: [String], // Extracted topics/themes
  },
});

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['chat', 'counseling', 'assessment-discussion'],
  },
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  messages: [messageSchema],
  summary: {
    type: String,
    maxlength: [1000, 'Summary cannot exceed 1000 characters'],
  },
  mood: {
    before: {
      type: String,
      enum: ['very-low', 'low', 'neutral', 'good', 'very-good'],
    },
    after: {
      type: String,
      enum: ['very-low', 'low', 'neutral', 'good', 'very-good'],
    },
  },
  topics: [{
    type: String,
    trim: true,
  }],
  sentiment: {
    overall: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
    },
    score: {
      type: Number,
      min: -1,
      max: 1,
    },
  },
  duration: {
    type: Number, // in minutes
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  endedAt: {
    type: Date,
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: [500, 'Feedback comment cannot exceed 500 characters'],
    },
    helpful: Boolean,
  },
  flags: {
    containsCrisisLanguage: {
      type: Boolean,
      default: false,
    },
    requiresFollowUp: {
      type: Boolean,
      default: false,
    },
    escalationNeeded: {
      type: Boolean,
      default: false,
    },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ type: 1 });
sessionSchema.index({ isActive: 1 });
sessionSchema.index({ 'flags.containsCrisisLanguage': 1 });
sessionSchema.index({ 'flags.requiresFollowUp': 1 });

// Virtual for message count
sessionSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Method to add a message
sessionSchema.methods.addMessage = function(role, content, metadata = {}) {
  this.messages.push({
    role,
    content,
    metadata,
  });
  return this;
};

// Method to end session
sessionSchema.methods.endSession = function(summary = '') {
  this.isActive = false;
  this.endedAt = new Date();
  if (summary) {
    this.summary = summary;
  }
  
  // Calculate duration
  if (this.createdAt) {
    this.duration = Math.round((this.endedAt - this.createdAt) / (1000 * 60)); // in minutes
  }
  
  return this.save();
};

// Method to analyze sentiment
sessionSchema.methods.analyzeSentiment = function() {
  if (this.messages.length === 0) return;
  
  const userMessages = this.messages.filter(msg => msg.role === 'user');
  if (userMessages.length === 0) return;
  
  // Simple sentiment analysis based on keywords
  const positiveWords = ['happy', 'good', 'better', 'great', 'wonderful', 'amazing', 'love', 'joy', 'excited', 'grateful'];
  const negativeWords = ['sad', 'bad', 'worse', 'terrible', 'awful', 'hate', 'angry', 'depressed', 'anxious', 'worried'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  userMessages.forEach(message => {
    const content = message.content.toLowerCase();
    positiveWords.forEach(word => {
      if (content.includes(word)) positiveCount++;
    });
    negativeWords.forEach(word => {
      if (content.includes(word)) negativeCount++;
    });
  });
  
  if (positiveCount > negativeCount) {
    this.sentiment.overall = 'positive';
    this.sentiment.score = Math.min(positiveCount / userMessages.length, 1);
  } else if (negativeCount > positiveCount) {
    this.sentiment.overall = 'negative';
    this.sentiment.score = Math.max(-negativeCount / userMessages.length, -1);
  } else {
    this.sentiment.overall = 'neutral';
    this.sentiment.score = 0;
  }
};

// Method to check for crisis language
sessionSchema.methods.checkForCrisisLanguage = function() {
  const crisisKeywords = [
    'suicide', 'kill myself', 'end it all', 'not worth living', 'want to die',
    'hurt myself', 'self harm', 'cutting', 'overdose', 'jump off',
    'no point', 'give up', 'can\'t go on', 'better off dead'
  ];
  
  const userMessages = this.messages.filter(msg => msg.role === 'user');
  
  for (const message of userMessages) {
    const content = message.content.toLowerCase();
    for (const keyword of crisisKeywords) {
      if (content.includes(keyword)) {
        this.flags.containsCrisisLanguage = true;
        this.flags.escalationNeeded = true;
        return true;
      }
    }
  }
  
  return false;
};

// Pre-save middleware
sessionSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.analyzeSentiment();
    this.checkForCrisisLanguage();
  }
  next();
});

// Static method to find sessions requiring follow-up
sessionSchema.statics.findRequiringFollowUp = function() {
  return this.find({
    $or: [
      { 'flags.requiresFollowUp': true },
      { 'flags.containsCrisisLanguage': true },
      { 'sentiment.overall': 'negative', 'sentiment.score': { $lt: -0.5 } }
    ],
    isActive: false,
  }).populate('userId', 'name email');
};

module.exports = mongoose.model('Session', sessionSchema);