// Scheduled Job Service for Automatic Tasks
// Runs periodic checks for low stock notifications, cleanup tasks, etc.

const { supabaseAdmin } = require('../utils/supabaseClient');
const { checkAndNotifyLowStock } = require('../utils/notificationHelper');

class SchedulerService {
  constructor() {
    this.intervals = {};
    this.isRunning = false;
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    if (this.isRunning) {
      console.log('Scheduler service already running');
      return;
    }

    console.log('🚀 Starting scheduler service...');
    this.isRunning = true;

    // Check for low stock products every 6 hours (can be adjusted)
    this.intervals.lowStockCheck = setInterval(() => {
      this.checkLowStockProducts().catch(err => {
        console.error('Error in low stock check:', err);
      });
    }, 6 * 60 * 60 * 1000); // 6 hours

    // Run immediately on startup (optional, can be removed if you want to wait)
    // this.checkLowStockProducts().catch(err => {
    //   console.error('Error in initial low stock check:', err);
    // });

    console.log('✅ Scheduler service started');
    console.log('  - Low stock check: Every 6 hours');
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    console.log('🛑 Stopping scheduler service...');
    this.isRunning = false;

    Object.keys(this.intervals).forEach(key => {
      if (this.intervals[key]) {
        clearInterval(this.intervals[key]);
        delete this.intervals[key];
      }
    });

    console.log('✅ Scheduler service stopped');
  }

  /**
   * Check all stores for low stock products and send notifications
   */
  async checkLowStockProducts() {
    try {
      console.log('🔍 Starting low stock check...');
      const startTime = Date.now();

      // Get all active stores
      const { data: stores, error: storesError } = await supabaseAdmin
        .from('stores')
        .select('id, owner_id, name')
        .eq('is_active', true);

      if (storesError) {
        throw storesError;
      }

      if (!stores || stores.length === 0) {
        console.log('  No active stores found');
        return;
      }

      console.log(`  Checking ${stores.length} stores...`);

      let totalChecked = 0;
      let totalNotifications = 0;

      // Check each store
      for (const store of stores) {
        try {
          // Get all products with inventory tracking enabled
          const { data: products, error: productsError } = await supabaseAdmin
            .from('products')
            .select('id, name, inventory_quantity, low_stock_threshold, track_inventory')
            .eq('store_id', store.id)
            .eq('track_inventory', true)
            .eq('status', 'active');

          if (productsError) {
            console.error(`  Error fetching products for store ${store.name}:`, productsError);
            continue;
          }

          if (!products || products.length === 0) {
            continue;
          }

          // Check each product for low stock
          for (const product of products) {
            totalChecked++;

            if (
              product.inventory_quantity <= product.low_stock_threshold &&
              product.inventory_quantity >= 0 // Don't notify for negative quantities
            ) {
              // Check and notify low stock (helper will prevent duplicates)
              const result = await checkAndNotifyLowStock(
                product.id,
                product.inventory_quantity,
                product.low_stock_threshold
              );

              if (result.success && result.shouldNotify) {
                totalNotifications++;
              }
            }
          }
        } catch (storeError) {
          console.error(`  Error processing store ${store.name}:`, storeError);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Low stock check completed in ${duration}ms`);
      console.log(`  - Products checked: ${totalChecked}`);
      console.log(`  - Notifications sent: ${totalNotifications}`);
    } catch (error) {
      console.error('❌ Error in low stock check:', error);
      throw error;
    }
  }

  /**
   * Manually trigger low stock check (for testing or API endpoint)
   */
  async triggerLowStockCheck() {
    console.log('🔔 Manual low stock check triggered');
    await this.checkLowStockProducts();
  }
}

// Singleton instance
const schedulerService = new SchedulerService();

module.exports = schedulerService;

