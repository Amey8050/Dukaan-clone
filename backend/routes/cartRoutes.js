const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { optionalAuth } = require('../middleware/auth');

// Cart routes
// GET /api/cart?storeId=xxx - Get user's cart (optional auth for guest users)
router.get('/', optionalAuth, cartController.getCart);

// POST /api/cart - Add item to cart (optional auth for guest users)
router.post('/', optionalAuth, cartController.addToCart);

// PUT /api/cart/:itemId - Update cart item quantity (optional auth)
router.put('/:itemId', optionalAuth, cartController.updateCartItem);

// DELETE /api/cart/:itemId - Remove item from cart (optional auth)
router.delete('/:itemId', optionalAuth, cartController.removeFromCart);

// DELETE /api/cart?storeId=xxx - Clear cart (optional auth)
router.delete('/', optionalAuth, cartController.clearCart);

module.exports = router;

