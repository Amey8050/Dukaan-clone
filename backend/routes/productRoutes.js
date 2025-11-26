const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validateUUID } = require('../middleware/security');

// Product routes
// POST /api/products - Create product (protected)
router.post('/', authenticate, productController.createProduct);

// GET /api/products/store/:storeId - Get products by store (public)
router.get('/store/:storeId', optionalAuth, productController.getProductsByStore);

// PUT /api/products/:id - Update product (protected)
router.put('/:id', validateUUID('id'), authenticate, productController.updateProduct);

// DELETE /api/products/:id - Delete product (protected)
router.delete('/:id', validateUUID('id'), authenticate, productController.deleteProduct);

// GET /api/products/:id - Get product by ID (public) - Must be last to avoid route conflicts
router.get('/:id', (req, res, next) => {
  console.log('\n🔍 Product route middleware hit:', { 
    id: req.params.id, 
    url: req.originalUrl,
    path: req.path,
    method: req.method
  });
  next();
}, (req, res, next) => {
  console.log('🔍 UUID validation middleware hit');
  next();
}, validateUUID('id'), (req, res, next) => {
  console.log('🔍 UUID validation passed');
  next();
}, optionalAuth, (req, res, next) => {
  console.log('🔍 Auth middleware passed, calling controller');
  next();
}, productController.getProduct);

module.exports = router;

