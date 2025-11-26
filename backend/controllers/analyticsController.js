// Analytics Controller
const { supabaseAdmin } = require('../utils/supabaseClient');

const analyticsController = {
  // Get sales analytics for a store
  getSalesAnalytics: async (req, res, next) => {
    try {
      const { storeId } = req.params;
      const { 
        period = '30', // days
        start_date,
        end_date,
        group_by = 'day' // day, week, month
      } = req.query;

      // Verify store ownership
      const { data: store, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id, owner_id, name')
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

      if (store.owner_id !== req.userId) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied'
          }
        });
      }

      // Calculate date range
      let startDate, endDate;
      if (start_date && end_date) {
        startDate = new Date(start_date);
        endDate = new Date(end_date);
      } else {
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));
      }

      // Get orders in date range (limit to prevent huge queries)
      const { data: orders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select(`
          id,
          total,
          subtotal,
          tax,
          shipping_cost,
          discount,
          status,
          payment_status,
          created_at,
          order_items (
            id,
            product_id,
            quantity,
            price,
            total
          )
        `)
        .eq('store_id', storeId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true })
        .limit(5000); // Limit to prevent memory issues

      if (ordersError) {
        throw ordersError;
      }

      // Calculate sales metrics
      const analytics = calculateSalesMetrics(orders || [], group_by, startDate, endDate);

      res.json({
        success: true,
        data: {
          store: {
            id: store.id,
            name: store.name
          },
          period: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
          },
          analytics: analytics
        }
      });
    } catch (error) {
      console.error('Sales Analytics Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch sales analytics',
          details: error.message
        }
      });
    }
  },

  // Get product sales analytics
  getProductSalesAnalytics: async (req, res, next) => {
    try {
      const { storeId } = req.params;
      const { period = '30', limit = 20 } = req.query;

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

      if (store.owner_id !== req.userId) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied'
          }
        });
      }

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));

      // Get order items
      const { data: orderItems, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .select(`
          id,
          product_id,
          quantity,
          price,
          total,
          product_name,
          orders!inner (
            store_id,
            status,
            created_at
          )
        `)
        .eq('orders.store_id', storeId)
        .eq('orders.status', 'delivered')
        .gte('orders.created_at', daysAgo.toISOString());

      if (itemsError) {
        throw itemsError;
      }

      // Calculate product sales
      const productSales = {};
      orderItems?.forEach(item => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = {
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: 0,
            revenue: 0,
            orders: 0,
            average_price: 0
          };
        }
        productSales[item.product_id].quantity += item.quantity;
        productSales[item.product_id].revenue += parseFloat(item.total || 0);
        productSales[item.product_id].orders += 1;
      });

      // Calculate averages and sort
      const products = Object.values(productSales)
        .map(product => ({
          ...product,
          average_price: product.revenue / product.quantity
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, parseInt(limit));

      res.json({
        success: true,
        data: {
          store_id: storeId,
          period: parseInt(period),
          products: products,
          total_products: Object.keys(productSales).length
        }
      });
    } catch (error) {
      console.error('Product Sales Analytics Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch product sales analytics',
          details: error.message
        }
      });
    }
  },

  // Get revenue trends
  getRevenueTrends: async (req, res, next) => {
    try {
      const { storeId } = req.params;
      const { period = '90', group_by = 'day' } = req.query;

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

      if (store.owner_id !== req.userId) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied'
          }
        });
      }

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));

      const { data: orders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select('total, status, created_at')
        .eq('store_id', storeId)
        .eq('status', 'delivered')
        .gte('created_at', daysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (ordersError) {
        throw ordersError;
      }

      // Group by time period
      const trends = groupRevenueByPeriod(orders || [], group_by, daysAgo);

      res.json({
        success: true,
        data: {
          store_id: storeId,
          period: parseInt(period),
          group_by: group_by,
          trends: trends
        }
      });
    } catch (error) {
      console.error('Revenue Trends Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch revenue trends',
          details: error.message
        }
      });
    }
  },

  // Get sales summary (quick stats)
  getSalesSummary: async (req, res, next) => {
    try {
      const { storeId } = req.params;
      const { period = '30' } = req.query;

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

      if (store.owner_id !== req.userId) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied'
          }
        });
      }

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));

      // Get all orders in period
      const { data: orders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select('total, subtotal, tax, shipping_cost, discount, status, payment_status, created_at')
        .eq('store_id', storeId)
        .gte('created_at', daysAgo.toISOString());

      if (ordersError) {
        throw ordersError;
      }

      // Calculate summary
      const summary = calculateSalesSummary(orders || [], parseInt(period));

      res.json({
        success: true,
        data: {
          store_id: storeId,
          period: parseInt(period),
          summary: summary
        }
      });
    } catch (error) {
      console.error('Sales Summary Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch sales summary',
          details: error.message
        }
      });
    }
  },

  // Get traffic analytics
  getTrafficAnalytics: async (req, res, next) => {
    try {
      const { storeId } = req.params;
      const { period = '30', group_by = 'day' } = req.query;

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

      if (store.owner_id !== req.userId) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied'
          }
        });
      }

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));

      // Get analytics events (limit to prevent huge queries)
      const { data: events, error: eventsError } = await supabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('store_id', storeId)
        .gte('created_at', daysAgo.toISOString())
        .order('created_at', { ascending: true })
        .limit(10000); // Limit to prevent memory issues

      if (eventsError) {
        throw eventsError;
      }

      // Calculate traffic metrics
      const analytics = calculateTrafficMetrics(events || [], group_by, daysAgo);

      res.json({
        success: true,
        data: {
          store_id: storeId,
          period: parseInt(period),
          group_by: group_by,
          analytics: analytics
        }
      });
    } catch (error) {
      console.error('Traffic Analytics Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch traffic analytics',
          details: error.message
        }
      });
    }
  },

  // Get product view analytics
  getProductViewAnalytics: async (req, res, next) => {
    try {
      const { storeId } = req.params;
      const { period = '30', limit = 20 } = req.query;

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

      if (store.owner_id !== req.userId) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied'
          }
        });
      }

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));

      // Get product view events
      const { data: events, error: eventsError } = await supabaseAdmin
        .from('analytics_events')
        .select('product_id, created_at, user_id, session_id')
        .eq('store_id', storeId)
        .eq('event_type', 'product_view')
        .gte('created_at', daysAgo.toISOString());

      if (eventsError) {
        throw eventsError;
      }

      // Calculate product views
      const productViews = {};
      const uniqueVisitors = {};
      
      events?.forEach(event => {
        if (!event.product_id) return;

        if (!productViews[event.product_id]) {
          productViews[event.product_id] = {
            product_id: event.product_id,
            views: 0,
            unique_visitors: new Set(),
            sessions: new Set()
          };
        }

        productViews[event.product_id].views += 1;
        if (event.user_id) {
          productViews[event.product_id].unique_visitors.add(event.user_id);
        }
        if (event.session_id) {
          productViews[event.product_id].sessions.add(event.session_id);
        }
      });

      // Get product names
      const productIds = Object.keys(productViews);
      let products = [];
      if (productIds.length > 0) {
        const { data: productData } = await supabaseAdmin
          .from('products')
          .select('id, name, price, images')
          .in('id', productIds);

        products = Object.values(productViews)
          .map(pv => {
            const product = productData?.find(p => p.id === pv.product_id);
            return {
              product_id: pv.product_id,
              product_name: product?.name || 'Unknown Product',
              product_price: product?.price || 0,
              product_image: product?.images?.[0] || null,
              views: pv.views,
              unique_visitors: pv.unique_visitors.size,
              sessions: pv.sessions.size
            };
          })
          .sort((a, b) => b.views - a.views)
          .slice(0, parseInt(limit));
      }

      res.json({
        success: true,
        data: {
          store_id: storeId,
          period: parseInt(period),
          products: products,
          total_product_views: events?.filter(e => e.product_id).length || 0
        }
      });
    } catch (error) {
      console.error('Product View Analytics Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch product view analytics',
          details: error.message
        }
      });
    }
  },

  // Track analytics event (public endpoint for frontend)
  trackEvent: async (req, res, next) => {
    try {
      const {
        store_id,
        event_type,
        product_id,
        metadata,
        session_id
      } = req.body;

      if (!store_id || !event_type) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Store ID and event type are required'
          }
        });
      }

      // Validate event type
      const validEventTypes = ['page_view', 'product_view', 'add_to_cart', 'purchase', 'search'];
      if (!validEventTypes.includes(event_type)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid event type'
          }
        });
      }

      // Get user ID if authenticated
      const userId = req.userId || null;

      // Get IP and user agent from request
      const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
      const userAgent = req.headers['user-agent'];

      // Insert analytics event
      const { data: event, error: eventError } = await supabaseAdmin
        .from('analytics_events')
        .insert({
          store_id: store_id,
          event_type: event_type,
          user_id: userId,
          session_id: session_id,
          product_id: product_id || null,
          metadata: metadata || {},
          ip_address: ipAddress,
          user_agent: userAgent
        })
        .select()
        .single();

      if (eventError) {
        throw eventError;
      }

      res.json({
        success: true,
        data: {
          event: event
        }
      });
    } catch (error) {
      console.error('Track Event Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to track event',
          details: error.message
        }
      });
    }
  }
};

