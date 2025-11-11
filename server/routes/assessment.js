const express = require('express');
const { body, validationResult } = require('express-validator');
const Assessment = require('../models/Assessment');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Assessment question templates
const assessmentTemplates = {
  stress: {
    title: 'Perceived Stress Scale',
    description: 'This assessment measures your perceived stress levels over the past month.',
    questions: [
      {
        id: 'stress_1',
        question: 'In the last month, how often have you been upset because of something that happened unexpectedly?',
        type: 'scale',
        options: [
          { value: 0, label: 'Never' },
          { value: 1, label: 'Almost Never' },
          { value: 2, label: 'Sometimes' },
          { value: 3, label: 'Fairly Often' },
          { value: 4, label: 'Very Often' }
        ]
      },
      {
        id: 'stress_2',
        question: 'In the last month, how often have you felt that you were unable to control the important things in your life?',
        type: 'scale',
        options: [
          { value: 0, label: 'Never' },
          { value: 1, label: 'Almost Never' },
          { value: 2, label: 'Sometimes' },
          { value: 3, label: 'Fairly Often' },
          { value: 4, label: 'Very Often' }
        ]
      },
      {
        id: 'stress_3',
        question: 'In the last month, how often have you felt nervous and stressed?',
        type: 'scale',
        options: [
          { value: 0, label: 'Never' },
          { value: 1, label: 'Almost Never' },
          { value: 2, label: 'Sometimes' },
          { value: 3, label: 'Fairly Often' },
          { value: 4, label: 'Very Often' }
        ]
      },
      {
        id: 'stress_4',
        question: 'In the last month, how often have you felt confident about your ability to handle your personal problems?',
        type: 'scale',
        reverse: true,
        options: [
          { value: 4, label: 'Never' },
          { value: 3, label: 'Almost Never' },
          { value: 2, label: 'Sometimes' },
          { value: 1, label: 'Fairly Often' },
          { value: 0, label: 'Very Often' }
        ]
      },
      {
        id: 'stress_5',
        question: 'In the last month, how often have you felt that things were going your way?',
        type: 'scale',
        reverse: true,
        options: [
          { value: 4, label: 'Never' },
          { value: 3, label: 'Almost Never' },
          { value: 2, label: 'Sometimes' },
          { value: 1, label: 'Fairly Often' },
          { value: 0, label: 'Very Often' }
        ]
      },
      {
        id: 'stress_6',
        question: 'In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?',
        type: 'scale',
        options: [
          { value: 0, label: 'Never' },
          { value: 1, label: 'Almost Never' },
          { value: 2, label: 'Sometimes' },
          { value: 3, label: 'Fairly Often' },
          { value: 4, label: 'Very Often' }
        ]
      },
      {
        id: 'stress_7',
        question: 'In the last month, how often have you been able to control irritations in your life?',
        type: 'scale',
        reverse: true,
        options: [
          { value: 4, label: 'Never' },
          { value: 3, label: 'Almost Never' },
          { value: 2, label: 'Sometimes' },
          { value: 1, label: 'Fairly Often' },
          { value: 0, label: 'Very Often' }
        ]
      },
      {
        id: 'stress_8',
        question: 'In the last month, how often have you felt that you were on top of things?',
        type: 'scale',
        reverse: true,
        options: [
          { value: 4, label: 'Never' },
          { value: 3, label: 'Almost Never' },
          { value: 2, label: 'Sometimes' },
          { value: 1, label: 'Fairly Often' },
          { value: 0, label: 'Very Often' }
        ]
      },
      {
        id: 'stress_9',
        question: 'In the last month, how often have you been angered because of things that were outside of your control?',
        type: 'scale',
        options: [
          { value: 0, label: 'Never' },
          { value: 1, label: 'Almost Never' },
          { value: 2, label: 'Sometimes' },
          { value: 3, label: 'Fairly Often' },
          { value: 4, label: 'Very Often' }
        ]
      }
    ]
  },
  anxiety: {
    title: 'Generalized Anxiety Disorder 9-item (GAD-9)',
    description: 'This assessment screens for generalized anxiety disorder.',
    questions: [
      {
        id: 'anxiety_1',
        question: 'Feeling nervous, anxious, or on edge',
        type: 'scale',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      },
      {
        id: 'anxiety_2',
        question: 'Not being able to stop or control worrying',
        type: 'scale',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      },
      {
        id: 'anxiety_3',
        question: 'Worrying too much about different things',
        type: 'scale',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      },
      {
        id: 'anxiety_4',
        question: 'Trouble relaxing',
        type: 'scale',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      },
      {
        id: 'anxiety_5',
        question: 'Being so restless that it is hard to sit still',
        type: 'scale',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      },
      {
        id: 'anxiety_6',
        question: 'Becoming easily annoyed or irritable',
        type: 'scale',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      },
      {
        id: 'anxiety_7',
        question: 'Feeling afraid, as if something awful might happen',
        type: 'scale',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      },
      {
        id: 'anxiety_8',
        question: 'Having trouble concentrating on things, such as reading or watching TV',
        type: 'scale',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      },
      {
        id: 'anxiety_9',
        question: 'Feeling muscle tension, aches, or soreness',
        type: 'scale',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      }
    ]
  },
  depression: {
    title: 'Patient Health Questionnaire-9 (PHQ-9)',
    description: 'This assessment screens for depression symptoms over the past two weeks.',
    questions: [
      {
        id: 'depression_1',
        question: 'Little interest or pleasure in doing things',
        type: 'scale',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      },
      {
        id: 'depression_2',
        question: 'Feeling down, depressed, or hopeless',
        type: 'scale',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      },
      {
        id: 'depression_3',
        question: 'Trouble falling or staying asleep, or sleeping too much',
        type: 'scale',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      },
      {
        id: 'depression_4',
        question: 'Feeling tired or having little energy',
        type: 'scale',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      },
      {
        id: 'depression_5',
        question: 'Poor appetite or overeating',
        type: 'scale',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      },
      {
        id: 'depression_6',
        question: 'Feeling bad about yourself or that you are a failure or have let yourself or your family down',
        type: 'scale',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      },
      {
        id: 'depression_7',
        question: 'Trouble concentrating on things, such as reading the newspaper or watching television',
        type: 'scale',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      },
      {
        id: 'depression_8',
        question: 'Moving or speaking so slowly that other people could have noticed, or being so fidgety or restless that you have been moving around a lot more than usual',
        type: 'scale',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      },
      {
        id: 'depression_9',
        question: 'Thoughts that you would be better off dead, or thoughts of hurting yourself in some way',
        type: 'scale',
        options: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' }
        ]
      }
    ]
  },
  sleep: {
    title: 'Sleep Quality Assessment',
    description: 'This assessment evaluates your sleep quality and patterns.',
    questions: [
      {
        id: 'sleep_1',
        question: 'During the past month, how would you rate your sleep quality overall?',
        type: 'scale',
        options: [
          { value: 0, label: 'Very good' },
          { value: 1, label: 'Fairly good' },
          { value: 2, label: 'Fairly bad' },
          { value: 3, label: 'Very bad' }
        ]
      },
      {
        id: 'sleep_2',
        question: 'During the past month, how often have you had trouble sleeping because you cannot get to sleep within 30 minutes?',
        type: 'scale',
        options: [
          { value: 0, label: 'Not during the past month' },
          { value: 1, label: 'Less than once a week' },
          { value: 2, label: 'Once or twice a week' },
          { value: 3, label: 'Three or more times a week' }
        ]
      },
      {
        id: 'sleep_3',
        question: 'During the past month, how often have you had trouble sleeping because you wake up in the middle of the night or early morning?',
        type: 'scale',
        options: [
          { value: 0, label: 'Not during the past month' },
          { value: 1, label: 'Less than once a week' },
          { value: 2, label: 'Once or twice a week' },
          { value: 3, label: 'Three or more times a week' }
        ]
      },
      {
        id: 'sleep_4',
        question: 'During the past month, how often have you taken medicine to help you sleep?',
        type: 'scale',
        options: [
          { value: 0, label: 'Not during the past month' },
          { value: 1, label: 'Less than once a week' },
          { value: 2, label: 'Once or twice a week' },
          { value: 3, label: 'Three or more times a week' }
        ]
      },
      {
        id: 'sleep_5',
        question: 'During the past month, how often have you had trouble staying awake while driving, eating meals, or engaging in social activity?',
        type: 'scale',
        options: [
          { value: 0, label: 'Not during the past month' },
          { value: 1, label: 'Less than once a week' },
          { value: 2, label: 'Once or twice a week' },
          { value: 3, label: 'Three or more times a week' }
        ]
      },
      {
        id: 'sleep_6',
        question: 'During the past month, how often have you felt refreshed after waking up?',
        type: 'scale',
        reverse: true,
        options: [
          { value: 3, label: 'Never' },
          { value: 2, label: 'Less than once a week' },
          { value: 1, label: 'Once or twice a week' },
          { value: 0, label: 'Three or more times a week' }
        ]
      },
      {
        id: 'sleep_7',
        question: 'During the past month, how often have you had trouble sleeping because of bad dreams or nightmares?',
        type: 'scale',
        options: [
          { value: 0, label: 'Not during the past month' },
          { value: 1, label: 'Less than once a week' },
          { value: 2, label: 'Once or twice a week' },
          { value: 3, label: 'Three or more times a week' }
        ]
      },
      {
        id: 'sleep_8',
        question: 'During the past month, how often have you felt that your sleep was restless?',
        type: 'scale',
        options: [
          { value: 0, label: 'Not during the past month' },
          { value: 1, label: 'Less than once a week' },
          { value: 2, label: 'Once or twice a week' },
          { value: 3, label: 'Three or more times a week' }
        ]
      },
      {
        id: 'sleep_9',
        question: 'During the past month, how often have you felt satisfied with your sleep duration?',
        type: 'scale',
        reverse: true,
        options: [
          { value: 3, label: 'Never' },
          { value: 2, label: 'Less than once a week' },
          { value: 1, label: 'Once or twice a week' },
          { value: 0, label: 'Three or more times a week' }
        ]
      }
    ]
  },
  'general-wellbeing': {
    title: 'Overall Wellbeing Assessment',
    description: 'This comprehensive assessment evaluates your overall mental wellness and life satisfaction.',
    questions: [
      {
        id: 'wellbeing_1',
        question: 'How satisfied are you with your life as a whole these days?',
        type: 'scale',
        options: [
          { value: 0, label: 'Extremely dissatisfied' },
          { value: 1, label: 'Dissatisfied' },
          { value: 2, label: 'Neither satisfied nor dissatisfied' },
          { value: 3, label: 'Satisfied' },
          { value: 4, label: 'Extremely satisfied' }
        ]
      },
      {
        id: 'wellbeing_2',
        question: 'How often do you feel that you have a sense of direction in your life?',
        type: 'scale',
        options: [
          { value: 0, label: 'Never' },
          { value: 1, label: 'Rarely' },
          { value: 2, label: 'Sometimes' },
          { value: 3, label: 'Often' },
          { value: 4, label: 'Always' }
        ]
      },
      {
        id: 'wellbeing_3',
        question: 'How often do you feel that your relationships with others are supportive and rewarding?',
        type: 'scale',
        options: [
          { value: 0, label: 'Never' },
          { value: 1, label: 'Rarely' },
          { value: 2, label: 'Sometimes' },
          { value: 3, label: 'Often' },
          { value: 4, label: 'Always' }
        ]
      },
      {
        id: 'wellbeing_4',
        question: 'How often do you feel that you are making progress toward accomplishing your goals?',
        type: 'scale',
        options: [
          { value: 0, label: 'Never' },
          { value: 1, label: 'Rarely' },
          { value: 2, label: 'Sometimes' },
          { value: 3, label: 'Often' },
          { value: 4, label: 'Always' }
        ]
      },
      {
        id: 'wellbeing_5',
        question: 'How often do you feel that you can handle the responsibilities of your daily life?',
        type: 'scale',
        options: [
          { value: 0, label: 'Never' },
          { value: 1, label: 'Rarely' },
          { value: 2, label: 'Sometimes' },
          { value: 3, label: 'Often' },
          { value: 4, label: 'Always' }
        ]
      },
      {
        id: 'wellbeing_6',
        question: 'How often do you feel that you have opportunities to learn and grow as a person?',
        type: 'scale',
        options: [
          { value: 0, label: 'Never' },
          { value: 1, label: 'Rarely' },
          { value: 2, label: 'Sometimes' },
          { value: 3, label: 'Often' },
          { value: 4, label: 'Always' }
        ]
      },
      {
        id: 'wellbeing_7',
        question: 'How often do you feel confident in your ability to think and express your ideas?',
        type: 'scale',
        options: [
          { value: 0, label: 'Never' },
          { value: 1, label: 'Rarely' },
          { value: 2, label: 'Sometimes' },
          { value: 3, label: 'Often' },
          { value: 4, label: 'Always' }
        ]
      },
      {
        id: 'wellbeing_8',
        question: 'How often do you feel that you have a good balance between work/responsibilities and personal time?',
        type: 'scale',
        options: [
          { value: 0, label: 'Never' },
          { value: 1, label: 'Rarely' },
          { value: 2, label: 'Sometimes' },
          { value: 3, label: 'Often' },
          { value: 4, label: 'Always' }
        ]
      },
      {
        id: 'wellbeing_9',
        question: 'How often do you feel optimistic about your future?',
        type: 'scale',
        options: [
          { value: 0, label: 'Never' },
          { value: 1, label: 'Rarely' },
          { value: 2, label: 'Sometimes' },
          { value: 3, label: 'Often' },
          { value: 4, label: 'Always' }
        ]
      }
    ]
  }
};

