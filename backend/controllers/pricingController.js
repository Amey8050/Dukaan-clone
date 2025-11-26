// Auto Pricing Controller
const { supabaseAdmin } = require('../utils/supabaseClient');
const { getModel, withTimeout } = require('../utils/geminiClient');

const pricingController = {
  // Get pricing recommendations for a product
  getPricingRecommendations: async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { 
        competitor_prices,
        target_margin,
        market_position = 'competitive'
      } = req.body;

      // Get product details
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select(`
          id,
          name,
          price,
          compare_at_price,
          cost_per_item,
          store_id,
          stores!inner (
            id,
            owner_id
          )
        `)
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
      if (product.stores.owner_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied'
          }
        });
      }

      // Get sales data for this product
      const salesData = await getProductSalesData(productId, product.stores.id);

      // Generate pricing recommendations using AI
      const recommendations = await generatePricingRecommendations({
        product: {
          name: product.name,
          current_price: parseFloat(product.price),
          compare_at_price: product.compare_at_price ? parseFloat(product.compare_at_price) : null,
          cost_per_item: product.cost_per_item ? parseFloat(product.cost_per_item) : null
        },
        sales_data: salesData,
        competitor_prices: competitor_prices || [],
        target_margin: target_margin ? parseFloat(target_margin) : null,
        market_position: market_position
      });

      res.json({
        success: true,
        data: {
          product: {
            id: product.id,
            name: product.name,
            current_price: parseFloat(product.price)
          },
          recommendations: recommendations
        }
      });
    } catch (error) {
      console.error('Pricing Recommendations Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to generate pricing recommendations',
          details: error.message
        }
      });
    }
  },

  // Get bulk pricing recommendations for multiple products
  getBulkPricingRecommendations: async (req, res, next) => {
    try {
      const { storeId } = req.params;
      const { product_ids, target_margin, market_position = 'competitive' } = req.body;

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

      // Get products
      let productsQuery = supabaseAdmin
        .from('products')
        .select('id, name, price, cost_per_item, store_id')
        .eq('store_id', storeId)
        .eq('status', 'active');

      if (product_ids && product_ids.length > 0) {
        productsQuery = productsQuery.in('id', product_ids);
      }

      const { data: products, error: productsError } = await productsQuery.limit(50); // Limit to 50 products

      if (productsError) {
        throw productsError;
      }

      // Generate recommendations for each product
      const recommendations = await Promise.all(
        products.map(async (product) => {
          try {
            const salesData = await getProductSalesData(product.id, storeId);
            const rec = await generatePricingRecommendations({
              product: {
                name: product.name,
                current_price: parseFloat(product.price),
                cost_per_item: product.cost_per_item ? parseFloat(product.cost_per_item) : null
              },
              sales_data: salesData,
              competitor_prices: [],
              target_margin: target_margin ? parseFloat(target_margin) : null,
              market_position: market_position
            });

            return {
              product_id: product.id,
              product_name: product.name,
              current_price: parseFloat(product.price),
              recommendation: rec.recommended_price,
              reasoning: rec.reasoning
            };
          } catch (error) {
            console.error(`Error generating recommendation for product ${product.id}:`, error);
            return {
              product_id: product.id,
              product_name: product.name,
              current_price: parseFloat(product.price),
              recommendation: parseFloat(product.price),
              reasoning: 'Unable to generate recommendation',
              error: error.message
            };
          }
        })
      );

      res.json({
        success: true,
        data: {
          store_id: storeId,
          recommendations: recommendations,
          count: recommendations.length
        }
      });
    } catch (error) {
      console.error('Bulk Pricing Recommendations Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to generate bulk pricing recommendations',
          details: error.message
        }
      });
    }
  },

  // Analyze pricing strategy for a store
  analyzePricingStrategy: async (req, res, next) => {
    try {
      const { storeId } = req.params;

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

      // Get all products with pricing data
      const { data: products, error: productsError } = await supabaseAdmin
        .from('products')
        .select('id, name, price, cost_per_item, status')
        .eq('store_id', storeId)
        .eq('status', 'active');

      if (productsError) {
        throw productsError;
      }

      // Calculate pricing statistics
      const pricingStats = calculatePricingStatistics(products || []);

      // Generate strategy recommendations
      const strategy = await generatePricingStrategy(pricingStats, store.name);

      res.json({
        success: true,
        data: {
          store: {
            id: store.id,
            name: store.name
          },
          statistics: pricingStats,
          strategy: strategy
        }
      });
    } catch (error) {
      console.error('Pricing Strategy Analysis Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to analyze pricing strategy',
          details: error.message
        }
      });
    }
  }
};

