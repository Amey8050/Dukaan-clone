// Inventory Controller
const { supabaseAdmin } = require('../utils/supabaseClient');

const inventoryController = {
  // Get inventory history for a product
  getInventoryHistory: async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      // Verify product exists and user has access
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('id, store_id, name')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Product not found'
          }
        });
      }

      // Verify store ownership
      const { data: store } = await supabaseAdmin
        .from('stores')
        .select('owner_id')
        .eq('id', product.store_id)
        .single();

      if (store.owner_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied'
          }
        });
      }

      // Get inventory history
      const { data: history, error: historyError } = await supabaseAdmin
        .from('inventory_history')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (historyError) {
        throw historyError;
      }

      // Get total count
      const { count, error: countError } = await supabaseAdmin
        .from('inventory_history')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId);

      res.json({
        success: true,
        data: {
          product: {
            id: product.id,
            name: product.name
          },
          history: history || [],
          pagination: {
            total: count || 0,
            limit: parseInt(limit),
            offset: parseInt(offset)
          }
        }
      });
    } catch (error) {
      console.error('Get Inventory History Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch inventory history',
          details: error.message
        }
      });
    }
  },

  // Adjust inventory manually
  adjustInventory: async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { quantity, reason, notes, change_type = 'adjustment' } = req.body;

      if (quantity === undefined || quantity === null) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Quantity is required'
          }
        });
      }

      // Get current product
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('id, store_id, inventory_quantity, name')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Product not found'
          }
        });
      }

      // Verify store ownership
      const { data: store } = await supabaseAdmin
        .from('stores')
        .select('owner_id')
        .eq('id', product.store_id)
        .single();

      if (store.owner_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied'
          }
        });
      }

      const previousQuantity = product.inventory_quantity;
      const newQuantity = parseInt(quantity);

      // Update product inventory
      const { data: updatedProduct, error: updateError } = await supabaseAdmin
        .from('products')
        .update({
          inventory_quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Manually log the inventory change (trigger will also log, but we want custom reason)
      const quantityChange = newQuantity - previousQuantity;
      const { error: logError } = await supabaseAdmin
        .from('inventory_history')
        .insert({
          product_id: productId,
          change_type: change_type,
          quantity_change: quantityChange,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          reason: reason || 'Manual adjustment',
          reference_type: 'manual',
          performed_by: req.user.id,
          notes: notes
        });

      // Log error but don't fail the request
      if (logError) {
        console.error('Failed to log inventory change:', logError);
      }

      res.json({
        success: true,
        data: {
          product: updatedProduct,
          change: {
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            quantity_change: quantityChange
          }
        }
      });
    } catch (error) {
      console.error('Adjust Inventory Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to adjust inventory',
          details: error.message
        }
      });
    }
  },

  // Get low stock products for a store
  getLowStockProducts: async (req, res, next) => {
    try {
      const { storeId } = req.params;

      // Verify store ownership
      const { data: store, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id, owner_id')
        .eq('id', storeId)
        .single();

      if (storeError || !store) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Store not found'
          }
        });
      }

      if (store.owner_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied'
          }
        });
      }

      // Get products with low stock
      // Note: Supabase doesn't support comparing columns directly in filter
      // We'll fetch all products and filter in JavaScript
      const { data: allProducts, error: productsError } = await supabaseAdmin
        .from('products')
        .select('id, name, sku, inventory_quantity, low_stock_threshold, images, status')
        .eq('store_id', storeId)
        .eq('track_inventory', true)
        .eq('status', 'active');

      if (productsError) {
        throw productsError;
      }

      // Filter products where inventory_quantity <= low_stock_threshold
      const products = (allProducts || []).filter(
        p => p.inventory_quantity <= p.low_stock_threshold
      );

      res.json({
        success: true,
        data: {
          products: products || [],
          count: products?.length || 0
        }
      });
    } catch (error) {
      console.error('Get Low Stock Products Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch low stock products',
          details: error.message
        }
      });
    }
  },

  // Get inventory summary for a store
  getInventorySummary: async (req, res, next) => {
    try {
      const { storeId } = req.params;

      // Verify store ownership
      const { data: store, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id, owner_id')
        .eq('id', storeId)
        .single();

      if (storeError || !store) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Store not found'
          }
        });
      }

      if (store.owner_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied'
          }
        });
      }

      // Get inventory statistics
      const { data: stats, error: statsError } = await supabaseAdmin
        .from('products')
        .select('inventory_quantity, low_stock_threshold, track_inventory, status')
        .eq('store_id', storeId);

      if (statsError) {
        throw statsError;
      }

      const summary = {
        total_products: stats.length,
        tracking_inventory: stats.filter(p => p.track_inventory).length,
        total_quantity: stats
          .filter(p => p.track_inventory)
          .reduce((sum, p) => sum + (p.inventory_quantity || 0), 0),
        low_stock_count: stats.filter(p => 
          p.track_inventory && 
          p.status === 'active' && 
          p.inventory_quantity <= p.low_stock_threshold
        ).length,
        out_of_stock_count: stats.filter(p => 
          p.track_inventory && 
          p.status === 'active' && 
          p.inventory_quantity === 0
        ).length
      };

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Get Inventory Summary Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch inventory summary',
          details: error.message
        }
      });
    }
  }
};

module.exports = inventoryController;

