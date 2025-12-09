import api from './api';

const authService = {
  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      // Re-throw to let AuthContext handle it
      throw error;
    }
  },

  // Login user
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    
    // Store tokens and user data
    if (response.data && response.data.success && response.data.data && response.data.data.session) {
      const { access_token, refresh_token } = response.data.data.session;
      const user = response.data.data.user;
      
      // Store tokens
      if (access_token) {
        localStorage.setItem('access_token', access_token);
      }
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      console.log('Login successful - Token stored:', !!access_token);
    } else {
      console.error('Login response missing session data:', response.data);
    }
    
    return response.data;
  },

  // Logout user
  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/api/auth/refresh', {
      refresh_token: refreshToken,
    });
    
    if (response.data.data.session) {
      localStorage.setItem('access_token', response.data.data.session.access_token);
      localStorage.setItem('refresh_token', response.data.data.session.refresh_token);
    }
    
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  // Get stored user
  getStoredUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/api/auth/profile', profileData);
    
    // Update stored user if successful
    if (response.data.success && response.data.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    
    return response.data;
  },
};

export default authService;

