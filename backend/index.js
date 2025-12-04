const express = require('express');
const cors = require('cors');
const compression = require('compression');
const config = require('./config/config');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const performanceMonitor = require('./middleware/performance');
const { apiLimiter } = require('./middleware/rateLimiter');
const { securityHeaders, sanitizeBody, sanitizeQuery, preventNoSQLInjection } = require('./middleware/security');
const routes = require('./routes');
const { isAIAvailable } = require('./utils/geminiClient');
const schedulerService = require('./services/schedulerService');

const app = express();

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      config.frontendUrl,
      'http://localhost:3000',
      // 'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3000'
    ];
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID']
};

// Security Middleware (must be first)
app.use(securityHeaders); // Security headers
app.use(preventNoSQLInjection); // Prevent NoSQL injection

// Middleware
app.use(compression()); // Enable gzip compression
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Note: Input sanitization is applied per-route after validation
// This prevents breaking validated fields like email/password
// app.use(sanitizeBody); // Moved to routes that need it
app.use(sanitizeQuery); // Sanitize query parameters

app.use(performanceMonitor); // Performance monitoring
app.use(logger);

// Apply rate limiting to API routes
// Exclude certain routes from rate limiting (user's own data, bulk uploads, etc.)
app.use('/api', (req, res, next) => {
  // NO RATE LIMITING for:
  // - Bulk upload routes (needs unlimited processing for 100+ products)
  // - User's own stores endpoint (frequently accessed, protected by auth)
  // - Health/status endpoints
  const excludedPaths = [
    '/bulk-upload',           // Bulk uploads
    '/stores/my',             // User's own stores (protected, frequently accessed)
    '/cart',                  // Cart operations (user's own data)
    '/auth/me',               // Check auth status (frequently called)
    '/homepage/store'         // Store homepage (public, cached)
  ];
  
  // Check if this path should be excluded
  const shouldExclude = excludedPaths.some(path => req.path.startsWith(path));
  
  if (shouldExclude) {
    return next(); // Skip rate limiting
  }
  
  // Apply rate limiting to all other routes
  apiLimiter(req, res, next);
});

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Dukaan Clone Backend API',
    status: 'running',
    version: '1.0.0',
    environment: config.nodeEnv,
    endpoints: {
      auth: '/api/auth',
      stores: '/api/stores',
      products: '/api/products',
      cart: '/api/cart',
      orders: '/api/orders',
      payments: '/api/payments',
      ai: '/api/ai',
      inventory: '/api/inventory',
      predictions: '/api/predictions',
      pricing: '/api/pricing',
      recommendations: '/api/recommendations',
      homepage: '/api/homepage',
      promo: '/api/promo',
      notifications: '/api/notifications',
      upload: '/api/upload',
      analytics: '/api/analytics',
      bulkUpload: '/api/bulk-upload'
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use(routes);

// Debug: Log all registered routes
if (config.nodeEnv === 'development') {
  console.log('\n📋 Registered API Routes:');
  console.log('  POST   /api/stores');
  console.log('  GET    /api/stores/my');
  console.log('  GET    /api/stores/:id');
  console.log('  PUT    /api/stores/:id');
  console.log('  DELETE /api/stores/:id');
  console.log('  POST   /api/products');
  console.log('  GET    /api/products/store/:storeId');
  console.log('  GET    /api/products/:id');
  console.log('  PUT    /api/products/:id');
  console.log('  DELETE /api/products/:id');
  console.log('');
}

// 404 Handler (must be after all routes)
app.use(notFound);

// Error Handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port || process.env.PORT || 5000;

// Check AI configuration on startup
if (process.env.NODE_ENV === 'development') {
  console.log('\n========== AI Configuration Check ==========');
  if (isAIAvailable()) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    const maskedKey = apiKey.length > 10 
      ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
      : '***invalid***';
    console.log('✅ GEMINI_API_KEY: Configured');
    console.log(`   Key: ${maskedKey} (${apiKey.length} characters)`);
    if (apiKey.length < 20) {
      console.warn('⚠️  WARNING: API key seems too short. Gemini keys are typically 39+ characters.');
    }
  } else {
    console.warn('⚠️  GEMINI_API_KEY: NOT CONFIGURED');
    console.warn('   AI features will not work.');
    console.warn('   Add GEMINI_API_KEY to backend/.env file');
    console.warn('   Get key from: https://makersuite.google.com/app/apikey');
  }
  console.log('==========================================\n');
}
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🌐 CORS enabled for: ${config.frontendUrl}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  
  // Start scheduler service for automatic tasks (low stock checks, etc.)
  schedulerService.start();
});

