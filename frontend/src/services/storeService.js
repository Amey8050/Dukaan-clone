import api from './api';

const storeService = {
  // Create store
  createStore: async (storeData) => {
    const response = await api.post('/api/stores', storeData);
    return response.data;
  },

  // Get user's stores
  getMyStores: async () => {
    const response = await api.get('/api/stores/my');
    return response.data;
  },

  // Get store by ID
  getStore: async (id) => {
    const response = await api.get(`/api/stores/${id}`);
    return response.data;
  },

  // Update store
  updateStore: async (id, storeData) => {
    const response = await api.put(`/api/stores/${id}`, storeData);
    return response.data;
  },

  // Delete store
  deleteStore: async (id) => {
    const response = await api.delete(`/api/stores/${id}`);
    return response.data;
  },
};

export default storeService;