// Helper function to get product sales data
async function getProductSalesData(productId, storeId) {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - 30); // Last 30 days

  // Get orders with this product
  const { data: orders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('id, status, created_at')
    .eq('store_id', storeId)
    .eq('status', 'delivered')
    .gte('created_at', daysAgo.toISOString());

  if (ordersError || !orders || orders.length === 0) {
    return {
      total_sold: 0,
      total_revenue: 0,
      average_price: 0,
      sales_trend: 'insufficient_data'
    };
  }

  const orderIds = orders.map(o => o.id);
  const { data: orderItems, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('quantity, price, total')
    .eq('product_id', productId)
    .in('order_id', orderIds);

  if (itemsError || !orderItems || orderItems.length === 0) {
    return {
      total_sold: 0,
      total_revenue: 0,
      average_price: 0,
      sales_trend: 'insufficient_data'
    };
  }

  const totalSold = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalRevenue = orderItems.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
  const averagePrice = orderItems.reduce((sum, item) => sum + parseFloat(item.price || 0), 0) / orderItems.length;

  return {
    total_sold: totalSold,
    total_revenue: totalRevenue,
    average_price: averagePrice,
    sales_trend: totalSold > 10 ? 'active' : 'slow'
  };
}

// Generate pricing recommendations using AI
async function generatePricingRecommendations(data) {
  try {
    const model = getModel();

    const {
      product,
      sales_data,
      competitor_prices,
      target_margin,
      market_position
    } = data;

    const prompt = `Analyze pricing for an e-commerce product and provide optimal pricing recommendations.

Product: ${product.name}
Current Price: $${product.current_price}
Cost per Item: ${product.cost_per_item ? `$${product.cost_per_item}` : 'Not specified'}
${product.compare_at_price ? `Compare at Price: $${product.compare_at_price}` : ''}

Sales Performance (Last 30 days):
- Total Sold: ${sales_data.total_sold}
- Total Revenue: $${sales_data.total_revenue.toFixed(2)}
- Average Price: $${sales_data.average_price.toFixed(2)}
- Sales Trend: ${sales_data.sales_trend}

${competitor_prices.length > 0 ? `Competitor Prices: ${competitor_prices.join(', ')}` : 'No competitor data available'}
${target_margin ? `Target Margin: ${target_margin}%` : ''}
Market Position: ${market_position}

Provide pricing recommendations:
1. Recommended price (optimal price point)
2. Minimum price (lowest acceptable)
3. Maximum price (premium pricing)
4. Pricing tiers (budget, standard, premium)
5. Reasoning for each recommendation
6. Expected impact on sales and revenue
7. Margin analysis

Format as JSON:
{
  "recommended_price": 29.99,
  "minimum_price": 24.99,
  "maximum_price": 34.99,
  "pricing_tiers": [
    {"tier": "budget", "price": 24.99, "margin": 20},
    {"tier": "standard", "price": 29.99, "margin": 35},
    {"tier": "premium", "price": 34.99, "margin": 50}
  ],
  "reasoning": "Detailed explanation",
  "expected_impact": {
    "sales_change": "+15%",
    "revenue_change": "+20%"
  },
  "margin_analysis": {
    "current_margin": 30,
    "recommended_margin": 35,
    "profit_increase": "+16.7%"
  }
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
      return generateBasicPricingRecommendations(data);
    }
  } catch (error) {
    console.warn('AI Pricing failed, using basic calculations:', error.message);
    return generateBasicPricingRecommendations(data);
  }
}

// Fallback: Basic pricing calculations
function generateBasicPricingRecommendations(data) {
  const { product, sales_data, target_margin } = data;
  const currentPrice = product.current_price;
  const cost = product.cost_per_item || 0;

  // Calculate margins
  const currentMargin = cost > 0 ? ((currentPrice - cost) / currentPrice) * 100 : 0;
  const targetMarginPercent = target_margin || 35;

  // Calculate recommended price based on target margin
  const recommendedPrice = cost > 0 
    ? cost / (1 - targetMarginPercent / 100)
    : currentPrice * 1.1; // 10% increase if no cost data

  // Adjust based on sales performance
  let adjustment = 1.0;
  if (sales_data.sales_trend === 'active' && sales_data.total_sold > 20) {
    adjustment = 1.05; // Increase price if selling well
  } else if (sales_data.sales_trend === 'slow' && sales_data.total_sold < 5) {
    adjustment = 0.95; // Decrease price if slow
  }

  const finalPrice = recommendedPrice * adjustment;

  return {
    recommended_price: Math.round(finalPrice * 100) / 100,
    minimum_price: Math.round((finalPrice * 0.85) * 100) / 100,
    maximum_price: Math.round((finalPrice * 1.15) * 100) / 100,
    pricing_tiers: [
      {
        tier: 'budget',
        price: Math.round((finalPrice * 0.9) * 100) / 100,
        margin: Math.round((targetMarginPercent - 10) * 100) / 100
      },
      {
        tier: 'standard',
        price: Math.round(finalPrice * 100) / 100,
        margin: targetMarginPercent
      },
      {
        tier: 'premium',
        price: Math.round((finalPrice * 1.1) * 100) / 100,
        margin: Math.round((targetMarginPercent + 10) * 100) / 100
      }
    ],
    reasoning: `Based on ${cost > 0 ? 'cost-based' : 'market-based'} pricing with ${targetMarginPercent}% target margin. Adjusted for sales performance.`,
    expected_impact: {
      sales_change: adjustment < 1 ? '+10%' : adjustment > 1 ? '-5%' : '0%',
      revenue_change: adjustment < 1 ? '+5%' : adjustment > 1 ? '+10%' : '0%'
    },
    margin_analysis: {
      current_margin: Math.round(currentMargin * 100) / 100,
      recommended_margin: targetMarginPercent,
      profit_increase: cost > 0 ? `+${Math.round(((targetMarginPercent - currentMargin) / currentMargin) * 100)}%` : 'N/A'
    }
  };
}

// Calculate pricing statistics
function calculatePricingStatistics(products) {
  const productsWithCost = products.filter(p => p.cost_per_item);
  const totalProducts = products.length;
  const productsWithCostCount = productsWithCost.length;

  const margins = productsWithCost.map(p => {
    const cost = parseFloat(p.cost_per_item);
    const price = parseFloat(p.price);
    return ((price - cost) / price) * 100;
  });

  const averageMargin = margins.length > 0
    ? margins.reduce((sum, m) => sum + m, 0) / margins.length
    : 0;

  const averagePrice = products.length > 0
    ? products.reduce((sum, p) => sum + parseFloat(p.price), 0) / products.length
    : 0;

  return {
    total_products: totalProducts,
    products_with_cost_data: productsWithCostCount,
    average_price: averagePrice,
    average_margin: averageMargin,
    margin_range: {
      min: margins.length > 0 ? Math.min(...margins) : 0,
      max: margins.length > 0 ? Math.max(...margins) : 0
    }
  };
}

// Generate pricing strategy recommendations
async function generatePricingStrategy(stats, storeName) {
  try {
    const model = getModel();

    const prompt = `Analyze pricing strategy for an e-commerce store.

Store: ${storeName}
Total Products: ${stats.total_products}
Products with Cost Data: ${stats.products_with_cost_data}
Average Price: $${stats.average_price.toFixed(2)}
Average Margin: ${stats.average_margin.toFixed(2)}%
Margin Range: ${stats.margin_range.min.toFixed(2)}% - ${stats.margin_range.max.toFixed(2)}%

Provide strategic pricing recommendations:
1. Overall pricing strategy (premium/competitive/budget)
2. Margin optimization suggestions
3. Products that need price adjustments
4. Competitive positioning advice
5. Revenue optimization opportunities

Format as JSON:
{
  "strategy": "competitive/premium/budget",
  "recommendations": ["rec1", "rec2"],
  "margin_optimization": "suggestions",
  "priority_actions": ["action1", "action2"]
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
      return generateBasicStrategy(stats);
    }
  } catch (error) {
    console.warn('AI Strategy failed:', error.message);
    return generateBasicStrategy(stats);
  }
}

function generateBasicStrategy(stats) {
  let strategy = 'competitive';
  if (stats.average_margin > 50) strategy = 'premium';
  if (stats.average_margin < 20) strategy = 'budget';

  return {
    strategy: strategy,
    recommendations: [
      `Current average margin is ${stats.average_margin.toFixed(2)}%`,
      stats.products_with_cost_data < stats.total_products * 0.5
        ? 'Add cost data for more accurate pricing'
        : 'Monitor competitor pricing regularly',
      'Review pricing quarterly based on sales performance'
    ],
    margin_optimization: stats.average_margin < 30
      ? 'Consider increasing prices to improve margins'
      : stats.average_margin > 60
        ? 'High margins - ensure competitive positioning'
        : 'Margins are balanced',
    priority_actions: [
      'Review products with margins outside optimal range',
      'Update pricing for slow-moving products',
      'Monitor sales velocity after price changes'
    ]
  };
}

module.exports = pricingController;

