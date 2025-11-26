// Sales Prediction Controller
const { supabaseAdmin } = require('../utils/supabaseClient');
const { getModel, withTimeout } = require('../utils/geminiClient');

const predictionController = {
  // Get sales prediction for a store
  getSalesPrediction: async (req, res, next) => {
    try {
      const { storeId } = req.params;
      const { period = '30', productId } = req.query; // period in days

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

      if (store.owner_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied'
          }
        });
      }

      // Get historical sales data
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));

      // Get orders first
      let ordersQuery = supabaseAdmin
        .from('orders')
        .select('id, total, created_at, status')
        .eq('store_id', storeId)
        .eq('status', 'delivered')
        .gte('created_at', daysAgo.toISOString())
        .order('created_at', { ascending: false });

      const { data: orders, error: ordersError } = await ordersQuery;

      if (ordersError) {
        throw ordersError;
      }

      // Get order items for these orders
      const orderIds = orders.map(o => o.id);
      let itemsQuery = supabaseAdmin
        .from('order_items')
        .select('id, order_id, product_id, quantity, price, total')
        .in('order_id', orderIds);

      if (productId) {
        itemsQuery = itemsQuery.eq('product_id', productId);
      }

      const { data: orderItems, error: itemsError } = await itemsQuery;

      if (itemsError) {
        throw itemsError;
      }

      // Combine orders with their items
      const ordersWithItems = orders.map(order => ({
        ...order,
        order_items: orderItems.filter(item => item.order_id === order.id)
      }));

      // Calculate sales statistics
      const salesData = calculateSalesStatistics(ordersWithItems || [], parseInt(period));

      // Use AI to generate predictions
      const predictions = await generateAIPredictions(salesData, store.name, parseInt(period));

      res.json({
        success: true,
        data: {
          store: {
            id: store.id,
            name: store.name
          },
          period: parseInt(period),
          historical_data: salesData,
          predictions: predictions
        }
      });
    } catch (error) {
      console.error('Sales Prediction Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to generate sales predictions',
          details: error.message
        }
      });
    }
  },

  // Get product-level sales predictions
  getProductSalesPrediction: async (req, res, next) => {
    try {
      const { storeId, productId } = req.params;
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

      if (store.owner_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied'
          }
        });
      }

      // Get product info
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('id, name, price, inventory_quantity')
        .eq('id', productId)
        .eq('store_id', storeId)
        .single();

      if (productError || !product) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Product not found'
          }
        });
      }

      // Get historical sales for this product
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));

      const { data: orderItems, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .select(`
          id,
          quantity,
          price,
          total,
          created_at,
          orders!inner (
            id,
            status,
            created_at
          )
        `)
        .eq('product_id', productId)
        .eq('orders.store_id', storeId)
        .eq('orders.status', 'delivered')
        .gte('orders.created_at', daysAgo.toISOString())
        .order('orders.created_at', { ascending: false });

      if (itemsError) {
        throw itemsError;
      }

      // Calculate product sales statistics
      const productSalesData = calculateProductSalesStatistics(itemsWithOrders || [], parseInt(period));

      // Generate AI predictions for product
      const predictions = await generateProductPredictions(
        productSalesData,
        product,
        parseInt(period)
      );

      res.json({
        success: true,
        data: {
          product: {
            id: product.id,
            name: product.name,
            current_price: product.price,
            current_inventory: product.inventory_quantity
          },
          period: parseInt(period),
          historical_data: productSalesData,
          predictions: predictions
        }
      });
    } catch (error) {
      console.error('Product Sales Prediction Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to generate product sales predictions',
          details: error.message
        }
      });
    }
  }
};

