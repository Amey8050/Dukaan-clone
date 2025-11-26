import api from './api';

const predictionService = {
  // Get sales predictions for a store
  getSalesPredictions: async (storeId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(
      `/api/predictions/store/${storeId}/sales${queryParams ? `?${queryParams}` : ''}`
    );
    return response.data;
  },

  // Get product sales predictions
  getProductPredictions: async (storeId, productId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(
      `/api/predictions/store/${storeId}/product/${productId}${queryParams ? `?${queryParams}` : ''}`
    );
    return response.data;
  }
};

export default predictionService;

