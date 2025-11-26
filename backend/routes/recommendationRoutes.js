const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { optionalAuth } = require('../middleware/auth');

// Recommendation routes
// GET /api/recommendations/store/:storeId/user - Get personalized recommendations for user (optional auth)
router.get('/store/:storeId/user', optionalAuth, recommendationController.getUserRecommendations);

// GET /api/recommendations/store/:storeId/product/:productId - Get product-based recommendations (public)
router.get('/store/:storeId/product/:productId', recommendationController.getProductRecommendations);

// GET /api/recommendations/store/:storeId/popular - Get popular/trending products (public)
router.get('/store/:storeId/popular', recommendationController.getPopularProducts);

// GET /api/recommendations/store/:storeId/ai-personalized - Get AI-powered personalized recommendations (optional auth)
router.get('/store/:storeId/ai-personalized', optionalAuth, recommendationController.getAIPersonalizedRecommendations);

module.exports = router;

