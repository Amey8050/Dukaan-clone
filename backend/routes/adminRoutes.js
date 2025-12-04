const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

// All admin routes require admin authentication
router.use(requireAdmin);

// Overview and statistics
router.get('/overview', adminController.getOverview);

// User management
router.get('/users', adminController.getUsers);
router.put('/users/:userId/role', adminController.updateUserRole);
router.delete('/users/:userId', adminController.deleteUser);

// Store management
router.get('/stores', adminController.getStores);
router.put('/stores/:storeId/status', adminController.toggleStoreStatus);
router.delete('/stores/:storeId', adminController.deleteStore);

// Order management
router.get('/orders', adminController.getOrders);

// Product management
router.get('/products', adminController.getProducts);

module.exports = router;

