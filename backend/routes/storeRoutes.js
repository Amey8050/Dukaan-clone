const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validateUUID } = require('../middleware/security');

// Store routes
// POST /api/stores - Create store (protected)
router.post('/', authenticate, storeController.createStore);

// GET /api/stores/my - Get current user's stores (protected)
router.get('/my', authenticate, storeController.getUserStores);

// PUT /api/stores/:id - Update store (protected)
router.put('/:id', validateUUID('id'), authenticate, storeController.updateStore);

// DELETE /api/stores/:id - Delete store (protected)
router.delete('/:id', validateUUID('id'), authenticate, storeController.deleteStore);

// GET /api/stores/slug/:slug - Get store by slug (public, but checks if active)
router.get('/slug/:slug', optionalAuth, storeController.getStoreBySlug);

// GET /api/stores/:id - Get store by ID (public, but checks if active)
router.get('/:id', validateUUID('id'), optionalAuth, storeController.getStore);

module.exports = router;