// All routes require authentication
router.use(authenticateToken);

// @route   GET /api/assessments/types
// @desc    Get available assessment types
// @access  Private
router.get('/types', (req, res) => {
  try {
    const types = Object.keys(assessmentTemplates).map(key => ({
      type: key,
      title: assessmentTemplates[key].title,
      description: assessmentTemplates[key].description,
      questionCount: assessmentTemplates[key].questions.length,
    }));

    res.json({
      success: true,
      data: { types },
    });
  } catch (error) {
    console.error('Get assessment types error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assessment types',
    });
  }
});

// @route   GET /api/assessments/:type/questions
// @desc    Get questions for a specific assessment type
// @access  Private
router.get('/:type/questions', (req, res) => {
  try {
    const { type } = req.params;
    
    if (!assessmentTemplates[type]) {
      return res.status(404).json({
        success: false,
        message: 'Assessment type not found',
      });
    }

    const template = assessmentTemplates[type];
    
    res.json({
      success: true,
      data: {
        type,
        title: template.title,
        description: template.description,
        questions: template.questions,
      },
    });
  } catch (error) {
    console.error('Get assessment questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assessment questions',
    });
  }
});

// @route   POST /api/assessments/:type/submit
// @desc    Submit assessment responses
// @access  Private
router.post('/:type/submit', [
  body('responses')
    .isArray({ min: 1 })
    .withMessage('Responses array is required'),
  body('responses.*.questionId')
    .notEmpty()
    .withMessage('Question ID is required'),
  body('responses.*.answer')
    .notEmpty()
    .withMessage('Answer is required'),
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
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

    const { type } = req.params;
    const { responses, duration } = req.body;
    const userId = req.user._id;

    if (!assessmentTemplates[type]) {
      return res.status(404).json({
        success: false,
        message: 'Assessment type not found',
      });
    }

    const template = assessmentTemplates[type];
    
    // Validate responses against template
    const templateQuestions = template.questions.reduce((acc, q) => {
      acc[q.id] = q;
      return acc;
    }, {});

    let totalScore = 0;
    const processedResponses = [];

    for (const response of responses) {
      const question = templateQuestions[response.questionId];
      if (!question) {
        return res.status(400).json({
          success: false,
          message: `Invalid question ID: ${response.questionId}`,
        });
      }

      // Find the score for the selected answer
      const selectedOption = question.options.find(opt => 
        opt.label === response.answer || opt.value === response.answer
      );

      if (!selectedOption) {
        return res.status(400).json({
          success: false,
          message: `Invalid answer for question ${response.questionId}`,
        });
      }

      const score = selectedOption.value;
      totalScore += score;

      processedResponses.push({
        questionId: response.questionId,
        question: question.question,
        answer: response.answer,
        score,
      });
    }

    // Calculate max possible score
    const maxScore = template.questions.reduce((sum, q) => {
      const maxOptionScore = Math.max(...q.options.map(opt => opt.value));
      return sum + maxOptionScore;
    }, 0);

    // Create assessment
    const assessment = new Assessment({
      userId,
      type,
      title: template.title,
      description: template.description,
      responses: processedResponses,
      totalScore,
      maxScore,
      duration,
      status: 'completed',
    });

    await assessment.save();

    // Add assessment to user's assessments array
    await User.findByIdAndUpdate(userId, {
      $push: { assessments: assessment._id },
    });

    res.status(201).json({
      success: true,
      message: 'Assessment submitted successfully',
      data: { assessment },
    });
  } catch (error) {
    console.error('Submit assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit assessment',
    });
  }
});

