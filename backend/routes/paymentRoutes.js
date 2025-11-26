const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { optionalAuth } = require('../middleware/auth');

// Payment routes
// POST /api/payments/create-order - Create Razorpay payment order (optional auth)
router.post('/create-order', optionalAuth, paymentController.createPaymentOrder);

// POST /api/payments/verify - Verify payment (optional auth)
router.post('/verify', optionalAuth, paymentController.verifyPayment);

// POST /api/payments/webhook - Razorpay webhook handler (no auth, signature verified)
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;