// Helper function to calculate sales statistics
function calculateSalesStatistics(orders, periodDays) {
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Daily breakdown
  const dailySales = {};
  orders.forEach(order => {
    const date = new Date(order.created_at).toISOString().split('T')[0];
    if (!dailySales[date]) {
      dailySales[date] = { revenue: 0, orders: 0 };
    }
    dailySales[date].revenue += parseFloat(order.total || 0);
    dailySales[date].orders += 1;
  });

  // Product sales breakdown
  const productSales = {};
  orders.forEach(order => {
    if (order.order_items) {
      order.order_items.forEach(item => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = {
            quantity: 0,
            revenue: 0,
            orders: 0
          };
        }
        productSales[item.product_id].quantity += item.quantity;
        productSales[item.product_id].revenue += parseFloat(item.total || 0);
        productSales[item.product_id].orders += 1;
      });
    }
  });

  return {
    total_revenue: totalRevenue,
    total_orders: totalOrders,
    average_order_value: averageOrderValue,
    period_days: periodDays,
    daily_sales: dailySales,
    product_sales: productSales,
    trend: calculateTrend(dailySales)
  };
}

// Helper function to calculate product sales statistics
function calculateProductSalesStatistics(orderItems, periodDays) {
  const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalRevenue = orderItems.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
  const averagePrice = orderItems.length > 0
    ? orderItems.reduce((sum, item) => sum + parseFloat(item.price || 0), 0) / orderItems.length
    : 0;

  // Daily breakdown
  const dailySales = {};
  orderItems.forEach(item => {
    const date = new Date(item.orders.created_at).toISOString().split('T')[0];
    if (!dailySales[date]) {
      dailySales[date] = { quantity: 0, revenue: 0 };
    }
    dailySales[date].quantity += item.quantity;
    dailySales[date].revenue += parseFloat(item.total || 0);
  });

  return {
    total_quantity: totalQuantity,
    total_revenue: totalRevenue,
    average_price: averagePrice,
    total_orders: orderItems.length,
    period_days: periodDays,
    daily_sales: dailySales,
    trend: calculateTrend(dailySales)
  };
}

// Calculate trend (increasing, decreasing, stable)
function calculateTrend(dailySales) {
  const dates = Object.keys(dailySales).sort();
  if (dates.length < 2) return 'insufficient_data';

  const firstHalf = dates.slice(0, Math.floor(dates.length / 2));
  const secondHalf = dates.slice(Math.floor(dates.length / 2));

  const firstHalfAvg = firstHalf.reduce((sum, date) => 
    sum + (dailySales[date].revenue || dailySales[date].quantity || 0), 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, date) => 
    sum + (dailySales[date].revenue || dailySales[date].quantity || 0), 0) / secondHalf.length;

  const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

  if (change > 10) return 'increasing';
  if (change < -10) return 'decreasing';
  return 'stable';
}

