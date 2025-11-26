// Gemini AI Client
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/config');

// Get API key from environment
const apiKey = process.env.GEMINI_API_KEY || '';

// Debug: Show API key status (masked for security)
if (process.env.NODE_ENV === 'development') {
  if (apiKey) {
    const maskedKey = apiKey.length > 10 
      ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
      : '***too short***';
    console.log('✅ GEMINI_API_KEY found:', maskedKey, `(length: ${apiKey.length})`);
  } else {
    console.warn('⚠️  GEMINI_API_KEY not found in environment variables.');
    console.warn('   AI features will not work. Add GEMINI_API_KEY to your .env file.');
    console.warn('   Get your free API key from: https://makersuite.google.com/app/apikey');
  }
}

// Validate API key format
if (apiKey && apiKey.length < 20) {
  console.error('❌ GEMINI_API_KEY appears to be invalid (too short).');
  console.error('   Gemini API keys are typically 39+ characters long.');
  console.error('   Please check your .env file and ensure the key is correct.');
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(apiKey);

// Cache model instance for faster access (singleton pattern)
let cachedModel = null;
let cachedModelName = null;

// Get the generative model (cached for performance)
const getModel = (modelName = null) => {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please add it to your .env file.');
  }
  
  // Validate API key format (basic check)
  if (apiKey.length < 20) {
    console.warn('⚠️  GEMINI_API_KEY appears to be invalid (too short).');
  }
  
  // Determine which model to use
  const preferredModel = process.env.GEMINI_MODEL;
  const targetModel = modelName || preferredModel || 'gemini-pro-latest';
  
  // Return cached model if it's the same model
  if (cachedModel && cachedModelName === targetModel) {
    return cachedModel;
  }
  
  // Try to get the model (fast path - no fallback loop)
  try {
    cachedModel = genAI.getGenerativeModel({ model: targetModel });
    cachedModelName = targetModel;
    return cachedModel;
  } catch (error) {
    // Fallback: try default model if specified model fails
    if (targetModel !== 'gemini-pro-latest') {
      try {
        cachedModel = genAI.getGenerativeModel({ model: 'gemini-pro-latest' });
        cachedModelName = 'gemini-pro-latest';
        return cachedModel;
      } catch (fallbackError) {
        console.error('Model initialization failed:', fallbackError.message);
        throw new Error(`Failed to initialize AI model: ${fallbackError.message}`);
      }
    }
    throw new Error(`Failed to initialize AI model: ${error.message}`);
  }
};

// Check if AI is available
const isAIAvailable = () => {
  return !!apiKey && apiKey.length > 0;
};

// Helper function to add timeout to API calls
const withTimeout = (promise, timeoutMs = 15000) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`AI request timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
};

module.exports = {
  genAI,
  getModel,
  isAIAvailable,
  withTimeout,
  apiKey: apiKey ? '***configured***' : 'not configured'
};

