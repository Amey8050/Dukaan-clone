const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController');
const { authenticate } = require('../middleware/auth');

// Pricing routes
// POST /api/pricing/product/:productId/recommendations - Get pricing recommendations for a product (protected)
router.post('/product/:productId/recommendations', authenticate, pricingController.getPricingRecommendations);

// POST /api/pricing/store/:storeId/bulk - Get bulk pricing recommendations (protected)
router.post('/store/:storeId/bulk', authenticate, pricingController.getBulkPricingRecommendations);

// GET /api/pricing/store/:storeId/strategy - Analyze pricing strategy for a store (protected)
router.get('/store/:storeId/strategy', authenticate, pricingController.analyzePricingStrategy);

module.exports = router;

