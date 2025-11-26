import api from './api';

const pricingService = {
  // Get pricing recommendations for a product
  getProductPricingRecommendations: async (productId) => {
    const response = await api.post(`/api/pricing/product/${productId}/recommendations`);
    return response.data;
  },

  // Get bulk pricing recommendations
  getBulkPricingRecommendations: async (storeId) => {
    const response = await api.post(`/api/pricing/store/${storeId}/bulk`);
    return response.data;
  },

  // Get pricing strategy analysis
  getPricingStrategy: async (storeId) => {
    const response = await api.get(`/api/pricing/store/${storeId}/strategy`);
    return response.data;
  }
};

export default pricingService;

