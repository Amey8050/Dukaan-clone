import api from './api';

const recommendationService = {
  // Get personalized recommendations for user
  getUserRecommendations: async (storeId) => {
    const response = await api.get(`/api/recommendations/store/${storeId}/user`);
    return response.data;
  },

  // Get product-based recommendations
  getProductRecommendations: async (storeId, productId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(
      `/api/recommendations/store/${storeId}/product/${productId}${queryParams ? `?${queryParams}` : ''}`
    );
    return response.data;
  },

  // Get popular/trending products
  getPopularProducts: async (storeId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(
      `/api/recommendations/store/${storeId}/popular${queryParams ? `?${queryParams}` : ''}`
    );
    return response.data;
  },

  // Get AI-powered personalized recommendations
  getAIPersonalizedRecommendations: async (storeId) => {
    const response = await api.get(`/api/recommendations/store/${storeId}/ai-personalized`);
    return response.data;
  }
};

export default recommendationService;

