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

/**
 * Check if product is low stock and create notification if needed
 * Automatically checks inventory and creates notification when stock goes low
 * @param {string} productId - Product ID
 * @param {number} currentQuantity - Current inventory quantity
 * @param {number} lowStockThreshold - Low stock threshold
 * @returns {Promise<Object>} Result of notification creation
 */
const checkAndNotifyLowStock = async (productId, currentQuantity, lowStockThreshold) => {
  try {
    // Check if stock is low
    if (currentQuantity > lowStockThreshold) {
      return { success: false, message: 'Stock is not low', shouldNotify: false };
    }

    // Get product details to find store owner
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select(`
        id,
        name,
        store_id,
        stores!inner (
          id,
          owner_id
        )
      `)
      .eq('id', productId)
      .single();

    if (productError || !product || !product.stores) {
      console.error('Failed to fetch product for low stock notification:', productError);
      return { success: false, error: productError?.message || 'Product not found' };
    }

    const storeOwnerId = product.stores.owner_id;
    const storeId = product.stores.id;

    // Check if notification already exists for this product (avoid duplicates)
    const { data: existingNotifications } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', storeOwnerId)
      .eq('store_id', storeId)
      .eq('type', 'inventory')
      .eq('is_read', false)
      .like('message', `%${product.name}%`)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Within last 24 hours
      .limit(1);

    // Only create notification if one doesn't already exist recently
    if (existingNotifications && existingNotifications.length > 0) {
      return { success: true, message: 'Notification already exists', shouldNotify: false };
    }

    // Create low stock notification
    const result = await createLowStockNotification(
      storeOwnerId,
      storeId,
      product.name,
      currentQuantity
    );

    return { ...result, shouldNotify: true };
  } catch (error) {
    console.error('Check and notify low stock error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  createNotification,
  createOrderNotification,
  createLowStockNotification,
  createPromotionNotification,
  createSystemNotification,
  checkAndNotifyLowStock
};

