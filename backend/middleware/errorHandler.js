// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('\n========== ERROR OCCURRED ==========');
  console.error('Timestamp:', new Date().toISOString());
  console.error('Request URL:', req.method, req.originalUrl);
  console.error('Request body:', JSON.stringify(req.body, null, 2));
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Error code:', err.code);
  console.error('Error stack:', err.stack);
  console.error('Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
  console.error('=====================================\n');

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.message;

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  }

  // Database errors
  if (err.code === '23505') { // Unique violation
    statusCode = 409;
    message = 'Duplicate entry';
  }

  // Supabase errors
  if (err.message?.includes('relation') && err.message?.includes('does not exist')) {
    statusCode = 500;
    message = 'Database table does not exist';
    details = err.message;
  }

  if (err.message?.includes('bucket') && err.message?.includes('not found')) {
    statusCode = 500;
    message = 'Storage bucket does not exist';
    details = err.message;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      details: process.env.NODE_ENV === 'development' ? details : undefined,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        code: err.code
      })
    }
  });
};

module.exports = errorHandler;

