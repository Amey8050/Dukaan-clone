const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { optionalAuth, authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const { isAIAvailable } = require('../utils/geminiClient');

// Apply rate limiting to all AI routes
router.use(aiLimiter);

// GET /api/ai/test - Test AI API key (public)
router.get('/test', async (req, res) => {
  if (!isAIAvailable()) {
    return res.status(503).json({
      success: false,
      error: {
        message: 'AI features are not available',
        details: 'GEMINI_API_KEY is not configured. Add it to your .env file.',
        help: 'Get your free API key from: https://makersuite.google.com/app/apikey'
      }
    });
  }
  
  // Try to make a simple API call to verify the key works
  try {
    const { getModel } = require('../utils/geminiClient');
    const model = getModel();
    
    // Make a simple test call
    const result = await model.generateContent('Say "Hello, AI is working!" in one sentence.');
    const response = await result.response;
    const text = response.text();
    
    res.json({
      success: true,
      message: 'AI API key is configured and working!',
      testResponse: text,
      features: [
        'Product description generation',
        'SEO keywords generation',
        'Pricing suggestions',
        'Product recommendations',
        'Promotional suggestions',
        'Sales predictions'
      ]
    });
  } catch (error) {
    console.error('AI Test Error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'AI API key is configured but test failed',
        details: error.message,
        code: error.code,
        suggestion: 'Check if your API key is valid and has not exceeded rate limits.'
      }
    });
  }
});

// AI routes
// POST /api/ai/generate-description - Generate product description (optional auth)
router.post('/generate-description', optionalAuth, aiController.generateDescription);

// POST /api/ai/generate-seo - Generate SEO keywords (optional auth)
router.post('/generate-seo', optionalAuth, aiController.generateSEO);

// POST /api/ai/pricing-suggestions - Get pricing suggestions (optional auth)
router.post('/pricing-suggestions', optionalAuth, aiController.generatePricingSuggestions);

// POST /api/ai/recommendations - Get product recommendations (optional auth)
router.post('/recommendations', optionalAuth, aiController.generateRecommendations);

// POST /api/ai/cleanup-image - Clean up product image (optional auth)
router.post('/cleanup-image', optionalAuth, aiController.cleanupImage);

// POST /api/ai/analyze-analytics - Analyze analytics data with AI (requires auth)
router.post('/analyze-analytics', authenticate, aiController.analyzeAnalytics);

module.exports = router;

