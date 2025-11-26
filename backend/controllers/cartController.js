// Cart Controller
const { supabaseAdmin } = require('../utils/supabaseClient');

// Helper function to get or create cart for user/store
const getOrCreateCart = async (userId, storeId, sessionId = null) => {
  // Try to find existing cart
  let query = supabaseAdmin
    .from('cart')
    .select('*')
    .eq('store_id', storeId);

  if (userId) {
    query = query.eq('user_id', userId);
  } else if (sessionId) {
    query = query.eq('session_id', sessionId);
  } else {
    return { error: 'User ID or session ID required' };
  }

  const { data: existingCart, error: fetchError } = await query.single();

  if (existingCart && !fetchError) {
    return { data: existingCart, error: null };
  }

  // Create new cart if not found
  const cartData = {
    store_id: storeId,
    user_id: userId || null,
    session_id: sessionId || null,
  };

  const { data: newCart, error: createError } = await supabaseAdmin
    .from('cart')
    .insert(cartData)
    .select()
    .single();

  return { data: newCart, error: createError };
};

const cartController = {
  // Get user's cart
  getCart: async (req, res, next) => {
    try {
      const userId = req.userId; // From auth middleware (optional)
      const { storeId } = req.query;
      const sessionId = req.headers['x-session-id']; // For guest users

      if (!storeId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Store ID is required'
          }
        });
      }

      // Get or create cart
      const { data: cart, error: cartError } = await getOrCreateCart(userId, storeId, sessionId);

      if (cartError) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to get cart'
          }
        });
      }

      // Get cart items with product details
      const { data: cartItems, error: itemsError } = await supabaseAdmin
        .from('cart_items')
        .select(`
          *,
          product:products(id, name, slug, images, price, status)
        `)
        .eq('cart_id', cart.id)
        .order('created_at', { ascending: false });

      if (itemsError) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to get cart items'
          }
        });
      }

      // Calculate totals
      let subtotal = 0;
      const items = (cartItems || []).map((item) => {
        const itemTotal = parseFloat(item.price) * item.quantity;
        subtotal += itemTotal;
        return {
          ...item,
          total: itemTotal
        };
      });

      res.json({
        success: true,
        data: {
          cart: {
            id: cart.id,
            store_id: cart.store_id,
            items,
            subtotal: subtotal.toFixed(2),
            item_count: items.length,
            total_items: items.reduce((sum, item) => sum + item.quantity, 0)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Add item to cart
  addToCart: async (req, res, next) => {
    try {
      const userId = req.userId;
      const { store_id, product_id, variant_id, quantity = 1 } = req.body;
      const sessionId = req.headers['x-session-id'];

      // Validation
      if (!store_id || !product_id) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Store ID and Product ID are required'
          }
        });
      }

      if (quantity < 1) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Quantity must be at least 1'
          }
        });
      }

      // Verify product exists and is active
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', product_id)
        .eq('store_id', store_id)
        .eq('status', 'active')
        .single();

      if (productError || !product) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Product not found or not available'
          }
        });
      }

      // Check inventory if tracking is enabled
      if (product.track_inventory && product.inventory_quantity < quantity) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Only ${product.inventory_quantity} items available in stock`
          }
        });
      }

      // Get or create cart
      const { data: cart, error: cartError } = await getOrCreateCart(userId, store_id, sessionId);

      if (cartError) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to get cart'
          }
        });
      }

      // Check if item already exists in cart
      let query = supabaseAdmin
        .from('cart_items')
        .select('*')
        .eq('cart_id', cart.id)
        .eq('product_id', product_id);

      if (variant_id) {
        query = query.eq('variant_id', variant_id);
      } else {
        query = query.is('variant_id', null);
      }

      const { data: existingItem, error: existingError } = await query.single();

      if (existingItem && !existingError) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;

        // Check inventory again
        if (product.track_inventory && product.inventory_quantity < newQuantity) {
          return res.status(400).json({
            success: false,
            error: {
              message: `Only ${product.inventory_quantity} items available in stock`
            }
          });
        }

        const { data: updatedItem, error: updateError } = await supabaseAdmin
          .from('cart_items')
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id)
          .select()
          .single();

        if (updateError) {
          return res.status(500).json({
            success: false,
            error: {
              message: 'Failed to update cart item'
            }
          });
        }

        return res.json({
          success: true,
          message: 'Cart updated',
          data: {
            item: updatedItem
          }
        });
      }

      // Add new item to cart
      const { data: newItem, error: insertError } = await supabaseAdmin
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id,
          variant_id: variant_id || null,
          quantity,
          price: product.price
        })
        .select()
        .single();

      if (insertError) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to add item to cart'
          }
        });
      }

      res.status(201).json({
        success: true,
        message: 'Item added to cart',
        data: {
          item: newItem
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update cart item quantity
  updateCartItem: async (req, res, next) => {
    try {
      const userId = req.userId;
      const { itemId } = req.params;
      const { quantity } = req.body;
      const sessionId = req.headers['x-session-id'];

      if (!quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Quantity must be at least 1'
          }
        });
      }

      // Get cart item
      const { data: cartItem, error: itemError } = await supabaseAdmin
        .from('cart_items')
        .select(`
          *,
          cart:cart!inner(id, user_id, session_id, store_id),
          product:products(id, track_inventory, inventory_quantity)
        `)
        .eq('id', itemId)
        .single();

      if (itemError || !cartItem) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Cart item not found'
          }
        });
      }

      // Verify cart ownership
      const cart = cartItem.cart;
      if (userId && cart.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'You do not have permission to update this cart item'
          }
        });
      }
      if (!userId && cart.session_id !== sessionId) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'You do not have permission to update this cart item'
          }
        });
      }

      // Check inventory
      const product = cartItem.product;
      if (product.track_inventory && product.inventory_quantity < quantity) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Only ${product.inventory_quantity} items available in stock`
          }
        });
      }

      // Update quantity
      const { data: updatedItem, error: updateError } = await supabaseAdmin
        .from('cart_items')
        .update({
          quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to update cart item'
          }
        });
      }

      res.json({
        success: true,
        message: 'Cart item updated',
        data: {
          item: updatedItem
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Remove item from cart
  removeFromCart: async (req, res, next) => {
    try {
      const userId = req.userId;
      const { itemId } = req.params;
      const sessionId = req.headers['x-session-id'];

      // Get cart item
      const { data: cartItem, error: itemError } = await supabaseAdmin
        .from('cart_items')
        .select(`
          *,
          cart:cart!inner(id, user_id, session_id)
        `)
        .eq('id', itemId)
        .single();

      if (itemError || !cartItem) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Cart item not found'
          }
        });
      }

      // Verify cart ownership
      const cart = cartItem.cart;
      if (userId && cart.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'You do not have permission to remove this cart item'
          }
        });
      }
      if (!userId && cart.session_id !== sessionId) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'You do not have permission to remove this cart item'
          }
        });
      }

      // Delete item
      const { error: deleteError } = await supabaseAdmin
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (deleteError) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to remove cart item'
          }
        });
      }

      res.json({
        success: true,
        message: 'Item removed from cart'
      });
    } catch (error) {
      next(error);
    }
  },

  // Clear cart
  clearCart: async (req, res, next) => {
    try {
      const userId = req.userId;
      const { storeId } = req.query;
      const sessionId = req.headers['x-session-id'];

      if (!storeId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Store ID is required'
          }
        });
      }

      // Get cart
      const { data: cart, error: cartError } = await getOrCreateCart(userId, storeId, sessionId);

      if (cartError || !cart) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Cart not found'
          }
        });
      }

      // Delete all cart items
      const { error: deleteError } = await supabaseAdmin
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);

      if (deleteError) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to clear cart'
          }
        });
      }

      res.json({
        success: true,
        message: 'Cart cleared'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = cartController;

