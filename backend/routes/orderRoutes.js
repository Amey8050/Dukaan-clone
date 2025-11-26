const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { optionalAuth, authenticate } = require('../middleware/auth');

// Order routes
// POST /api/orders - Create order (checkout) - optional auth for guest checkout
router.post('/', optionalAuth, orderController.createOrder);

// GET /api/orders/my - Get current user's orders (protected)
router.get('/my', authenticate, orderController.getUserOrders);

// GET /api/orders/store/:storeId - Get store orders (protected, store owner only)
router.get('/store/:storeId', authenticate, orderController.getStoreOrders);

// GET /api/orders/:id - Get order by ID (optional auth)
router.get('/:id', optionalAuth, orderController.getOrder);

// PUT /api/orders/:id/status - Update order status (protected, store owner only)
router.put('/:id/status', authenticate, orderController.updateOrderStatus);

module.exports = router;

