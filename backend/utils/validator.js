// Input validation utilities
const validator = require('express-validator');

// Common validation rules
const commonRules = {
  email: validator.body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  
  password: validator.body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  name: validator.body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Name contains invalid characters'),
  
  phone: validator.body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Invalid phone number'),
  
  url: validator.body('url')
    .optional()
    .isURL()
    .withMessage('Invalid URL'),
  
  uuid: validator.param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  
  storeId: validator.param('storeId')
    .isUUID()
    .withMessage('Invalid store ID format'),
  
  productId: validator.param('productId')
    .isUUID()
    .withMessage('Invalid product ID format'),
  
  price: validator.body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  quantity: validator.body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  
  limit: validator.query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  offset: validator.query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validator.validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        errors: errors.array()
      }
    });
  }
  next();
};

// Sanitize and validate
const sanitizeAndValidate = (rules) => {
  return [
    ...rules,
    handleValidationErrors
  ];
};

module.exports = {
  commonRules,
  handleValidationErrors,
  sanitizeAndValidate,
  validator
};

