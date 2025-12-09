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

    // Validate token exists and has minimum length
    if (!token || token.length < 10) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token format',
          details: 'Token is missing or too short'
        }
      });
    }

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data || !data.user) {
      // Only log detailed errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('\n========== AUTHENTICATION FAILED ==========');
        console.error('Request URL:', req.method, req.originalUrl);
        console.error('Error:', error?.message || 'Token verification failed');
        console.error('Error code:', error?.status);
        console.error('Token length:', token?.length);
        console.error('Token prefix:', token?.substring(0, 20));
        console.error('===========================================\n');
      }
      
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication failed - Invalid or expired token',
          details: error?.message || 'Token verification failed. Please log in again.',
          suggestion: 'Try logging out and logging back in to refresh your token.'
        }
      });
    }

    const user = data.user;

    // Attach user to request object
    req.user = user;
    req.userId = user.id;
    
    // Continue to next middleware
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

// Admin authentication - requires admin role
const requireAdmin = async (req, res, next) => {
  try {
    // First authenticate the user
    await authenticate(req, res, async () => {
      const { supabaseAdmin } = require('../utils/supabaseClient');
      
      // Get user profile to check role
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('role')
        .eq('id', req.userId)
        .single();
      
      if (profileError || !profile) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied - User profile not found'
          }
        });
      }
      
      if (profile.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied - Admin role required'
          }
        });
      }
      
      req.userRole = profile.role;
      next();
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  requireAdmin
};

