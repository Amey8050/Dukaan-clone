import axios from 'axios';
import API_BASE_URL from '../config/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Debug in development
      if (import.meta.env.DEV && config.url?.includes('/api/auth/me')) {
        console.log('Sending token for:', config.url, 'Token exists:', !!token);
      }
    } else {
      // Debug missing token in development
      if (import.meta.env.DEV && config.url?.includes('/api/')) {
        console.warn('No token found for protected route:', config.url);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });

          if (response.data?.data?.session) {
            const { access_token, refresh_token } = response.data.data.session;
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);

            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed - only redirect if not during auth initialization
        // Don't redirect for /api/auth/me calls during initialization
        const isAuthCheck = originalRequest.url?.includes('/api/auth/me');
        
        // Clear tokens but don't redirect during auth initialization
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        // Only redirect if it's not an auth check (to avoid redirect loops)
        if (!isAuthCheck && !window.location.pathname.includes('/login')) {
          // Use a small delay to avoid interrupting ongoing requests
          setTimeout(() => {
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }, 100);
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

