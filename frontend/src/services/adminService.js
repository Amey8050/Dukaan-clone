import api from './api';

const adminService = {
  // Get platform overview
  getOverview: async () => {
    const response = await api.get('/api/admin/overview');
    return response.data;
  },

  // Get all users
  getUsers: async (page = 1, limit = 20, search = '') => {
    const response = await api.get('/api/admin/users', {
      params: { page, limit, search }
    });
    return response.data;
  },

  // Update user role
  updateUserRole: async (userId, role) => {
    const response = await api.put(`/api/admin/users/${userId}/role`, { role });
    return response.data;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await api.delete(`/api/admin/users/${userId}`);
    return response.data;
  },

  // Get all stores
  getStores: async (page = 1, limit = 20, search = '') => {
    const response = await api.get('/api/admin/stores', {
      params: { page, limit, search }
    });
    return response.data;
  },

  // Toggle store status
  toggleStoreStatus: async (storeId, is_active) => {
    const response = await api.put(`/api/admin/stores/${storeId}/status`, { is_active });
    return response.data;
  },

  // Delete store
  deleteStore: async (storeId) => {
    const response = await api.delete(`/api/admin/stores/${storeId}`);
    return response.data;
  },

  // Get all orders
  getOrders: async (page = 1, limit = 20, status = 'all') => {
    const response = await api.get('/api/admin/orders', {
      params: { page, limit, status }
    });
    return response.data;
  },

  // Get all products
  getProducts: async (page = 1, limit = 20, search = '') => {
    const response = await api.get('/api/admin/products', {
      params: { page, limit, search }
    });
    return response.data;
  }
};

export default adminService;

