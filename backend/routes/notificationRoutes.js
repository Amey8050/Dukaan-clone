const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

// Notification routes
// GET /api/notifications - Get user notifications (protected)
router.get('/', authenticate, notificationController.getNotifications);

// PUT /api/notifications/:notificationId/read - Mark notification as read (protected)
router.put('/:notificationId/read', authenticate, notificationController.markAsRead);

// PUT /api/notifications/read-all - Mark all notifications as read (protected)
router.put('/read-all', authenticate, notificationController.markAllAsRead);

// DELETE /api/notifications/:notificationId - Delete notification (protected)
router.delete('/:notificationId', authenticate, notificationController.deleteNotification);

module.exports = router;

