const express = require('express');
const { body, validationResult } = require('express-validator');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Session = require('../models/Session');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Initialize AI providers
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Use configurable Gemini model with a widely supported default
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-pro';
let geminiModel = genAI.getGenerativeModel({ model: GEMINI_MODEL });

// AI Provider configuration
const AI_PROVIDER = process.env.AI_PROVIDER || 'gemini';
console.log(`[AI Config] Provider: ${AI_PROVIDER}, Gemini model: ${GEMINI_MODEL}`);

// System prompts for different chat types
const systemPrompts = {
  chat: `You are a compassionate and supportive AI assistant specializing in mental health and well-being. Your role is to:

1. Provide emotional support and active listening
2. Offer evidence-based coping strategies and techniques
3. Share general mental health information and resources
4. Encourage healthy habits and self-care practices
5. Help users identify patterns in their thoughts and feelings

Important guidelines:
- You are NOT a licensed therapist and cannot provide medical advice or diagnoses
- Always encourage users to seek professional help for serious mental health concerns
- Be empathetic, non-judgmental, and supportive
- If a user expresses suicidal thoughts or self-harm, immediately encourage them to contact emergency services or a crisis hotline
- Keep responses conversational, warm, and accessible
- Avoid clinical jargon unless explaining it in simple terms
- Focus on strengths and resilience while acknowledging struggles

Remember: Your goal is to provide support and guidance while maintaining appropriate boundaries.`,

  counseling: `You are an AI counseling assistant trained to provide therapeutic support using evidence-based approaches. Your role includes:

1. Active listening and empathetic responding
2. Helping users explore their thoughts, feelings, and behaviors
3. Teaching coping skills and stress management techniques
4. Guiding users through problem-solving processes
5. Providing psychoeducation about mental health topics
6. Using techniques from CBT, mindfulness, and other therapeutic modalities

Therapeutic guidelines:
- Maintain a warm, non-judgmental, and professional demeanor
- Use reflective listening and validation techniques
- Ask open-ended questions to encourage self-exploration
- Help users identify cognitive distortions and unhelpful thought patterns
- Teach grounding techniques and mindfulness exercises
- Encourage self-compassion and realistic goal-setting
- Always emphasize that you're a supportive tool, not a replacement for professional therapy

Crisis protocol:
- If users express suicidal ideation, self-harm, or immediate danger, prioritize safety
- Provide crisis resources and encourage immediate professional help
- Document concerning statements for follow-up

Remember: Create a safe, supportive space for healing and growth.`
};

// Crisis keywords for monitoring
const crisisKeywords = [
  'suicide', 'kill myself', 'end it all', 'not worth living', 'want to die',
  'hurt myself', 'self harm', 'cutting', 'overdose', 'jump off',
  'no point', 'give up', 'can\'t go on', 'better off dead'
];

function generateSupportiveFallback(latestUserText, sessionType) {
  const text = (latestUserText || '').trim().toLowerCase();
  const isGreeting = [/^hi$/, /^hello$/, /^hey$/].some(r => r.test(text));
  const mentionsStress = /(stress|stressed|overwhelmed|anxious|anxiety|worry|worried|depressed|sad)/.test(text);
  const baseIntro = sessionType === 'counseling'
    ? "I'm here with you. Thank you for sharing that — I want to make this space safe and supportive."
    : "I hear you. Thanks for reaching out — I’m here to support you.";
  if (isGreeting) {
    return `${baseIntro} How are you feeling right now? If it's helpful, try describing what's on your mind in a few words.`;
  }
  if (mentionsStress) {
    return `${baseIntro} It sounds like things have felt heavy. Would you like to unpack what's been most challenging lately? We can start small. In the meantime, a quick grounding check-in: name 3 things you see, 2 things you feel, and 1 slow breath.`;
  }
  return `${baseIntro} What would you like to explore today? If you're unsure, we can begin with what's been taking most of your energy or anything that’s felt different recently.`;
}