// Calculate traffic metrics
function calculateTrafficMetrics(events, groupBy, startDate) {
  const totalViews = events.length;
  const uniqueVisitors = new Set(events.map(e => e.user_id || e.session_id).filter(Boolean));
  const uniqueSessions = new Set(events.map(e => e.session_id).filter(Boolean));

  // Event type breakdown
  const eventTypes = {
    page_view: events.filter(e => e.event_type === 'page_view').length,
    product_view: events.filter(e => e.event_type === 'product_view').length,
    add_to_cart: events.filter(e => e.event_type === 'add_to_cart').length,
    purchase: events.filter(e => e.event_type === 'purchase').length,
    search: events.filter(e => e.event_type === 'search').length
  };

  // Group by time period
  const timeSeries = groupEventsByPeriod(events, groupBy, startDate);

  // Calculate conversion rates
  const addToCartCount = eventTypes.add_to_cart;
  const purchaseCount = eventTypes.purchase;
  const productViewCount = eventTypes.product_view;

  const cartConversionRate = productViewCount > 0 
    ? (addToCartCount / productViewCount) * 100 
    : 0;

  const purchaseConversionRate = addToCartCount > 0
    ? (purchaseCount / addToCartCount) * 100
    : 0;

  const overallConversionRate = productViewCount > 0
    ? (purchaseCount / productViewCount) * 100
    : 0;

  return {
    overview: {
      total_views: totalViews,
      unique_visitors: uniqueVisitors.size,
      unique_sessions: uniqueSessions.size,
      average_views_per_session: uniqueSessions.size > 0 
        ? totalViews / uniqueSessions.size 
        : 0
    },
    event_types: eventTypes,
    conversion_rates: {
      cart_conversion: cartConversionRate,
      purchase_conversion: purchaseConversionRate,
      overall_conversion: overallConversionRate
    },
    time_series: timeSeries
  };
}

