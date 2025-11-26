import api from './api';

const aiService = {
  // Generate product description
  generateDescription: async (data) => {
    const response = await api.post('/api/ai/generate-description', data);
    return response.data;
  },

  // Generate SEO keywords and meta tags
  generateSEO: async (data) => {
    const response = await api.post('/api/ai/generate-seo', data);
    return response.data;
  },

  // Get pricing suggestions
  getPricingSuggestions: async (data) => {
    const response = await api.post('/api/ai/pricing-suggestions', data);
    return response.data;
  },

  // Get product recommendations
  getRecommendations: async (data) => {
    const response = await api.post('/api/ai/recommendations', data);
    return response.data;
  },

  // Clean up/analyze image using AI
  cleanupImage: async (imageUrl, action = 'analyze') => {
    const response = await api.post('/api/ai/cleanup-image', { 
      image_url: imageUrl,
      action: action
    });
    return response.data;
  },
};

export default aiService;

