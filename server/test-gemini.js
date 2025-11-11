require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiAPI() {
  try {
    console.log('Testing Gemini API connection...');
    console.log('API Key (first 10 chars):', process.env.GEMINI_API_KEY?.substring(0, 10) || 'Not found');
    
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
      console.log('❌ Gemini API key not configured properly');
      console.log('Please set GEMINI_API_KEY in your .env file');
      return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelName = process.env.GEMINI_MODEL || 'gemini-pro';
    let model = genAI.getGenerativeModel({ model: modelName });

    const prompt = "Hello! Please respond with a brief, friendly greeting to test the API connection.";
    
    console.log('Sending test prompt to Gemini...');
    let text;
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      text = response.text();
    } catch (error) {
      const isModelNotFound = (error && (error.status === 404 || /not found/i.test(error.message || '')));
      if (isModelNotFound && modelName !== 'gemini-pro') {
        console.warn(`Model "${modelName}" unavailable. Falling back to gemini-pro for test.`);
        const fallback = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await fallback.generateContent(prompt);
        const response = await result.response;
        text = response.text();
      } else {
        throw error;
      }
    }
    
    console.log('✅ Gemini API test successful!');
    console.log('Response:', text);
    
  } catch (error) {
    console.log('❌ Gemini API test failed:');
    console.log('Error type:', error.constructor.name);
    console.log('Error message:', error.message);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('💡 Tip: Check if your Gemini API key is valid and has the correct permissions');
    }
  }
}

testGeminiAPI();