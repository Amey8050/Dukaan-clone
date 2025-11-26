import api from './api';

const inventoryService = {
  // Get inventory history for a product
  getInventoryHistory: async (productId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(
      `/api/inventory/product/${productId}/history${queryParams ? `?${queryParams}` : ''}`
    );
    return response.data;
  },

  // Adjust inventory manually
  adjustInventory: async (productId, data) => {
    const response = await api.post(`/api/inventory/product/${productId}/adjust`, data);
    return response.data;
  },

  // Get low stock products for a store
  getLowStockProducts: async (storeId) => {
    const response = await api.get(`/api/inventory/store/${storeId}/low-stock`);
    return response.data;
  },

  // Get inventory summary for a store
  getInventorySummary: async (storeId) => {
    const response = await api.get(`/api/inventory/store/${storeId}/summary`);
    return response.data;
  },
};

export default inventoryService;

