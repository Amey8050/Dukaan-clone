// Order Controller
const { supabaseAdmin } = require('../utils/supabaseClient');

// Helper function to get or create cart (reuse from cart controller logic)
const getCart = async (userId, storeId, sessionId = null) => {
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

  const { data: cart, error } = await query.single();
  return { data: cart, error };
};

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

const orderController = {
  // Create order (checkout)
  createOrder: async (req, res, next) => {
    try {
      const userId = req.userId; // Optional, from optionalAuth middleware
      const {
        store_id,
        shipping_address,
        billing_address,
        payment_method,
        notes,
        tax = 0,
        shipping_cost = 0,
        discount = 0
      } = req.body;
      const sessionId = req.headers['x-session-id'];

      // Validation
      if (!store_id) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Store ID is required'
          }
        });
      }

      if (!shipping_address) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Shipping address is required'
          }
        });
      }

      // Get cart
      const { data: cart, error: cartError } = await getCart(userId, store_id, sessionId);

      if (cartError || !cart) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Cart not found'
          }
        });
      }

      // Get cart items with product details
      const { data: cartItems, error: itemsError } = await supabaseAdmin
        .from('cart_items')
        .select(`
          *,
          product:products(id, name, images, price, track_inventory, inventory_quantity, status)
        `)
        .eq('cart_id', cart.id);

      if (itemsError || !cartItems || cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Cart is empty'
          }
        });
      }

      // Validate products and check inventory
      let subtotal = 0;
      const orderItemsData = [];

      for (const item of cartItems) {
        const product = item.product;

        // Check if product is active
        if (product.status !== 'active') {
          return res.status(400).json({
            success: false,
            error: {
              message: `Product "${product.name}" is not available`
            }
          });
        }

        // Check inventory
        if (product.track_inventory && product.inventory_quantity < item.quantity) {
          return res.status(400).json({
            success: false,
            error: {
              message: `Insufficient inventory for "${product.name}". Only ${product.inventory_quantity} available.`
            }
          });
        }

        const itemTotal = parseFloat(item.price) * item.quantity;
        subtotal += itemTotal;

        orderItemsData.push({
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          product_name: product.name,
          product_image: product.images && product.images.length > 0 ? product.images[0] : null,
          quantity: item.quantity,
          price: parseFloat(item.price),
          total: itemTotal
        });
      }

      // Calculate total
      const total = subtotal + parseFloat(tax) + parseFloat(shipping_cost) - parseFloat(discount);

      // Generate order number
      let orderNumber = generateOrderNumber();
      let orderNumberExists = true;
      let attempts = 0;

      // Ensure order number is unique
      while (orderNumberExists && attempts < 10) {
        const { data: existingOrder } = await supabaseAdmin
          .from('orders')
          .select('id')
          .eq('order_number', orderNumber)
          .single();

        if (!existingOrder) {
          orderNumberExists = false;
        } else {
          orderNumber = generateOrderNumber();
          attempts++;
        }
      }

      // Create order
      const orderData = {
        store_id,
        user_id: userId || null,
        order_number: orderNumber,
        status: 'pending',
        payment_status: 'pending',
        payment_method: payment_method || null,
        subtotal: subtotal.toFixed(2),
        tax: parseFloat(tax).toFixed(2),
        shipping_cost: parseFloat(shipping_cost).toFixed(2),
        discount: parseFloat(discount).toFixed(2),
        total: total.toFixed(2),
        currency: 'USD',
        shipping_address,
        billing_address: billing_address || shipping_address,
        notes: notes || null
      };

      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to create order',
            details: orderError.message
          }
        });
      }

      // Create order items
      const orderItemsInsert = orderItemsData.map(item => ({
        ...item,
        order_id: order.id
      }));

      const { error: orderItemsError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItemsInsert);

      if (orderItemsError) {
        // Rollback: delete order if items creation fails
        await supabaseAdmin.from('orders').delete().eq('id', order.id);
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to create order items',
            details: orderItemsError.message
          }
        });
      }

      // Update inventory for products that track inventory
      for (const item of cartItems) {
        if (item.product.track_inventory) {
          const newQuantity = item.product.inventory_quantity - item.quantity;
          await supabaseAdmin
            .from('products')
            .update({ inventory_quantity: newQuantity })
            .eq('id', item.product_id);
        }
      }

      // Clear cart
      await supabaseAdmin
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);

      // Get complete order with items
      const { data: completeOrder, error: fetchError } = await supabaseAdmin
        .from('orders')
        .select(`
          *,
          order_items:order_items(*)
        `)
        .eq('id', order.id)
        .single();

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          order: completeOrder
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get order by ID
  getOrder: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.userId; // Optional

      const { data: order, error } = await supabaseAdmin
        .from('orders')
        .select(`
          *,
          order_items:order_items(*),
          store:stores(id, name, slug)
        `)
        .eq('id', id)
        .single();

      if (error || !order) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Order not found'
          }
        });
      }

      // Verify ownership (user can only see their own orders, or store owner can see store orders)
      if (userId && order.user_id !== userId) {
        // Check if user is store owner
        const { data: store } = await supabaseAdmin
          .from('stores')
          .select('owner_id')
          .eq('id', order.store_id)
          .single();

        if (!store || store.owner_id !== userId) {
          return res.status(403).json({
            success: false,
            error: {
              message: 'You do not have permission to view this order'
            }
          });
        }
      }

      res.json({
        success: true,
        data: {
          order
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get user's orders
  getUserOrders: async (req, res, next) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required'
          }
        });
      }

      const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select(`
          *,
          order_items:order_items(*),
          store:stores(id, name, slug)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to fetch orders'
          }
        });
      }

      res.json({
        success: true,
        data: {
          orders: orders || []
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get store orders (for store owners)
  getStoreOrders: async (req, res, next) => {
    try {
      const userId = req.userId;
      const { storeId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required'
          }
        });
      }

      // Verify store ownership
      const { data: store, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('id', storeId)
        .eq('owner_id', userId)
        .single();

      if (storeError || !store) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Store not found or you do not have permission'
          }
        });
      }

      const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select(`
          *,
          order_items:order_items(*),
          user:user_profiles(id, email, full_name)
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to fetch orders'
          }
        });
      }

      res.json({
        success: true,
        data: {
          orders: orders || []
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update order status
  updateOrderStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.userId;
      const { status, payment_status } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required'
          }
        });
      }

      // Get order and verify store ownership
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .select(`
          *,
          store:stores(id, owner_id)
        `)
        .eq('id', id)
        .single();

      if (orderError || !order) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Order not found'
          }
        });
      }

      // Verify store ownership
      if (order.store.owner_id !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'You do not have permission to update this order'
          }
        });
      }

      // Prepare update data
      const updateData = {};
      if (status) {
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
        if (validStatuses.includes(status)) {
          updateData.status = status;
        }
      }
      if (payment_status) {
        const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
        if (validPaymentStatuses.includes(payment_status)) {
          updateData.payment_status = payment_status;
        }
      }

      // Update order
      const { data: updatedOrder, error: updateError } = await supabaseAdmin
        .from('orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to update order',
            details: updateError.message
          }
        });
      }

      res.json({
        success: true,
        message: 'Order updated successfully',
        data: {
          order: updatedOrder
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = orderController;