// @route   GET /api/assessments/:id
// @desc    Get specific assessment by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const assessment = await Assessment.findOne({ _id: id, userId });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found',
      });
    }

    res.json({
      success: true,
      data: { assessment },
    });
  } catch (error) {
    console.error('Get assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assessment',
    });
  }
});

// @route   GET /api/assessments
// @desc    Get user's assessments with filtering and pagination
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, severity } = req.query;
    const userId = req.user._id;

    const query = { userId };
    if (type) query.type = type;
    if (severity) query.severity = severity;

    const assessments = await Assessment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Assessment.countDocuments(query);

    // Get summary statistics
    const stats = await Assessment.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          averageScore: { $avg: '$percentage' },
          latestScore: { $last: '$percentage' },
          latestDate: { $last: '$createdAt' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        assessments,
        stats,
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

// @route   DELETE /api/assessments/:id
// @desc    Delete an assessment
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const assessment = await Assessment.findOneAndDelete({ _id: id, userId });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found',
      });
    }

    // Remove from user's assessments array
    await User.findByIdAndUpdate(userId, {
      $pull: { assessments: id },
    });

    res.json({
      success: true,
      message: 'Assessment deleted successfully',
    });
  } catch (error) {
    console.error('Delete assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete assessment',
    });
  }
});

module.exports = router;