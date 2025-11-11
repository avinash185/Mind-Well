const mongoose = require('mongoose');

const questionResponseSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: mongoose.Schema.Types.Mixed, // Can be string, number, or array
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
});

const assessmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['stress', 'anxiety', 'depression', 'sleep', 'general-wellbeing'],
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed'],
    default: 'in_progress',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  responses: [questionResponseSchema],
  totalScore: {
    type: Number,
    required: true,
  },
  maxScore: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    default: 0,
  },
  severity: {
    type: String,
    enum: ['low', 'mild', 'moderate', 'high', 'severe'],
    default: 'low',
  },
  recommendations: [{
    type: String,
  }],
  completedAt: {
    type: Date,
    default: Date.now,
  },
  duration: {
    type: Number, // in seconds
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
assessmentSchema.index({ userId: 1, createdAt: -1 });
assessmentSchema.index({ type: 1 });
assessmentSchema.index({ severity: 1 });

// Calculate severity based on percentage
assessmentSchema.methods.calculateSeverity = function() {
  const percentage = this.percentage;
  
  if (percentage <= 20) {
    this.severity = 'low';
  } else if (percentage <= 40) {
    this.severity = 'mild';
  } else if (percentage <= 60) {
    this.severity = 'moderate';
  } else if (percentage <= 80) {
    this.severity = 'high';
  } else {
    this.severity = 'severe';
  }
  
  return this.severity;
};

// Generate recommendations based on assessment type and severity
assessmentSchema.methods.generateRecommendations = function() {
  const recommendations = [];
  
  switch (this.type) {
    case 'stress':
      if (this.severity === 'high' || this.severity === 'severe') {
        recommendations.push('Consider speaking with a mental health professional');
        recommendations.push('Practice deep breathing exercises daily');
        recommendations.push('Try progressive muscle relaxation techniques');
      } else if (this.severity === 'moderate') {
        recommendations.push('Incorporate regular exercise into your routine');
        recommendations.push('Practice mindfulness meditation');
        recommendations.push('Ensure adequate sleep (7-9 hours per night)');
      } else {
        recommendations.push('Maintain current stress management practices');
        recommendations.push('Continue regular self-care activities');
      }
      break;
      
    case 'anxiety':
      if (this.severity === 'high' || this.severity === 'severe') {
        recommendations.push('Seek professional help from a therapist or counselor');
        recommendations.push('Consider cognitive behavioral therapy (CBT)');
        recommendations.push('Practice grounding techniques (5-4-3-2-1 method)');
      } else if (this.severity === 'moderate') {
        recommendations.push('Try anxiety management apps or guided meditations');
        recommendations.push('Limit caffeine intake');
        recommendations.push('Practice regular breathing exercises');
      } else {
        recommendations.push('Continue current coping strategies');
        recommendations.push('Maintain social connections');
      }
      break;
      
    case 'sleep':
      if (this.severity === 'high' || this.severity === 'severe') {
        recommendations.push('Consult with a sleep specialist');
        recommendations.push('Establish a consistent bedtime routine');
        recommendations.push('Avoid screens 1 hour before bedtime');
      } else if (this.severity === 'moderate') {
        recommendations.push('Create a comfortable sleep environment');
        recommendations.push('Limit caffeine after 2 PM');
        recommendations.push('Try relaxation techniques before bed');
      } else {
        recommendations.push('Maintain current sleep hygiene practices');
        recommendations.push('Continue regular sleep schedule');
      }
      break;
      
    case 'depression':
      if (this.severity === 'high' || this.severity === 'severe') {
        recommendations.push('🚨 Seek immediate professional help from a mental health provider');
        recommendations.push('💊 Consider discussing medication options with a psychiatrist');
        recommendations.push('🗣️ Contact a crisis helpline if you have thoughts of self-harm');
        recommendations.push('👥 Reach out to trusted friends or family members for support');
        recommendations.push('🏥 Consider intensive outpatient or inpatient treatment if needed');
      } else if (this.severity === 'moderate') {
        recommendations.push('🩺 Schedule an appointment with a therapist or counselor');
        recommendations.push('🧠 Consider cognitive behavioral therapy (CBT) or interpersonal therapy');
        recommendations.push('🏃‍♂️ Engage in regular physical exercise (30 minutes, 3-5 times per week)');
        recommendations.push('☀️ Spend time outdoors and get natural sunlight daily');
        recommendations.push('😴 Maintain a consistent sleep schedule (7-9 hours per night)');
        recommendations.push('🥗 Focus on nutritious meals and avoid excessive alcohol');
      } else if (this.severity === 'mild') {
        recommendations.push('📝 Keep a mood journal to track patterns and triggers');
        recommendations.push('🧘‍♀️ Practice mindfulness meditation or deep breathing exercises');
        recommendations.push('👫 Stay connected with supportive friends and family');
        recommendations.push('🎯 Set small, achievable daily goals');
        recommendations.push('🎨 Engage in enjoyable activities or hobbies');
        recommendations.push('📚 Consider self-help books or mental health apps');
      } else {
        recommendations.push('✅ Continue current positive mental health practices');
        recommendations.push('🔄 Maintain regular self-care routines');
        recommendations.push('📊 Monitor your mood regularly');
        recommendations.push('🤝 Keep strong social connections');
      }
      break;
      
    case 'general-wellbeing':
      if (this.severity === 'high' || this.severity === 'severe') {
        recommendations.push('Consider comprehensive mental health evaluation');
        recommendations.push('Focus on building resilience and coping skills');
        recommendations.push('Prioritize work-life balance');
      } else if (this.severity === 'moderate') {
        recommendations.push('Explore stress management techniques');
        recommendations.push('Consider lifestyle changes for better wellbeing');
        recommendations.push('Build stronger social support networks');
      } else {
        recommendations.push('Maintain current positive lifestyle habits');
        recommendations.push('Continue personal growth activities');
      }
      break;
      
    default:
      recommendations.push('Continue monitoring your mental health');
      recommendations.push('Practice self-care regularly');
      recommendations.push('Reach out for support when needed');
  }
  
  this.recommendations = recommendations;
  return recommendations;
};

// Pre-save middleware to calculate percentage and severity
assessmentSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('totalScore') || this.isModified('maxScore')) {
    this.percentage = Math.round((this.totalScore / this.maxScore) * 100);
    this.calculateSeverity();
    this.generateRecommendations();
  }
  next();
});

module.exports = mongoose.model('Assessment', assessmentSchema);