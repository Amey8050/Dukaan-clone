const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');

// Inventory routes
// GET /api/inventory/product/:productId/history - Get inventory history for a product (protected)
router.get('/product/:productId/history', authenticate, inventoryController.getInventoryHistory);

// POST /api/inventory/product/:productId/adjust - Adjust inventory manually (protected)
router.post('/product/:productId/adjust', authenticate, inventoryController.adjustInventory);

// GET /api/inventory/store/:storeId/low-stock - Get low stock products (protected)
router.get('/store/:storeId/low-stock', authenticate, inventoryController.getLowStockProducts);

// GET /api/inventory/store/:storeId/summary - Get inventory summary (protected)
router.get('/store/:storeId/summary', authenticate, inventoryController.getInventorySummary);

module.exports = router;