// Group events by time period
function groupEventsByPeriod(events, groupBy, startDate) {
  const grouped = {};

  events.forEach(event => {
    const date = new Date(event.created_at);
    let key;

    switch (groupBy) {
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default: // day
        key = date.toISOString().split('T')[0];
    }

    if (!grouped[key]) {
      grouped[key] = {
        date: key,
        views: 0,
        visitors: new Set(),
        sessions: new Set(),
        event_types: {
          page_view: 0,
          product_view: 0,
          add_to_cart: 0,
          purchase: 0,
          search: 0
        }
      };
    }

    grouped[key].views += 1;
    if (event.user_id) grouped[key].visitors.add(event.user_id);
    if (event.session_id) grouped[key].sessions.add(event.session_id);
    if (grouped[key].event_types[event.event_type] !== undefined) {
      grouped[key].event_types[event.event_type] += 1;
    }
  });

  // Convert sets to counts and sort
  return Object.values(grouped)
    .map(item => ({
      date: item.date,
      views: item.views,
      unique_visitors: item.visitors.size,
      unique_sessions: item.sessions.size,
      event_types: item.event_types
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Calculate sales metrics
function calculateSalesMetrics(orders, groupBy, startDate, endDate) {
  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, order) => sum + parseFloat(order.total || 0), 0);

  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

  const totalSubtotal = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, order) => sum + parseFloat(order.subtotal || 0), 0);

  const totalTax = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, order) => sum + parseFloat(order.tax || 0), 0);

  const totalShipping = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, order) => sum + parseFloat(order.shipping_cost || 0), 0);

  const totalDiscount = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, order) => sum + parseFloat(order.discount || 0), 0);

  const averageOrderValue = deliveredOrders > 0 ? totalRevenue / deliveredOrders : 0;

  // Group by time period
  const timeSeries = groupOrdersByPeriod(orders, groupBy, startDate, endDate);

  // Calculate conversion rates
  const paidOrders = orders.filter(o => o.payment_status === 'paid').length;
  const conversionRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0;

  return {
    overview: {
      total_revenue: totalRevenue,
      total_orders: totalOrders,
      delivered_orders: deliveredOrders,
      pending_orders: pendingOrders,
      cancelled_orders: cancelledOrders,
      average_order_value: averageOrderValue,
      conversion_rate: conversionRate
    },
    breakdown: {
      subtotal: totalSubtotal,
      tax: totalTax,
      shipping: totalShipping,
      discount: totalDiscount
    },
    time_series: timeSeries
  };
}

