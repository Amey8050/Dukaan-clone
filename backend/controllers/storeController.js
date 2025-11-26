// Store Controller
const { supabaseAdmin } = require('../utils/supabaseClient');

// Helper function to generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .substring(0, 50); // Limit length
};

// Helper function to make slug unique
const makeSlugUnique = async (baseSlug, userId) => {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('stores')
      .select('id')
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

const storeController = {
  // Create store
  createStore: async (req, res, next) => {
    try {
      const { name, description, logo_url, banner_url, theme_color, domain } = req.body;
      const userId = req.userId; // From auth middleware

      console.log('Create store request:', { userId, name });

      // Check if user is authenticated
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'User not authenticated'
          }
        });
      }

      // Verify user profile exists
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, email')
        .eq('id', userId)
        .single();

      if (profileError || !userProfile) {
        console.error('User profile not found:', { userId, error: profileError });
        return res.status(404).json({
          success: false,
          error: {
            message: 'User profile not found. Please log out and log in again.',
            details: profileError?.message
          }
        });
      }

      // Validation
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Store name is required'
          }
        });
      }

      if (name.length > 100) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Store name must be less than 100 characters'
          }
        });
      }

      // Generate unique slug
      const baseSlug = generateSlug(name);
      const uniqueSlug = await makeSlugUnique(baseSlug, userId);

      console.log('Creating store with:', { owner_id: userId, name, slug: uniqueSlug });

      // Create store
      const { data: store, error } = await supabaseAdmin
        .from('stores')
        .insert({
          owner_id: userId,
          name: name.trim(),
          slug: uniqueSlug,
          description: description || null,
          logo_url: logo_url || null,
          banner_url: banner_url || null,
          theme_color: theme_color || '#000000',
          domain: domain || null,
          is_active: true,
          settings: {}
        })
        .select()
        .single();

      if (error) {
        console.error('\n========== STORE CREATION ERROR ==========');
        console.error('User ID:', userId);
        console.error('Store name:', name);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', JSON.stringify(error, null, 2));
        console.error('==========================================\n');
        
        // Handle specific errors
        if (error.code === '23503' || error.message?.includes('foreign key constraint')) {
          return res.status(500).json({
            success: false,
            error: {
              message: 'User profile not found. Please ensure you are logged in with a valid account.',
              details: 'The user profile does not exist in the database.'
            }
          });
        }
        
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to create store',
            details: error.message,
            code: error.code
          }
        });
      }

      res.status(201).json({
        success: true,
        message: 'Store created successfully',
        data: {
          store
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get store by ID
  getStore: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.userId; // Optional, from optionalAuth middleware

      console.log('Get store request:', { id, userId });

      const { data: store, error } = await supabaseAdmin
        .from('stores')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Store fetch error:', {
          id,
          userId,
          error: error.message,
          code: error.code,
          details: error.details
        });
        
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: {
              message: 'Store not found'
            }
          });
        }
        
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to fetch store',
            details: error.message,
            code: error.code
          }
        });
      }

      if (!store) {
        console.error('Store fetch error: Store not found', { id, userId });
        return res.status(404).json({
          success: false,
          error: {
            message: 'Store not found'
          }
        });
      }

      // Check if store is active or user is owner
      if (!store.is_active && store.owner_id !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Store is not available'
          }
        });
      }

      res.json({
        success: true,
        data: {
          store
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update store
  updateStore: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.userId;
      const { name, description, logo_url, banner_url, theme_color, domain, is_active, settings } = req.body;

      // First, verify store exists and user owns it
      const { data: existingStore, error: fetchError } = await supabaseAdmin
        .from('stores')
        .select('*')
        .eq('id', id)
        .eq('owner_id', userId)
        .single();

      if (fetchError || !existingStore) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Store not found or you do not have permission to update it'
          }
        });
      }

      // Prepare update data
      const updateData = {};
      if (name !== undefined) {
        updateData.name = name.trim();
        // If name changed, update slug
        if (name.trim() !== existingStore.name) {
          const baseSlug = generateSlug(name.trim());
          updateData.slug = await makeSlugUnique(baseSlug, userId);
        }
      }
      if (description !== undefined) updateData.description = description;
      if (logo_url !== undefined) updateData.logo_url = logo_url;
      if (banner_url !== undefined) updateData.banner_url = banner_url;
      if (theme_color !== undefined) updateData.theme_color = theme_color;
      if (domain !== undefined) updateData.domain = domain;
      if (is_active !== undefined) updateData.is_active = is_active;
      if (settings !== undefined) updateData.settings = settings;

      // Update store
      const { data: updatedStore, error: updateError } = await supabaseAdmin
        .from('stores')
        .update(updateData)
        .eq('id', id)
        .eq('owner_id', userId)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to update store',
            details: updateError.message
          }
        });
      }

      res.json({
        success: true,
        message: 'Store updated successfully',
        data: {
          store: updatedStore
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete store
  deleteStore: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.userId;

      console.log('Delete store request:', { id, userId });

      // Validate that userId exists (user must be authenticated)
      if (!userId) {
        console.error('Store deletion error: User not authenticated');
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required to delete a store'
          }
        });
      }

      // Verify store exists and user owns it
      const { data: store, error: fetchError } = await supabaseAdmin
        .from('stores')
        .select('id, owner_id')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Store deletion error - fetch failed:', {
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
              message: 'Store not found'
            }
          });
        }
        
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to verify store ownership',
            details: fetchError.message
          }
        });
      }

      if (!store) {
        console.error('Store deletion error: Store not found', { id, userId });
        return res.status(404).json({
          success: false,
          error: {
            message: 'Store not found'
          }
        });
      }

      // Verify ownership
      if (store.owner_id !== userId) {
        console.error('Store deletion error: Access denied', {
          id,
          userId,
          ownerId: store.owner_id
        });
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied. You do not own this store.'
          }
        });
      }

      // Check if store has products with orders (which prevent deletion due to RESTRICT constraint)
      // First, get all products for this store
      const { data: storeProducts, error: productsFetchError } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('store_id', id);

      if (productsFetchError) {
        console.error('Store deletion error - products fetch failed:', {
          id,
          error: productsFetchError.message
        });
        // Continue with deletion attempt
      }

      // Find which products have orders
      let productIdsWithOrders = [];
      if (storeProducts && storeProducts.length > 0) {
        const productIds = storeProducts.map(p => p.id);
        
        // Check which products have order_items
        const { data: orderItems, error: orderItemsError } = await supabaseAdmin
          .from('order_items')
          .select('product_id')
          .in('product_id', productIds);

        if (!orderItemsError && orderItems) {
          // Get unique product IDs that have orders
          productIdsWithOrders = [...new Set(orderItems.map(item => item.product_id))];
        }
      }

      // Archive products with orders before deleting store
      if (productIdsWithOrders.length > 0) {
        console.log('Archiving products with orders before store deletion:', {
          storeId: id,
          productCount: productIdsWithOrders.length
        });

        const { error: archiveError } = await supabaseAdmin
          .from('products')
          .update({ status: 'archived' })
          .in('id', productIdsWithOrders);

        if (archiveError) {
          console.error('Store deletion error - failed to archive products:', {
            id,
            error: archiveError.message
          });
          // Continue anyway - try to delete store
        } else {
          console.log(`Archived ${productIdsWithOrders.length} product(s) with orders`);
        }
      }

      // Delete store (cascade will handle related records)
      // Products without orders will be deleted via CASCADE
      // Products with orders are now archived, so RESTRICT won't block deletion
      const { error: deleteError } = await supabaseAdmin
        .from('stores')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Store deletion error:', {
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
              message: 'Cannot delete store due to existing relationships',
              details: deleteError.message,
              code: deleteError.code,
              suggestion: 'This store has products with orders. Run the SQL migration in backend/database/fix_store_deletion.sql to enable store deletion while preserving order history.'
            }
          });
        }

        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to delete store',
            details: deleteError.message,
            code: deleteError.code
          }
        });
      }

      console.log('Store deleted successfully:', { id, userId });
      
      let message = 'Store deleted successfully';
      if (productIdsWithOrders.length > 0) {
        message += `. ${productIdsWithOrders.length} product(s) with orders were archived to preserve order history.`;
      }
      
      res.json({
        success: true,
        message: message
      });
    } catch (error) {
      console.error('Store deletion caught error:', error);
      next(error);
    }
  },

  // Get user's stores
  getUserStores: async (req, res, next) => {
    try {
      const userId = req.userId; // From auth middleware

      const { data: stores, error } = await supabaseAdmin
        .from('stores')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to fetch stores'
          }
        });
      }

      res.json({
        success: true,
        data: {
          stores: stores || []
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = storeController;