// Helper function to get AI response
async function getAIResponse(messages, systemPrompt) {
  if (AI_PROVIDER === 'gemini') {
    // Format conversation for Gemini
    let conversationText = systemPrompt + '\n\n';
    
    // Add conversation history (skip system message)
    messages.slice(1).forEach(msg => {
      if (msg.role === 'user') {
        conversationText += `Human: ${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        conversationText += `Assistant: ${msg.content}\n\n`;
      }
    });
    try {
      const result = await geminiModel.generateContent(conversationText);
      const response = await result.response;
      return response.text();
    } catch (error) {
      // If the configured model is unavailable, fall back to a compatible one
      const isModelNotFound =
        (error && (error.status === 404 || /not found/i.test(error.message || '')));
      if (isModelNotFound && GEMINI_MODEL !== 'gemini-pro') {
        console.warn(`[AI Config] Model "${GEMINI_MODEL}" unavailable. Falling back to gemini-pro.`);
        const fallbackModelName = 'gemini-pro';
        const fallbackModel = genAI.getGenerativeModel({ model: fallbackModelName });
        const result = await fallbackModel.generateContent(conversationText);
        const response = await result.response;
        return response.text();
      }
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 1000,
          temperature: 0.7,
        });
        return completion.choices[0].message.content;
      } catch (fallbackErr) {
        const type = systemPrompt === systemPrompts.counseling ? 'counseling' : 'chat';
        const lastUser = [...messages].reverse().find(m => m.role === 'user');
        return generateSupportiveFallback(lastUser ? lastUser.content : '', type);
      }
    }
  } else {
    // Use OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    });
    return completion.choices[0].message.content;
  }
}

// @route   POST /api/chat/simple
// @desc    Simple chat endpoint for testing (as recommended by Gemini)
// @access  Public (for testing purposes)
router.post('/simple', [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('history')
    .optional()
    .isArray()
    .withMessage('History must be an array'),
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

    const { message, history = [] } = req.body;

    try {
      // Construct the conversation in the format OpenAI expects
      const messages = [
        {
          role: 'system',
          content: systemPrompts.chat
        }
      ];
      
      // Add conversation history
      history.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.text
        });
      });
      
      // Add the new message
      messages.push({
        role: 'user',
        content: message
      });

      // Generate response using configured AI provider
      const aiResponse = await getAIResponse(messages, systemPrompts.chat);

      res.json({
        success: true,
        response: aiResponse
      });

    } catch (aiError) {
      console.error("AI API Error:", aiError);
      res.status(500).json({ 
        success: false,
        error: "Failed to get response from AI service." 
      });
    }

  } catch (error) {
    console.error('Simple chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message',
    });
  }
});

// All other routes require authentication
router.use(authenticateToken);

// @route   POST /api/chat/start
// @desc    Start a new chat session
// @access  Private
router.post('/start', [
  body('type')
    .isIn(['chat', 'counseling'])
    .withMessage('Type must be either chat or counseling'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
], async (req, res) => {
  try {
    console.log('🚀 Starting chat session...');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { type, title } = req.body;
    const userId = req.user._id;
    console.log('👤 User ID:', userId);
    console.log('📝 Session type:', type);

    // Create new session
    console.log('🔨 Creating new session...');
    const session = new Session({
      userId,
      type,
      title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} Session`,
    });

    console.log('📨 Adding system message...');
    // Add system message
    session.addMessage('system', systemPrompts[type]);

    console.log('👋 Adding welcome message...');
    // Add welcome message
    const welcomeMessage = type === 'counseling' 
      ? "Hello! I'm here to provide you with a safe, supportive space to talk about whatever is on your mind. This is your time, and we can go at whatever pace feels comfortable for you. What would you like to explore today?"
      : "Hi there! I'm here to listen and support you. Whether you want to talk about your day, work through some feelings, or learn about mental wellness, I'm here for you. What's on your mind?";

    session.addMessage('assistant', welcomeMessage);

    console.log('💾 Saving session to database...');
    await session.save();
    console.log('✅ Session saved successfully with ID:', session._id);

    const responseData = {
      success: true,
      message: 'Chat session started successfully',
      data: { session },
    };
    console.log('📤 Sending response:', responseData);
    res.status(201).json(responseData);
  } catch (error) {
    console.error('❌ Start chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start chat session',
    });
  }
});

