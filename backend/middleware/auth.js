// Authentication middleware
const { supabase } = require('../utils/supabaseClient');

const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'No token provided. Please include a Bearer token in the Authorization header.'
        }
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('\n========== AUTHENTICATION FAILED ==========');
      console.error('Request URL:', req.method, req.originalUrl);
      console.error('Error:', error?.message || 'Token verification failed');
      console.error('Error code:', error?.status);
      console.error('Token length:', token?.length);
      console.error('Token prefix:', token?.substring(0, 20));
      console.error('===========================================\n');
      
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication failed - Invalid or expired token',
          details: error?.message || 'Token verification failed. Please log in again.',
          suggestion: 'Try logging out and logging back in to refresh your token.'
        }
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        req.user = user;
        req.userId = user.id;
      }
    }
    
    next();
  } catch (error) {
    // Continue even if auth fails in optional mode
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth
};

