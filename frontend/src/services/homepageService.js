import api from './api';

const homepageService = {
  // Get personalized homepage data
  getHomepageData: async (storeId) => {
    const response = await api.get(`/api/homepage/store/${storeId}`);
    return response.data;
  },
};

export default homepageService;