// @route   POST /api/chat/:sessionId/message
// @desc    Send a message in a chat session
// @access  Private
router.post('/:sessionId/message', [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
  body('mood')
    .optional()
    .isIn(['very-low', 'low', 'neutral', 'good', 'very-good'])
    .withMessage('Invalid mood value'),
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

    const { sessionId } = req.params;
    const { content, mood } = req.body;
    const userId = req.user._id;

    // Find session
    const session = await Session.findOne({ _id: sessionId, userId, isActive: true });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or inactive',
      });
    }

    // Check for crisis language
    const containsCrisis = crisisKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );

    // Add user message
    session.addMessage('user', content, {
      sentiment: containsCrisis ? 'negative' : undefined,
    });

    // Update mood if provided
    if (mood) {
      if (!session.mood.before) {
        session.mood.before = mood;
      }
      session.mood.after = mood;
    }

    // Prepare conversation history for OpenAI
    const messages = [
      {
        role: 'system',
        content: systemPrompts[session.type]
      }
    ];

    // Add conversation history
    session.messages
      .filter(msg => msg.role !== 'system')
      .forEach(msg => {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        });
      });

    // Add the current user message
    messages.push({
      role: 'user',
      content: content
    });

    try {
      // Generate response using configured AI provider
      const aiResponse = await getAIResponse(messages, systemPrompts[session.type]);

      // Add crisis resources if crisis language detected
      let finalResponse = aiResponse;
      if (containsCrisis) {
        finalResponse += "\n\n🚨 **Important**: If you're having thoughts of self-harm or suicide, please reach out for immediate help:\n" +
          "• National Suicide Prevention Lifeline: 988\n" +
          "• Crisis Text Line: Text HOME to 741741\n" +
          "• Emergency Services: 911\n\n" +
          "You don't have to go through this alone. Professional help is available 24/7.";
        
        session.flags.containsCrisisLanguage = true;
        session.flags.escalationNeeded = true;
      }

      // Add AI response to session
      session.addMessage('assistant', finalResponse, {
        confidence: aiResponse && aiResponse.length > 10 ? 0.9 : 0.7,
      });

      await session.save();

      res.json({
        success: true,
        data: {
          message: {
            role: 'assistant',
            content: finalResponse,
            timestamp: new Date(),
          },
          sessionId: session._id,
          containsCrisis,
        },
      });

    } catch (aiError) {
      console.error('AI API error:', aiError);
      
      const fallbackResponse = generateSupportiveFallback(content, session.type);
      
      session.addMessage('assistant', fallbackResponse, {
        confidence: 0.1,
      });

      await session.save();

      res.json({
        success: true,
        data: {
          message: {
            role: 'assistant',
            content: fallbackResponse,
            timestamp: new Date(),
          },
          sessionId: session._id,
          error: 'AI service temporarily unavailable',
        },
      });
    }

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
    });
  }
});

// @route   GET /api/chat/:sessionId
// @desc    Get chat session details
// @access  Private
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await Session.findOne({ _id: sessionId, userId });
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

// @route   PUT /api/chat/:sessionId/end
// @desc    End a chat session
// @access  Private
router.put('/:sessionId/end', [
  body('summary')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Summary cannot exceed 1000 characters'),
  body('feedback.rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('feedback.comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Feedback comment cannot exceed 500 characters'),
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

    const { sessionId } = req.params;
    const { summary, feedback } = req.body;
    const userId = req.user._id;

    const session = await Session.findOne({ _id: sessionId, userId, isActive: true });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Active session not found',
      });
    }

    // Add feedback if provided
    if (feedback) {
      session.feedback = feedback;
    }

    // End session
    await session.endSession(summary);

    res.json({
      success: true,
      message: 'Session ended successfully',
      data: { session },
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end session',
    });
  }
});

// @route   GET /api/chat/sessions
// @desc    Get user's chat sessions
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, active } = req.query;
    const userId = req.user._id;

    const query = { userId };
    if (type) query.type = type;
    if (active !== undefined) query.isActive = active === 'true';

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

// @route   POST /api/chat/voice/transcribe
// @desc    Transcribe voice message using OpenAI Whisper
// @access  Private
router.post('/voice/transcribe', async (req, res) => {
  try {
    // This would typically handle file upload with multer
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'Voice transcription endpoint - implementation depends on file upload setup',
      data: {
        transcription: 'Voice transcription would be implemented here with OpenAI Whisper API',
      },
    });
  } catch (error) {
    console.error('Voice transcription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to transcribe voice message',
    });
  }
});

// @route   POST /api/chat/voice/synthesize
// @desc    Convert text to speech using OpenAI TTS
// @access  Private
router.post('/voice/synthesize', [
  body('text')
    .trim()
    .isLength({ min: 1, max: 4000 })
    .withMessage('Text must be between 1 and 4000 characters'),
  body('voice')
    .optional()
    .isIn(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'])
    .withMessage('Invalid voice option'),
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

    const { text, voice = 'nova' } = req.body;

    try {
      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice,
        input: text,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length,
      });

      res.send(buffer);

    } catch (ttsError) {
      console.error('TTS error:', ttsError);
      res.status(500).json({
        success: false,
        message: 'Failed to synthesize speech',
      });
    }

  } catch (error) {
    console.error('Voice synthesis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process voice synthesis request',
    });
  }
});

module.exports = router;