import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = authService.getStoredUser();
        const accessToken = localStorage.getItem('access_token');
        
        // Only verify token if we have both user and token
        if (storedUser && accessToken) {
          try {
            // The API interceptor will automatically refresh the token if needed
            const response = await authService.getCurrentUser();
            if (response.success && response.data?.user) {
              setUser(response.data.user);
              // Update stored user with latest data
              localStorage.setItem('user', JSON.stringify(response.data.user));
            } else {
              // Invalid response, clear storage
              authService.logout();
              setUser(null);
            }
          } catch (err) {
            // Token invalid or expired - clear storage silently
            // The API interceptor already tried to refresh, so this means auth failed
            authService.logout();
            setUser(null);
            // Suppress expected 401 errors during initialization
            if (err.response?.status !== 401) {
              console.error('Auth initialization error:', err);
            }
          }
        } else {
          // No token or user stored - user is not logged in
          setUser(null);
        }
      } catch (err) {
        // Only log unexpected errors (not 401s which are expected when not logged in)
        if (err.response?.status !== 401) {
          console.error('Auth initialization error:', err);
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login(email, password);
      
      // Verify login was successful
      if (response && response.success && response.data && response.data.user) {
        setUser(response.data.user);
        
        // Verify token was stored
        const token = localStorage.getItem('access_token');
        if (!token) {
          console.error('Warning: Token not stored after login');
          return { 
            success: false, 
            error: 'Login successful but token storage failed. Please try again.' 
          };
        }
        
        return { success: true, data: response.data };
      } else {
        return { 
          success: false, 
          error: response?.error?.message || 'Login failed - Invalid response' 
        };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Login failed';
      setError(errorMessage);
      console.error('Login error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.register(userData);
      
      // If session is returned, user is logged in
      if (response.data.session) {
        setUser(response.data.user);
        localStorage.setItem('access_token', response.data.session.access_token);
        localStorage.setItem('refresh_token', response.data.session.refresh_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error details:', JSON.stringify(err.response?.data, null, 2));
      
      // Handle validation errors
      if (err.response?.data?.error?.errors && Array.isArray(err.response.data.error.errors)) {
        const errors = err.response.data.error.errors.map(e => `${e.field}: ${e.message}`).join(', ');
        const errorMessage = `Validation failed: ${errors}`;
        setError(errorMessage);
        return { success: false, error: errorMessage, errors: err.response.data.error.errors };
      }
      
      const errorMessage = err.response?.data?.error?.message || 
                          err.response?.data?.error?.errors?.[0]?.message ||
                          err.response?.data?.message ||
                          err.message || 
                          'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.success) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

