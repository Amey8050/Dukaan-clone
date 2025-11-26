const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');

// GET /api/settings/store/:storeId - Get store settings
router.get('/store/:storeId', authenticate, settingsController.getSettings);

// PUT /api/settings/store/:storeId - Update store settings
router.put('/store/:storeId', authenticate, settingsController.updateSettings);

module.exports = router;

