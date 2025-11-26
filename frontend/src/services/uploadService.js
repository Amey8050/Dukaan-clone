import api from './api';

const uploadService = {
  // Upload single file
  uploadFile: async (file, options = {}) => {
    const { bucket = 'product-images', folder = '' } = options;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Upload multiple files
  uploadMultipleFiles: async (files, options = {}) => {
    const { bucket = 'product-images', folder = '' } = options;
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('bucket', bucket);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await api.post('/api/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Delete file
  deleteFile: async (bucket, path) => {
    const response = await api.delete('/api/upload', {
      data: { bucket, path }
    });
    return response.data;
  }
};

export default uploadService;

