import api from './api';

const productService = {
  // Create product
  createProduct: async (productData) => {
    const response = await api.post('/api/products', productData);
    return response.data;
  },

  // Get products by store
  getProductsByStore: async (storeId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(`/api/products/store/${storeId}${queryParams ? `?${queryParams}` : ''}`);
    return response.data;
  },

  // Get product by ID
  getProduct: async (id) => {
    const response = await api.get(`/api/products/${id}`);
    return response.data;
  },

  // Update product
  updateProduct: async (id, productData) => {
    const response = await api.put(`/api/products/${id}`, productData);
    return response.data;
  },

  // Delete product
  deleteProduct: async (id) => {
    const response = await api.delete(`/api/products/${id}`);
    return response.data;
  },
};

export default productService;

