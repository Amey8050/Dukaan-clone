const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateRegister, validateLogin } = require('../middleware/inputValidation');

// Auth routes
// POST /api/auth/register - Register new user
router.post('/register', authLimiter, validateRegister, authController.register);

// POST /api/auth/login - Login user
router.post('/login', authLimiter, validateLogin, authController.login);

// POST /api/auth/logout - Logout user
router.post('/logout', authenticate, authController.logout);

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', authController.refreshToken);

// GET /api/auth/me - Get current user (protected)
router.get('/me', authenticate, authController.getCurrentUser);

// PUT /api/auth/profile - Update user profile (protected)
router.put('/profile', authenticate, authController.updateProfile);

module.exports = router;

