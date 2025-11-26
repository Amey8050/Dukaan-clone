const express = require('express');
const router = express.Router();
const promoController = require('../controllers/promoController');
const { authenticate } = require('../middleware/auth');

// Promo routes
// GET /api/promo/store/:storeId/suggestions - Get promotional suggestions for a store (protected)
router.get('/store/:storeId/suggestions', authenticate, promoController.getPromoSuggestions);

// GET /api/promo/product/:productId/suggestions - Get product-specific promo suggestions (protected)
router.get('/product/:productId/suggestions', authenticate, promoController.getProductPromoSuggestions);

module.exports = router;

