import api from './api';

const bulkUploadService = {
  // Download Excel template
  downloadTemplate: async () => {
    const response = await api.get('/api/bulk-upload/template', {
      responseType: 'blob'
    });
    
    // Create blob URL and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'product-upload-template.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Upload products from Excel
  uploadProducts: async (file, storeId, useAI = false, generateDescription = false, onProgress = null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('storeId', storeId);
    // Convert boolean to string explicitly for FormData (FormData converts booleans to strings)
    formData.append('use_ai', String(useAI));
    formData.append('generate_description', String(generateDescription));

    const response = await api.post('/api/bulk-upload/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (onProgress) {
            onProgress(percentCompleted);
          }
        }
      }
    });

    return response.data;
  }
};

export default bulkUploadService;

