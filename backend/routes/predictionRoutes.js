const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');
const { authenticate } = require('../middleware/auth');

// Prediction routes
// GET /api/predictions/store/:storeId/sales - Get sales predictions for a store (protected)
router.get('/store/:storeId/sales', authenticate, predictionController.getSalesPrediction);

// GET /api/predictions/store/:storeId/product/:productId - Get product sales predictions (protected)
router.get('/store/:storeId/product/:productId', authenticate, predictionController.getProductSalesPrediction);

module.exports = router;

