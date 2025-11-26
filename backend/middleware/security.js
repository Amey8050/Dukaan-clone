// Security middleware
const helmet = require('helmet');

// Configure Helmet with security headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API compatibility
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// Fields that should not be sanitized (they're validated separately)
const UNSANITIZED_FIELDS = ['email', 'password', 'refresh_token', 'access_token'];

// Sanitize input to prevent XSS
const sanitizeInput = (input, key = null) => {
  // Don't sanitize sensitive fields that are validated separately
  if (key && UNSANITIZED_FIELDS.includes(key)) {
    return input;
  }
  
  if (typeof input === 'string') {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  }
  if (input && typeof input === 'object') {
    const sanitized = {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key], key);
    }
    return sanitized;
  }
  return input;
};

// Sanitize request body
const sanitizeBody = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  next();
};

// Sanitize query parameters
const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    req.query = sanitizeInput(req.query);
  }
  next();
};

// Validate UUID format
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Validate UUID middleware
const validateUUID = (paramName = 'id') => {
  return (req, res, next) => {
    const uuid = req.params[paramName];
    console.log(`🔍 Validating UUID for ${paramName}:`, uuid);
    
    if (uuid && !isValidUUID(uuid)) {
      console.error(`❌ Invalid UUID format for ${paramName}:`, uuid);
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid ${paramName} format. Expected UUID format.`,
          received: uuid
        }
      });
    }
    
    console.log(`✅ UUID validation passed for ${paramName}`);
    next();
  };
};

// Prevent NoSQL injection
const preventNoSQLInjection = (req, res, next) => {
  const body = req.body;
  if (body) {
    // Remove MongoDB operators
    const mongoOperators = ['$where', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin', '$regex'];
    for (const key in body) {
      if (mongoOperators.includes(key)) {
        delete body[key];
      }
    }
  }
  next();
};

module.exports = {
  securityHeaders,
  sanitizeBody,
  sanitizeQuery,
  sanitizeInput,
  validateUUID,
  preventNoSQLInjection
};

