import api from './api';

const orderService = {
  // Create order (checkout)
  createOrder: async (orderData) => {
    const sessionId = localStorage.getItem('cart_session_id');
    const response = await api.post('/api/orders', orderData, {
      headers: {
        'X-Session-ID': sessionId,
      },
    });
    return response.data;
  },

  // Get order by ID
  getOrder: async (id) => {
    const sessionId = localStorage.getItem('cart_session_id');
    const response = await api.get(`/api/orders/${id}`, {
      headers: {
        'X-Session-ID': sessionId,
      },
    });
    return response.data;
  },

  // Get user's orders
  getMyOrders: async () => {
    const response = await api.get('/api/orders/my');
    return response.data;
  },

  // Get store orders
  getStoreOrders: async (storeId) => {
    const response = await api.get(`/api/orders/store/${storeId}`);
    return response.data;
  },

  // Update order status
  updateOrderStatus: async (orderId, status, paymentStatus) => {
    const response = await api.put(`/api/orders/${orderId}/status`, {
      status,
      payment_status: paymentStatus,
    });
    return response.data;
  },
};

export default orderService;

