import api from './api';

// Generate or get session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

const analyticsService = {
  // Track analytics event
  trackEvent: async (storeId, eventType, options = {}) => {
    try {
      const { productId, metadata } = options;
      
      await api.post('/api/analytics/track', {
        store_id: storeId,
        event_type: eventType,
        product_id: productId || null,
        session_id: getSessionId(),
        metadata: metadata || {}
      });
    } catch (error) {
      // Silently fail - don't interrupt user experience
      console.warn('Analytics tracking failed:', error);
    }
  },

  // Track page view
  trackPageView: async (storeId, pagePath) => {
    return analyticsService.trackEvent(storeId, 'page_view', {
      metadata: { page_path: pagePath }
    });
  },

  // Track product view
  trackProductView: async (storeId, productId) => {
    return analyticsService.trackEvent(storeId, 'product_view', {
      productId: productId
    });
  },

  // Track add to cart
  trackAddToCart: async (storeId, productId, quantity = 1) => {
    return analyticsService.trackEvent(storeId, 'add_to_cart', {
      productId: productId,
      metadata: { quantity: quantity }
    });
  },

  // Track purchase
  trackPurchase: async (storeId, orderId, total) => {
    return analyticsService.trackEvent(storeId, 'purchase', {
      metadata: { order_id: orderId, total: total }
    });
  },

  // Track search
  trackSearch: async (storeId, searchQuery) => {
    return analyticsService.trackEvent(storeId, 'search', {
      metadata: { query: searchQuery }
    });
  },

  // Get sales analytics
  getSalesAnalytics: async (storeId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(
      `/api/analytics/store/${storeId}/sales${queryParams ? `?${queryParams}` : ''}`
    );
    return response.data;
  },

  // Get traffic analytics
  getTrafficAnalytics: async (storeId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(
      `/api/analytics/store/${storeId}/traffic${queryParams ? `?${queryParams}` : ''}`
    );
    return response.data;
  },

  // Get product view analytics
  getProductViewAnalytics: async (storeId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(
      `/api/analytics/store/${storeId}/product-views${queryParams ? `?${queryParams}` : ''}`
    );
    return response.data;
  },

  // Get sales summary
  getSalesSummary: async (storeId, period = 30) => {
    const response = await api.get(`/api/analytics/store/${storeId}/summary?period=${period}`);
    return response.data;
  }
};

export default analyticsService;

