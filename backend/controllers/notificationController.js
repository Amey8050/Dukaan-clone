// Notification Controller
const { supabaseAdmin } = require('../utils/supabaseClient');

const notificationController = {
  // Get user notifications
  getNotifications: async (req, res, next) => {
    try {
      const userId = req.userId;
      const { limit = 50, offset = 0, unread_only = false } = req.query;

      let query = supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (unread_only === 'true') {
        query = query.eq('is_read', false);
      }

      const { data: notifications, error } = await query;

      if (error) {
        throw error;
      }

      // Get unread count
      const { count: unreadCount } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      res.json({
        success: true,
        data: {
          notifications: notifications || [],
          unread_count: unreadCount || 0,
          total: notifications?.length || 0
        }
      });
    } catch (error) {
      console.error('Get Notifications Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch notifications',
          details: error.message
        }
      });
    }
  },

  // Mark notification as read
  markAsRead: async (req, res, next) => {
    try {
      const userId = req.userId;
      const { notificationId } = req.params;

      // Verify notification belongs to user
      const { data: notification, error: fetchError } = await supabaseAdmin
        .from('notifications')
        .select('id, user_id')
        .eq('id', notificationId)
        .single();

      if (fetchError || !notification) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Notification not found'
          }
        });
      }

      if (notification.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied'
          }
        });
      }

      // Mark as read
      const { data: updated, error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        message: 'Notification marked as read',
        data: {
          notification: updated
        }
      });
    } catch (error) {
      console.error('Mark as Read Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to mark notification as read',
          details: error.message
        }
      });
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (req, res, next) => {
    try {
      const userId = req.userId;

      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Mark All as Read Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to mark all notifications as read',
          details: error.message
        }
      });
    }
  },

  // Delete notification
  deleteNotification: async (req, res, next) => {
    try {
      const userId = req.userId;
      const { notificationId } = req.params;

      // Verify notification belongs to user
      const { data: notification, error: fetchError } = await supabaseAdmin
        .from('notifications')
        .select('id, user_id')
        .eq('id', notificationId)
        .single();

      if (fetchError || !notification) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Notification not found'
          }
        });
      }

      if (notification.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied'
          }
        });
      }

      const { error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        message: 'Notification deleted'
      });
    } catch (error) {
      console.error('Delete Notification Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete notification',
          details: error.message
        }
      });
    }
  }
};

module.exports = notificationController;

