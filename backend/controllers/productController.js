// Product Controller
const { supabaseAdmin } = require('../utils/supabaseClient');

// Helper function to generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .substring(0, 100); // Limit length
};

// Helper function to make slug unique within a store
const makeSlugUnique = async (baseSlug, storeId) => {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('store_id', storeId)
      .eq('slug', slug)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // No row found, slug is unique
      return slug;
    }
    
    // Slug exists, try with counter
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

const productController = {
  // Get products by store
  getProductsByStore: async (req, res, next) => {
    try {
      const { storeId } = req.params;
      const { status, category_id, featured, limit = 50, offset = 0 } = req.query;

      // Build query
      let query = supabaseAdmin
        .from('products')
        .select('*')
        .eq('store_id', storeId);
        // Note: Add .is('deleted_at', null) after adding deleted_at column to schema

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      } else {
        // Default: only show active products for public
        query = query.eq('status', 'active');
      }

      if (category_id) {
        query = query.eq('category_id', category_id);
      }

      if (featured === 'true') {
        query = query.eq('featured', true);
      }

      // Apply pagination
      query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
      query = query.order('created_at', { ascending: false });

      const { data: products, error } = await query;

      if (error) {
        console.error('Get products by store error:', {
          storeId,
          error: error.message,
          code: error.code,
          details: error.details
        });
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to fetch products',
            details: error.message,
            code: error.code
          }
        });
      }

      res.json({
        success: true,
        data: {
          products: products || [],
          count: products?.length || 0
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get product by ID
  getProduct: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.userId; // Optional, from optionalAuth middleware

      console.log('Get product request:', { id, userId });

      // First, get the product
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
        // Note: Add .is('deleted_at', null) after adding deleted_at column to schema

      if (productError) {
        console.error('Product fetch error:', {
          id,
          error: productError.message,
          code: productError.code,
          details: productError.details
        });
        
        if (productError.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: {
              message: 'Product not found',
              details: `No product found with ID: ${id}`
            }
          });
        }
        
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to fetch product',
            details: productError.message,
            code: productError.code
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

      // Fetch store and category separately
      let store = null;
      let category = null;

      if (product.store_id) {
        const { data: storeData, error: storeError } = await supabaseAdmin
          .from('stores')
          .select('id, name, slug, owner_id')
          .eq('id', product.store_id)
          .single();
        
        if (!storeError && storeData) {
          store = storeData;
        }
      }

      if (product.category_id) {
        const { data: categoryData, error: categoryError } = await supabaseAdmin
          .from('categories')
          .select('id, name, slug')
          .eq('id', product.category_id)
          .single();
        
        if (!categoryError && categoryData) {
          category = categoryData;
        }
      }

      // Attach store and category to product
      product.store = store;
      product.category = category;

      // Check if product is active or user is store owner
      const isStoreOwner = product.store?.owner_id === userId;
      if (product.status !== 'active' && !isStoreOwner) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Product is not available'
          }
        });
      }

      res.json({
        success: true,
        data: {
          product
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Create product
  createProduct: async (req, res, next) => {
    try {
      const {
        store_id,
        category_id,
        name,
        description,
        short_description,
        price,
        compare_at_price,
        cost_per_item,
        sku,
        barcode,
        track_inventory,
        inventory_quantity,
        low_stock_threshold,
        weight,
        status,
        featured,
        seo_title,
        seo_description,
        seo_keywords,
        images,
        tags
      } = req.body;

      const userId = req.userId; // From auth middleware

      // Validation
      if (!store_id) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Store ID is required'
          }
        });
      }

      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Product name is required'
          }
        });
      }

      if (!price || isNaN(price) || parseFloat(price) < 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Valid price is required'
          }
        });
      }

      // Verify store exists and user owns it
      const { data: store, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('id', store_id)
        .eq('owner_id', userId)
        .single();

      if (storeError || !store) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Store not found or you do not have permission to add products'
          }
        });
      }

      // Verify category exists and belongs to store (if provided)
      if (category_id) {
        const { data: category, error: categoryError } = await supabaseAdmin
          .from('categories')
          .select('id')
          .eq('id', category_id)
          .eq('store_id', store_id)
          .single();

        if (categoryError || !category) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Category not found or does not belong to this store'
            }
          });
        }
      }

      // Generate unique slug
      const baseSlug = generateSlug(name);
      const uniqueSlug = await makeSlugUnique(baseSlug, store_id);

      // Prepare product data
      const productData = {
        store_id,
        category_id: category_id || null,
        name: name.trim(),
        slug: uniqueSlug,
        description: description || null,
        short_description: short_description || null,
        price: parseFloat(price),
        compare_at_price: compare_at_price ? parseFloat(compare_at_price) : null,
        cost_per_item: cost_per_item ? parseFloat(cost_per_item) : null,
        sku: sku || null,
        barcode: barcode || null,
        track_inventory: track_inventory !== undefined ? track_inventory : true,
        inventory_quantity: inventory_quantity ? parseInt(inventory_quantity) : 0,
        low_stock_threshold: low_stock_threshold ? parseInt(low_stock_threshold) : 5,
        weight: weight ? parseFloat(weight) : null,
        status: status || 'active',
        featured: featured || false,
        seo_title: seo_title || null,
        seo_description: seo_description || null,
        seo_keywords: Array.isArray(seo_keywords) ? seo_keywords : null,
        images: Array.isArray(images) ? images : [],
        tags: Array.isArray(tags) ? tags : []
      };

      // Create product
      const { data: product, error } = await supabaseAdmin
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to create product',
            details: error.message
          }
        });
      }

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: {
          product
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update product
  updateProduct: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.userId;
      const {
        category_id,
        name,
        description,
        short_description,
        price,
        compare_at_price,
        cost_per_item,
        sku,
        barcode,
        track_inventory,
        inventory_quantity,
        low_stock_threshold,
        weight,
        status,
        featured,
        seo_title,
        seo_description,
        seo_keywords,
        images,
        tags
      } = req.body;

      // First, verify product exists and user owns the store
      const { data: existingProduct, error: fetchError } = await supabaseAdmin
        .from('products')
        .select(`
          *,
          store:stores(id, owner_id)
        `)
        .eq('id', id)
        .single();

      if (fetchError || !existingProduct) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Product not found'
          }
        });
      }

      // Verify store ownership
      if (existingProduct.store.owner_id !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'You do not have permission to update this product'
          }
        });
      }

      // Verify category if provided
      if (category_id && category_id !== existingProduct.category_id) {
        const { data: category, error: categoryError } = await supabaseAdmin
          .from('categories')
          .select('id')
          .eq('id', category_id)
          .eq('store_id', existingProduct.store_id)
          .single();

        if (categoryError || !category) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Category not found or does not belong to this store'
            }
          });
        }
      }

      // Prepare update data
      const updateData = {};

      if (name !== undefined && name.trim() !== existingProduct.name) {
        updateData.name = name.trim();
        // If name changed, update slug
        const baseSlug = generateSlug(name.trim());
        updateData.slug = await makeSlugUnique(baseSlug, existingProduct.store_id);
      }

      if (category_id !== undefined) updateData.category_id = category_id || null;
      if (description !== undefined) updateData.description = description || null;
      if (short_description !== undefined) updateData.short_description = short_description || null;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (compare_at_price !== undefined) updateData.compare_at_price = compare_at_price ? parseFloat(compare_at_price) : null;
      if (cost_per_item !== undefined) updateData.cost_per_item = cost_per_item ? parseFloat(cost_per_item) : null;
      if (sku !== undefined) updateData.sku = sku || null;
      if (barcode !== undefined) updateData.barcode = barcode || null;
      if (track_inventory !== undefined) updateData.track_inventory = track_inventory;
      if (inventory_quantity !== undefined) updateData.inventory_quantity = parseInt(inventory_quantity);
      if (low_stock_threshold !== undefined) updateData.low_stock_threshold = parseInt(low_stock_threshold);
      if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null;
      if (status !== undefined) updateData.status = status;
      if (featured !== undefined) updateData.featured = featured;
      if (seo_title !== undefined) updateData.seo_title = seo_title || null;
      if (seo_description !== undefined) updateData.seo_description = seo_description || null;
      if (seo_keywords !== undefined) updateData.seo_keywords = Array.isArray(seo_keywords) ? seo_keywords : null;
      if (images !== undefined) updateData.images = Array.isArray(images) ? images : [];
      if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];

      // Update product
      const { data: updatedProduct, error: updateError } = await supabaseAdmin
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to update product',
            details: updateError.message
          }
        });
      }

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: {
          product: updatedProduct
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete product
  deleteProduct: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.userId;

      console.log('Delete product request:', { id, userId });

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
        .select('id, store_id')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Product deletion error - fetch failed:', {
          id,
          userId,
          error: fetchError.message,
          code: fetchError.code,
          details: fetchError.details
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
            details: fetchError.message,
            code: fetchError.code
          }
        });
      }

      if (!product) {
        console.error('Product deletion error: Product not found', { id, userId });
        return res.status(404).json({
          success: false,
          error: {
            message: 'Product not found'
          }
        });
      }

      // Fetch store to verify ownership
      let store = null;
      if (product.store_id) {
        const { data: storeData, error: storeError } = await supabaseAdmin
          .from('stores')
          .select('id, owner_id')
          .eq('id', product.store_id)
          .single();
        
        if (storeError) {
          console.error('Product deletion error - store fetch failed:', {
            id,
            storeId: product.store_id,
            error: storeError.message,
            code: storeError.code
          });
          return res.status(500).json({
            success: false,
            error: {
              message: 'Failed to verify store ownership',
              details: storeError.message
            }
          });
        }
        
        store = storeData;
      }

      // Verify store ownership
      if (!store || store.owner_id !== userId) {
        console.error('Product deletion error: Access denied', {
          id,
          userId,
          storeOwnerId: store?.owner_id
        });
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied. You do not own the store that contains this product.'
          }
        });
      }

      // ============================================
      // SOLUTION 1: Check for orders before deletion (Prevent deletion)
      // ============================================
      // Check if product has any order items
      const { data: orderItems, error: orderCheckError } = await supabaseAdmin
        .from('order_items')
        .select('id, order_id')
        .eq('product_id', id)
        .limit(1);

      if (orderCheckError) {
        console.error('Product deletion error - order check failed:', {
          id,
          error: orderCheckError.message
        });
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to check product orders',
            details: orderCheckError.message
          }
        });
      }

      if (orderItems && orderItems.length > 0) {
        // Get order count for better message
        const { count: orderCount } = await supabaseAdmin
          .from('order_items')
          .select('*', { count: 'exact', head: true })
          .eq('product_id', id);

        console.log('Product has orders, archiving instead of deleting:', {
          id,
          orderCount: orderCount || orderItems.length
        });

        // Automatically archive products with orders instead of blocking deletion
        const { data: archivedProduct, error: archiveError } = await supabaseAdmin
          .from('products')
          .update({
            status: 'archived'
          })
          .eq('id', id)
          .select()
          .single();

        if (archiveError) {
          console.error('Product archive error:', {
            id,
            error: archiveError.message,
            code: archiveError.code
          });
          return res.status(500).json({
            success: false,
            error: {
              message: 'Failed to archive product',
              details: archiveError.message
            }
          });
        }

        console.log('Product archived successfully:', { id, userId });
        return res.json({
          success: true,
          message: `Product archived successfully (has ${orderCount || orderItems.length} order(s)). Products with orders cannot be permanently deleted to preserve order history.`,
          data: {
            product: archivedProduct
          }
        });
      }

      // ============================================
      // SOLUTION 2: Soft Delete Alternative (Recommended)
      // ============================================
      // Uncomment this section to use soft delete instead of hard delete
      /*
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
        console.error('Product soft delete error:', {
          id,
          error: softDeleteError.message,
          code: softDeleteError.code
        });
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to archive product',
            details: softDeleteError.message
          }
        });
      }

      console.log('Product archived successfully:', { id, userId });
      return res.json({
        success: true,
        message: 'Product archived successfully',
        data: {
          product: softDeletedProduct
        }
      });
      */

      // ============================================
      // SOLUTION 3: Hard Delete (Only if no orders)
      // ============================================
      // Delete product (cascade will handle related records like variants, cart items, etc.)
      // Note: This will fail if foreign key constraint is RESTRICT and product has orders
      const { error: deleteError } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Product deletion error:', {
          id,
          userId,
          error: deleteError.message,
          code: deleteError.code,
          details: deleteError.details
        });

        // Check if it's a foreign key constraint error
        if (deleteError.code === '23503' || deleteError.message?.includes('foreign key constraint')) {
          return res.status(409).json({
            success: false,
            error: {
              message: 'Cannot delete product with existing orders',
              details: 'This product is referenced in order history. Products with orders cannot be deleted.',
              code: deleteError.code,
              suggestion: 'Use soft delete (archive) instead to hide the product while preserving order history.'
            }
          });
        }

        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to delete product',
            details: deleteError.message,
            code: deleteError.code
          }
        });
      }

      console.log('Product deleted successfully:', { id, userId });

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = productController;

