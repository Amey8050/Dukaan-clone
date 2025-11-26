import api from './api';

const settingsService = {
  // Get store settings
  getSettings: async (storeId) => {
    const response = await api.get(`/api/settings/store/${storeId}`);
    return response.data;
  },

  // Update store settings
  updateSettings: async (storeId, category, settings) => {
    const response = await api.put(`/api/settings/store/${storeId}`, {
      category,
      settings
    });
    return response.data;
  }
};

export default settingsService;

