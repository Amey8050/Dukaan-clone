const express = require('express');
const router = express.Router();
const homepageController = require('../controllers/homepageController');
const { optionalAuth } = require('../middleware/auth');

// Homepage routes
// GET /api/homepage/store/:storeId - Get personalized homepage data (optional auth)
router.get('/store/:storeId', optionalAuth, homepageController.getPersonalizedHomepage);

module.exports = router;

