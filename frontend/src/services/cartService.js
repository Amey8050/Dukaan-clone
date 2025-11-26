import api from './api';

// Generate or get session ID for guest users
const getSessionId = () => {
  let sessionId = localStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
};

const cartService = {
  // Get cart
  getCart: async (storeId) => {
    const sessionId = getSessionId();
    const response = await api.get(`/api/cart?storeId=${storeId}`, {
      headers: {
        'X-Session-ID': sessionId,
      },
    });
    return response.data;
  },

  // Add to cart
  addToCart: async (cartData) => {
    const sessionId = getSessionId();
    const response = await api.post('/api/cart', cartData, {
      headers: {
        'X-Session-ID': sessionId,
      },
    });
    return response.data;
  },

  // Update cart item
  updateCartItem: async (itemId, quantity) => {
    const sessionId = getSessionId();
    const response = await api.put(
      `/api/cart/${itemId}`,
      { quantity },
      {
        headers: {
          'X-Session-ID': sessionId,
        },
      }
    );
    return response.data;
  },

  // Remove from cart
  removeFromCart: async (itemId) => {
    const sessionId = getSessionId();
    const response = await api.delete(`/api/cart/${itemId}`, {
      headers: {
        'X-Session-ID': sessionId,
      },
    });
    return response.data;
  },

  // Clear cart
  clearCart: async (storeId) => {
    const sessionId = getSessionId();
    const response = await api.delete(`/api/cart?storeId=${storeId}`, {
      headers: {
        'X-Session-ID': sessionId,
      },
    });
    return response.data;
  },
};

export default cartService;

