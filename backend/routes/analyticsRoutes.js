const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Analytics routes
// GET /api/analytics/store/:storeId/sales - Get sales analytics (protected)
router.get('/store/:storeId/sales', authenticate, analyticsController.getSalesAnalytics);

// GET /api/analytics/store/:storeId/products - Get product sales analytics (protected)
router.get('/store/:storeId/products', authenticate, analyticsController.getProductSalesAnalytics);

// GET /api/analytics/store/:storeId/revenue-trends - Get revenue trends (protected)
router.get('/store/:storeId/revenue-trends', authenticate, analyticsController.getRevenueTrends);

// GET /api/analytics/store/:storeId/summary - Get sales summary (protected)
router.get('/store/:storeId/summary', authenticate, analyticsController.getSalesSummary);

// GET /api/analytics/store/:storeId/traffic - Get traffic analytics (protected)
router.get('/store/:storeId/traffic', authenticate, analyticsController.getTrafficAnalytics);

// GET /api/analytics/store/:storeId/product-views - Get product view analytics (protected)
router.get('/store/:storeId/product-views', authenticate, analyticsController.getProductViewAnalytics);

// POST /api/analytics/track - Track analytics event (public, optional auth)
router.post('/track', optionalAuth, analyticsController.trackEvent);

module.exports = router;
