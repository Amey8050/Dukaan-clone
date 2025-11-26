// Alternative implementation using Soft Delete
// Replace the deleteProduct function in productController.js with this version

deleteProduct: async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { hardDelete = false } = req.query; // Optional: ?hardDelete=true for force delete

    console.log('Delete product request:', { id, userId, hardDelete });

    // Validate that userId exists (user must be authenticated)
    if (!userId) {
      console.error('Product deletion error: User not authenticated');
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required to delete a product'
        }
      });
    }

    // First, get the product
    const { data: product, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('id, store_id, status, deleted_at')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Product deletion error - fetch failed:', {
        id,
        userId,
        error: fetchError.message,
        code: fetchError.code
      });
      
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Product not found'
          }
        });
      }
      
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to verify product',
          details: fetchError.message
        }
      });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Product not found'
        }
      });
    }

    // Check if already soft-deleted
    if (product.deleted_at && !hardDelete) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Product is already deleted',
          details: 'This product was deleted on ' + new Date(product.deleted_at).toLocaleString()
        }
      });
    }

    // Fetch store to verify ownership
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('id, owner_id')
      .eq('id', product.store_id)
      .single();
    
    if (storeError || !store || store.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. You do not own the store that contains this product.'
        }
      });
    }

    // Check for orders if attempting hard delete
    if (hardDelete === 'true') {
      const { count: orderCount } = await supabaseAdmin
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', id);

      if (orderCount > 0) {
        return res.status(409).json({
          success: false,
          error: {
            message: 'Cannot hard delete product with existing orders',
            details: `This product has ${orderCount} order(s). Use soft delete instead.`,
            orderCount
          }
        });
      }

      // Hard delete (only if no orders)
      const { error: deleteError } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to delete product',
            details: deleteError.message
          }
        });
      }

      return res.json({
        success: true,
        message: 'Product permanently deleted'
      });
    }

    // Soft delete (default behavior)
    const { data: softDeletedProduct, error: softDeleteError } = await supabaseAdmin
      .from('products')
      .update({
        status: 'archived',
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (softDeleteError) {
      console.error('Product soft delete error:', softDeleteError);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to archive product',
          details: softDeleteError.message
        }
      });
    }

    console.log('Product archived successfully:', { id, userId });
    res.json({
      success: true,
      message: 'Product archived successfully',
      data: {
        product: softDeletedProduct
      }
    });
  } catch (error) {
    console.error('Product deletion caught error:', error);
    next(error);
  }
}