// Generate AI predictions using Gemini
async function generateAIPredictions(salesData, storeName, periodDays) {
  try {
    const model = getModel();

    const prompt = `Analyze the following sales data for an e-commerce store and provide predictions for the next ${periodDays} days.

Store Name: ${storeName}
Analysis Period: Last ${periodDays} days

Sales Statistics:
- Total Revenue: $${salesData.total_revenue.toFixed(2)}
- Total Orders: ${salesData.total_orders}
- Average Order Value: $${salesData.average_order_value.toFixed(2)}
- Trend: ${salesData.trend}

Daily Sales Pattern:
${JSON.stringify(salesData.daily_sales, null, 2)}

Top Products:
${JSON.stringify(Object.entries(salesData.product_sales).slice(0, 5), null, 2)}

Please provide:
1. Predicted revenue for the next ${periodDays} days
2. Predicted number of orders
3. Growth percentage compared to current period
4. Key insights and recommendations
5. Risk factors to watch

Format your response as JSON:
{
  "predicted_revenue": 5000.00,
  "predicted_orders": 50,
  "growth_percentage": 15.5,
  "confidence_level": "high/medium/low",
  "insights": ["insight1", "insight2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "risks": ["risk1", "risk2"]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    // Parse JSON response
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(aiResponse);
    } catch (parseError) {
      // Fallback: calculate basic predictions
      return generateBasicPredictions(salesData, periodDays);
    }
  } catch (error) {
    console.warn('AI Prediction failed, using basic calculations:', error.message);
    return generateBasicPredictions(salesData, periodDays);
  }
}

// Generate product-level predictions
async function generateProductPredictions(productSalesData, product, periodDays) {
  try {
    const model = getModel();

    const prompt = `Analyze sales data for a product and predict future sales.

Product: ${product.name}
Current Price: $${product.price}
Current Inventory: ${product.inventory_quantity}
Analysis Period: Last ${periodDays} days

Sales Statistics:
- Total Quantity Sold: ${productSalesData.total_quantity}
- Total Revenue: $${productSalesData.total_revenue.toFixed(2)}
- Average Price: $${productSalesData.average_price.toFixed(2)}
- Trend: ${productSalesData.trend}

Daily Sales:
${JSON.stringify(productSalesData.daily_sales, null, 2)}

Provide predictions for the next ${periodDays} days:
1. Predicted quantity to sell
2. Predicted revenue
3. Inventory recommendations (restock needed?)
4. Pricing recommendations
5. Marketing suggestions

Format as JSON:
{
  "predicted_quantity": 25,
  "predicted_revenue": 500.00,
  "inventory_recommendation": "restock/ok/low",
  "restock_quantity": 50,
  "pricing_recommendation": "increase/decrease/maintain",
  "suggested_price": 19.99,
  "marketing_suggestions": ["suggestion1", "suggestion2"]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(aiResponse);
    } catch (parseError) {
      return generateBasicProductPredictions(productSalesData, product, periodDays);
    }
  } catch (error) {
    console.warn('AI Product Prediction failed:', error.message);
    return generateBasicProductPredictions(productSalesData, product, periodDays);
  }
}

// Fallback: Basic prediction calculations
function generateBasicPredictions(salesData, periodDays) {
  const dailyAvgRevenue = salesData.total_revenue / salesData.period_days;
  const dailyAvgOrders = salesData.total_orders / salesData.period_days;

  let growthMultiplier = 1.0;
  if (salesData.trend === 'increasing') growthMultiplier = 1.15;
  if (salesData.trend === 'decreasing') growthMultiplier = 0.85;

  return {
    predicted_revenue: dailyAvgRevenue * periodDays * growthMultiplier,
    predicted_orders: Math.round(dailyAvgOrders * periodDays * growthMultiplier),
    growth_percentage: (growthMultiplier - 1) * 100,
    confidence_level: salesData.total_orders > 20 ? 'medium' : 'low',
    insights: [
      `Current trend: ${salesData.trend}`,
      `Average order value: $${salesData.average_order_value.toFixed(2)}`
    ],
    recommendations: [
      'Monitor daily sales trends',
      'Focus on top-performing products'
    ],
    risks: [
      'Limited historical data may affect accuracy'
    ]
  };
}

function generateBasicProductPredictions(productSalesData, product, periodDays) {
  const dailyAvgQuantity = productSalesData.total_quantity / productSalesData.period_days;
  let growthMultiplier = 1.0;
  if (productSalesData.trend === 'increasing') growthMultiplier = 1.15;
  if (productSalesData.trend === 'decreasing') growthMultiplier = 0.85;

  const predictedQuantity = dailyAvgQuantity * periodDays * growthMultiplier;
  const daysUntilOutOfStock = product.inventory_quantity / (dailyAvgQuantity * growthMultiplier);

  return {
    predicted_quantity: Math.round(predictedQuantity),
    predicted_revenue: predictedQuantity * product.price,
    inventory_recommendation: daysUntilOutOfStock < periodDays ? 'restock' : 'ok',
    restock_quantity: Math.round(predictedQuantity * 1.5),
    pricing_recommendation: 'maintain',
    suggested_price: product.price,
    marketing_suggestions: [
      'Consider promotions for slow-moving items',
      'Highlight trending products'
    ]
  };
}

module.exports = predictionController;

