const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const storeRoutes = require('./storeRoutes');
const productRoutes = require('./productRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const paymentRoutes = require('./paymentRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const aiRoutes = require('./aiRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const predictionRoutes = require('./predictionRoutes');
const pricingRoutes = require('./pricingRoutes');
const recommendationRoutes = require('./recommendationRoutes');
const homepageRoutes = require('./homepageRoutes');
const promoRoutes = require('./promoRoutes');
const notificationRoutes = require('./notificationRoutes');
const uploadRoutes = require('./uploadRoutes');
const testRoutes = require('./testRoutes');
const settingsRoutes = require('./settingsRoutes');
const bulkUploadRoutes = require('./bulkUploadRoutes');
const adminRoutes = require('./adminRoutes');
const schedulerRoutes = require('./schedulerRoutes');

// API Routes
router.use('/api/auth', authRoutes);
router.use('/api/stores', storeRoutes);
router.use('/api/products', productRoutes);
router.use('/api/cart', cartRoutes);
router.use('/api/orders', orderRoutes);
router.use('/api/payments', paymentRoutes);
router.use('/api/analytics', analyticsRoutes);
router.use('/api/ai', aiRoutes);
router.use('/api/inventory', inventoryRoutes);
router.use('/api/predictions', predictionRoutes);
router.use('/api/pricing', pricingRoutes);
router.use('/api/recommendations', recommendationRoutes);
router.use('/api/homepage', homepageRoutes);
router.use('/api/promo', promoRoutes);
router.use('/api/notifications', notificationRoutes);
router.use('/api/upload', uploadRoutes);
router.use('/api/test', testRoutes);
router.use('/api/settings', settingsRoutes);
router.use('/api/bulk-upload', bulkUploadRoutes);
router.use('/api/admin', adminRoutes);
router.use('/api/scheduler', schedulerRoutes);

module.exports = router;

