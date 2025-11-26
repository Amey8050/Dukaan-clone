// Upload Controller
const { supabaseAdmin } = require('../utils/supabaseClient');
const multer = require('multer');

// Configure multer for memory storage (we'll upload directly to Supabase)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const uploadController = {
  // Upload middleware
  uploadMiddleware: upload.single('file'),

  // Upload single file
  uploadFile: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'No file uploaded'
          }
        });
      }

      const { bucket = 'product-images', folder = '' } = req.body;
      const userId = req.userId; // Optional, from optionalAuth middleware

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = req.file.originalname.split('.').pop();
      const fileName = folder 
        ? `${folder}/${timestamp}-${randomString}.${fileExtension}`
        : `${timestamp}-${randomString}.${fileExtension}`;

      // Upload to Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (error) {
        console.error('Supabase Storage upload error:', error);
        console.error('Bucket:', bucket);
        console.error('Error code:', error.statusCode);
        console.error('Error message:', error.message);
        
        // Provide helpful error message
        if (error.statusCode === 404 || error.message?.includes('not found')) {
          throw new Error(`Storage bucket "${bucket}" does not exist. Please create it in Supabase Storage settings.`);
        }
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(fileName);

      res.json({
        success: true,
        data: {
          url: urlData.publicUrl,
          path: fileName,
          bucket: bucket,
          size: req.file.size,
          mimetype: req.file.mimetype,
          originalName: req.file.originalname
        }
      });
    } catch (error) {
      console.error('Upload File Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to upload file',
          details: error.message
        }
      });
    }
  },

  // Upload multiple files
  uploadMultipleFiles: async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'No files uploaded'
          }
        });
      }

      const { bucket = 'product-images', folder = '' } = req.body;
      const userId = req.userId;

      const uploadResults = [];

      for (const file of req.files) {
        try {
          // Generate unique filename
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 15);
          const fileExtension = file.originalname.split('.').pop();
          const fileName = folder 
            ? `${folder}/${timestamp}-${randomString}.${fileExtension}`
            : `${timestamp}-${randomString}.${fileExtension}`;

          // Upload to Supabase Storage
          const { data, error } = await supabaseAdmin.storage
            .from(bucket)
            .upload(fileName, file.buffer, {
              contentType: file.mimetype,
              upsert: false
            });

          if (error) {
            throw error;
          }

          // Get public URL
          const { data: urlData } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(fileName);

          uploadResults.push({
            url: urlData.publicUrl,
            path: fileName,
            bucket: bucket,
            size: file.size,
            mimetype: file.mimetype,
            originalName: file.originalname
          });
        } catch (fileError) {
          console.error(`Failed to upload file ${file.originalname}:`, fileError);
          uploadResults.push({
            error: fileError.message,
            originalName: file.originalname
          });
        }
      }

      res.json({
        success: true,
        data: {
          files: uploadResults,
          uploaded: uploadResults.filter(f => !f.error).length,
          failed: uploadResults.filter(f => f.error).length
        }
      });
    } catch (error) {
      console.error('Upload Multiple Files Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to upload files',
          details: error.message
        }
      });
    }
  },

  // Delete file
  deleteFile: async (req, res, next) => {
    try {
      const { bucket, path } = req.body;

      if (!bucket || !path) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Bucket and path are required'
          }
        });
      }

      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      console.error('Delete File Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete file',
          details: error.message
        }
      });
    }
  }
};

module.exports = uploadController;