// Group orders by time period
function groupOrdersByPeriod(orders, groupBy, startDate, endDate) {
  const grouped = {};
  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  deliveredOrders.forEach(order => {
    const date = new Date(order.created_at);
    let key;

    switch (groupBy) {
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default: // day
        key = date.toISOString().split('T')[0];
    }

    if (!grouped[key]) {
      grouped[key] = {
        date: key,
        revenue: 0,
        orders: 0,
        average_order_value: 0
      };
    }

    grouped[key].revenue += parseFloat(order.total || 0);
    grouped[key].orders += 1;
  });

  // Calculate averages and sort
  Object.keys(grouped).forEach(key => {
    grouped[key].average_order_value = grouped[key].revenue / grouped[key].orders;
  });

  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
}

// Group revenue by period
function groupRevenueByPeriod(orders, groupBy, startDate) {
  const grouped = {};

  orders.forEach(order => {
    const date = new Date(order.created_at);
    let key;

    switch (groupBy) {
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default: // day
        key = date.toISOString().split('T')[0];
    }

    if (!grouped[key]) {
      grouped[key] = {
        period: key,
        revenue: 0,
        orders: 0
      };
    }

    grouped[key].revenue += parseFloat(order.total || 0);
    grouped[key].orders += 1;
  });

  return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
}

// Calculate sales summary
function calculateSalesSummary(orders, periodDays) {
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const paidOrders = orders.filter(o => o.payment_status === 'paid');

  const totalRevenue = deliveredOrders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
  const totalOrders = orders.length;
  const averageOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

  // Calculate daily average
  const dailyAverage = periodDays > 0 ? totalRevenue / periodDays : 0;

  // Compare with previous period
  const previousPeriodStart = new Date();
  previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays * 2);
  const previousPeriodEnd = new Date();
  previousPeriodEnd.setDate(previousPeriodEnd.getDate() - periodDays);

  // Note: In production, you'd fetch previous period data
  // For now, we'll calculate growth based on current data trends
  const recentHalf = deliveredOrders.slice(0, Math.floor(deliveredOrders.length / 2));
  const olderHalf = deliveredOrders.slice(Math.floor(deliveredOrders.length / 2));

  const recentRevenue = recentHalf.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
  const olderRevenue = olderHalf.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);

  const growthRate = olderRevenue > 0 
    ? ((recentRevenue - olderRevenue) / olderRevenue) * 100 
    : 0;

  return {
    total_revenue: totalRevenue,
    total_orders: totalOrders,
    delivered_orders: deliveredOrders.length,
    paid_orders: paidOrders.length,
    average_order_value: averageOrderValue,
    daily_average: dailyAverage,
    growth_rate: growthRate,
    conversion_rate: totalOrders > 0 ? (paidOrders.length / totalOrders) * 100 : 0
  };
}

module.exports = analyticsController;

