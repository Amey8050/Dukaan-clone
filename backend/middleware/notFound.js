// 404 Not Found middleware
const notFound = (req, res, next) => {
  // Only log 404s for actual API routes, ignore favicon and other common requests
  if (req.originalUrl.startsWith('/api/')) {
    console.error('\n========== 404 API ROUTE NOT FOUND ==========');
    console.error('Method:', req.method);
    console.error('URL:', req.originalUrl);
    console.error('Path:', req.path);
    console.error('Base URL:', req.baseUrl);
    console.error('Available API endpoints:');
    console.error('  - /api/auth/*');
    console.error('  - /api/stores/*');
    console.error('  - /api/products/*');
    console.error('  - /api/analytics/store/:storeId/sales');
    console.error('  - /api/analytics/store/:storeId/traffic');
    console.error('  - /api/analytics/store/:storeId/product-views');
    console.error('  - /api/analytics/store/:storeId/summary');
    console.error('==============================================\n');
  }
  
  const error = new Error(`API route not found - ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = notFound;

