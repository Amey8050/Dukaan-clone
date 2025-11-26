// Input validation middleware for common patterns
const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Log validation errors for debugging
    console.error('Validation errors:', errors.array());
    console.error('Request body:', req.body);
    
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path || err.param,
          message: err.msg,
          value: err.value
        }))
      }
    });
  }
  next();
};

// Auth validation
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('full_name')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Full name must be less than 100 characters'),
  body('phone')
    .optional({ checkFalsy: true })
    .custom((value) => {
      // If phone is provided, validate it; otherwise skip
      if (!value || value.trim() === '') {
        return true; // Empty phone is allowed
      }
      // Basic phone validation - allow various formats
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10;
    })
    .withMessage('Invalid phone number format'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Store validation
const validateStoreCreate = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Store name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('logo_url')
    .optional()
    .isURL()
    .withMessage('Invalid logo URL'),
  body('banner_url')
    .optional()
    .isURL()
    .withMessage('Invalid banner URL'),
  body('theme_color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Invalid theme color format'),
  handleValidationErrors
];

// Product validation
const validateProductCreate = [
  body('store_id')
    .isUUID()
    .withMessage('Invalid store ID'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Product name must be between 1 and 200 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('compare_at_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Compare at price must be a positive number'),
  body('inventory_quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Inventory quantity must be a non-negative integer'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  handleValidationErrors
];

// UUID parameter validation
const validateUUIDParam = (paramName = 'id') => [
  param(paramName)
    .isUUID()
    .withMessage(`Invalid ${paramName} format`),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateStoreCreate,
  validateProductCreate,
  validateUUIDParam,
  validatePagination,
  handleValidationErrors
};

