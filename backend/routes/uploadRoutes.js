const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const multer = require('multer');
const { optionalAuth } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');

// Configure multer for multiple files
const storage = multer.memoryStorage();
const uploadMultiple = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload routes
// POST /api/upload - Upload single file (optional auth)
router.post('/', uploadLimiter, optionalAuth, uploadController.uploadMiddleware, uploadController.uploadFile);

// POST /api/upload/multiple - Upload multiple files (optional auth)
router.post('/multiple', uploadLimiter, optionalAuth, uploadMultiple.array('files', 10), uploadController.uploadMultipleFiles);

// DELETE /api/upload - Delete file (optional auth)
router.delete('/', optionalAuth, uploadController.deleteFile);

module.exports = router;

