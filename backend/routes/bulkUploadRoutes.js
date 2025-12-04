const express = require('express');
const router = express.Router();
const bulkUploadController = require('../controllers/bulkUploadController');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for Excel file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for Excel files (supports 100+ products)
  },
  fileFilter: (req, file, cb) => {
    // Allow Excel files
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
      'text/csv'
    ];
    
    if (allowedMimes.includes(file.mimetype) || 
        file.originalname.endsWith('.xlsx') || 
        file.originalname.endsWith('.xls') ||
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) and CSV files are allowed'), false);
    }
  }
});

// Bulk upload routes
// NOTE: These routes have NO rate limiting applied - unlimited uploads allowed
// Rate limiting is excluded in backend/index.js for maximum upload speed

// GET /api/bulk-upload/template - Download Excel template
router.get('/template', authenticate, bulkUploadController.getTemplate);

// Middleware to extend timeout for bulk uploads (30 minutes)
const extendTimeout = (req, res, next) => {
  // Extend request timeout for bulk operations
  req.setTimeout(30 * 60 * 1000); // 30 minutes
  res.setTimeout(30 * 60 * 1000); // 30 minutes
  next();
};

// Error handler for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'File too large',
          details: 'Maximum file size is 50MB. Please split your Excel file into smaller batches.'
        }
      });
    }
    return res.status(400).json({
      success: false,
      error: {
        message: 'Upload error',
        details: err.message
      }
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      error: {
        message: err.message || 'Upload failed'
      }
    });
  }
  next();
};

// POST /api/bulk-upload/products - Upload products from Excel
router.post(
  '/products',
  authenticate,
  extendTimeout,
  upload.single('file'),
  handleMulterError,
  bulkUploadController.bulkUploadProducts
);

module.exports = router;

