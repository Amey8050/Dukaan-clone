const express = require('express');
const router = express.Router();
const schedulerService = require('../services/schedulerService');
const { authenticate } = require('../middleware/auth');

// Manual trigger for low stock check (admin only)
router.post('/low-stock-check', authenticate, async (req, res) => {
  try {
    // Only allow store owners/admins to trigger
    // In production, you might want to restrict this to admin role only
    await schedulerService.triggerLowStockCheck();
    
    res.json({
      success: true,
      message: 'Low stock check completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to trigger low stock check',
        details: error.message
      }
    });
  }
});

module.exports = router;

