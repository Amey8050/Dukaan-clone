import api from './api';

const promoService = {
  // Get promotional suggestions for a store
  getPromoSuggestions: async (storeId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(
      `/api/promo/store/${storeId}/suggestions${queryParams ? `?${queryParams}` : ''}`
    );
    return response.data;
  },

  // Get product-specific promo suggestions
  getProductPromoSuggestions: async (productId) => {
    const response = await api.get(`/api/promo/product/${productId}/suggestions`);
    return response.data;
  }
};

export default promoService;

