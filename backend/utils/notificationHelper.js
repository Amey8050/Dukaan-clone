// Notification Helper - Utility functions for creating notifications
const { supabaseAdmin } = require('./supabaseClient');

/**
 * Create a notification for a user
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.user_id - User ID
 * @param {string} notificationData.type - Notification type (order, inventory, promotion, system)
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.message - Notification message
 * @param {string} [notificationData.store_id] - Store ID (optional)
 * @param {string} [notificationData.link] - Link to navigate to (optional)
 * @returns {Promise<Object>} Created notification
 */
const createNotification = async (notificationData) => {
  try {
    const { user_id, type, title, message, store_id, link } = notificationData;

    if (!user_id || !type || !title || !message) {
      throw new Error('Missing required notification fields');
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id,
        store_id: store_id || null,
        type,
        title,
        message,
        link: link || null,
        is_read: false
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Create Notification Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create order notification for store owner
 * @param {string} storeOwnerId - Store owner user ID
 * @param {string} storeId - Store ID
 * @param {string} orderId - Order ID
 * @param {number} totalAmount - Order total amount
 * @returns {Promise<Object>} Created notification
 */
const createOrderNotification = async (storeOwnerId, storeId, orderId, totalAmount) => {
  return createNotification({
    user_id: storeOwnerId,
    store_id: storeId,
    type: 'order',
    title: 'New Order Received',
    message: `You have received a new order for $${parseFloat(totalAmount).toFixed(2)}`,
    link: `/stores/${storeId}/orders/${orderId}`
  });
};

/**
 * Create inventory notification for store owner
 * @param {string} storeOwnerId - Store owner user ID
 * @param {string} storeId - Store ID
 * @param {string} productName - Product name
 * @param {number} currentStock - Current stock level
 * @returns {Promise<Object>} Created notification
 */
const createLowStockNotification = async (storeOwnerId, storeId, productName, currentStock) => {
  return createNotification({
    user_id: storeOwnerId,
    store_id: storeId,
    type: 'inventory',
    title: 'Low Stock Alert',
    message: `${productName} is running low. Current stock: ${currentStock}`,
    link: `/stores/${storeId}/inventory`
  });
};

/**
 * Create promotion notification
 * @param {string} userId - User ID
 * @param {string} storeId - Store ID
 * @param {string} title - Promotion title
 * @param {string} message - Promotion message
 * @param {string} [link] - Link to promotion
 * @returns {Promise<Object>} Created notification
 */
const createPromotionNotification = async (userId, storeId, title, message, link) => {
  return createNotification({
    user_id: userId,
    store_id: storeId,
    type: 'promotion',
    title,
    message,
    link
  });
};

/**
 * Create system notification
 * @param {string} userId - User ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} [link] - Link to navigate to
 * @returns {Promise<Object>} Created notification
 */
const createSystemNotification = async (userId, title, message, link) => {
  return createNotification({
    user_id: userId,
    type: 'system',
    title,
    message,
    link
  });
};

module.exports = {
  createNotification,
  createOrderNotification,
  createLowStockNotification,
  createPromotionNotification,
  createSystemNotification
};

