// Rate limiting middleware
const rateLimit = require('express-rate-limit');

// General API rate limiter
// More lenient in development mode (higher limits)
const isDevelopment = process.env.NODE_ENV === 'development';
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 500 : 100, // Higher limit in development (500 vs 100)
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.'
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later.'
    }
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Strict rate limiter for AI endpoints (expensive operations)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per minute
  message: {
    success: false,
    error: {
      message: 'Too many AI requests, please try again later.'
    }
  },
});

// Strict rate limiter for upload endpoints
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 uploads per 15 minutes
  message: {
    success: false,
    error: {
      message: 'Too many upload requests, please try again later.'
    }
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  aiLimiter,
  uploadLimiter
};

