// Promo Suggestions Controller
const { supabaseAdmin } = require('../utils/supabaseClient');
const { getModel, withTimeout } = require('../utils/geminiClient');

const promoController = {
  // Get promotional suggestions for a store
  getPromoSuggestions: async (req, res, next) => {
    try {
      const { storeId } = req.params;
      const { type = 'all' } = req.query; // all, discounts, bundles, flash_sales

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

      // Get store products with sales and inventory data
      const productsData = await getProductsWithSalesData(storeId);

      // Get slow-moving products
      const slowMovingProducts = productsData.filter(
        p => p.sales_count < 5 && p.inventory_quantity > 0
      );

      // Get low stock products
      const lowStockProducts = productsData.filter(
        p => p.inventory_quantity <= p.low_stock_threshold && p.inventory_quantity > 0
      );

      // Get high-performing products
      const highPerformingProducts = productsData
        .filter(p => p.sales_count > 10)
        .sort((a, b) => b.sales_count - a.sales_count)
        .slice(0, 10);

      // Generate AI-powered promo suggestions
      const suggestions = await generatePromoSuggestions({
        storeName: store.name,
        products: productsData,
        slowMoving: slowMovingProducts,
        lowStock: lowStockProducts,
        highPerforming: highPerformingProducts,
        type: type
      });

      res.json({
        success: true,
        data: {
          store: {
            id: store.id,
            name: store.name
          },
          suggestions: suggestions,
          statistics: {
            total_products: productsData.length,
            slow_moving: slowMovingProducts.length,
            low_stock: lowStockProducts.length,
            high_performing: highPerformingProducts.length
          }
        }
      });
    } catch (error) {
      console.error('Promo Suggestions Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to generate promo suggestions',
          details: error.message
        }
      });
    }
  },

  // Get product-specific promo suggestions
  getProductPromoSuggestions: async (req, res, next) => {
    try {
      const { productId } = req.params;

      // Get product details
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select(`
          id,
          name,
          price,
          cost_per_item,
          inventory_quantity,
          low_stock_threshold,
          store_id,
          stores!inner (
            id,
            owner_id,
            name
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

      // Get product sales data
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - 30);

      const { data: orderItems } = await supabaseAdmin
        .from('order_items')
        .select(`
          quantity,
          orders!inner (
            store_id,
            status,
            created_at
          )
        `)
        .eq('product_id', productId)
        .eq('orders.store_id', product.stores.id)
        .eq('orders.status', 'delivered')
        .gte('orders.created_at', daysAgo.toISOString());

      const totalSold = orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

      // Generate product-specific promo suggestions
      const suggestions = await generateProductPromoSuggestions({
        product: {
          name: product.name,
          price: parseFloat(product.price),
          cost: product.cost_per_item ? parseFloat(product.cost_per_item) : null,
          inventory: product.inventory_quantity,
          threshold: product.low_stock_threshold
        },
        sales: {
          total_sold: totalSold,
          period_days: 30
        }
      });

      res.json({
        success: true,
        data: {
          product: {
            id: product.id,
            name: product.name,
            current_price: parseFloat(product.price)
          },
          suggestions: suggestions
        }
      });
    } catch (error) {
      console.error('Product Promo Suggestions Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to generate product promo suggestions',
          details: error.message
        }
      });
    }
  }
};

// Helper function to get products with sales data
async function getProductsWithSalesData(storeId) {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - 30);

  // Get products
  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, name, price, inventory_quantity, low_stock_threshold, track_inventory, status')
    .eq('store_id', storeId)
    .eq('status', 'active');

  if (productsError || !products) {
    return [];
  }

  // Get sales data
  const { data: orderItems } = await supabaseAdmin
    .from('order_items')
    .select(`
      product_id,
      quantity,
      orders!inner (
        store_id,
        status,
        created_at
      )
    `)
    .eq('orders.store_id', storeId)
    .eq('orders.status', 'delivered')
    .gte('orders.created_at', daysAgo.toISOString());

  // Calculate sales per product
  const productSales = {};
  orderItems?.forEach(item => {
    if (!productSales[item.product_id]) {
      productSales[item.product_id] = 0;
    }
    productSales[item.product_id] += item.quantity;
  });

  // Combine products with sales data
  return products.map(product => ({
    ...product,
    sales_count: productSales[product.id] || 0,
    inventory_quantity: product.track_inventory ? product.inventory_quantity : null
  }));
}

// Generate AI-powered promo suggestions
async function generatePromoSuggestions(data) {
  try {
    const model = getModel();

    const {
      storeName,
      products,
      slowMoving,
      lowStock,
      highPerforming,
      type
    } = data;

    const prompt = `Analyze e-commerce store data and provide promotional campaign suggestions.

Store: ${storeName}
Total Products: ${products.length}
Slow-Moving Products: ${slowMoving.length}
Low Stock Products: ${lowStock.length}
High-Performing Products: ${highPerforming.length}

Slow-Moving Products (need promotion):
${slowMoving.slice(0, 5).map(p => `- ${p.name}: $${p.price}, Stock: ${p.inventory_quantity}, Sold: ${p.sales_count}`).join('\n')}

Low Stock Products (clear inventory):
${lowStock.slice(0, 5).map(p => `- ${p.name}: $${p.price}, Stock: ${p.inventory_quantity}`).join('\n')}

High-Performing Products (leverage for bundles):
${highPerforming.slice(0, 5).map(p => `- ${p.name}: $${p.price}, Sold: ${p.sales_count}`).join('\n')}

Generate promotional suggestions:
1. Discount campaigns for slow-moving products
2. Flash sales for low stock items
3. Bundle deals using high-performing products
4. Seasonal promotions
5. Cross-selling opportunities

Format as JSON:
{
  "discount_campaigns": [
    {
      "product_id": "uuid",
      "product_name": "Product Name",
      "current_price": 29.99,
      "suggested_discount": 20,
      "discounted_price": 23.99,
      "reason": "Slow-moving inventory",
      "expected_impact": "Clear inventory, boost sales"
    }
  ],
  "flash_sales": [
    {
      "product_id": "uuid",
      "product_name": "Product Name",
      "suggested_discount": 30,
      "duration": "48 hours",
      "reason": "Low stock clearance"
    }
  ],
  "bundle_deals": [
    {
      "products": ["Product 1", "Product 2"],
      "bundle_price": 49.99,
      "savings": 10.00,
      "reason": "Complementary products"
    }
  ],
  "marketing_strategies": [
    "Strategy 1",
    "Strategy 2"
  ]
}`;

    // Use timeout (18 seconds for complex promo analysis)
    const result = await withTimeout(model.generateContent(prompt), 18000);
    const response = await result.response;
    const aiResponse = response.text();

    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(aiResponse);
    } catch (parseError) {
      return generateBasicPromoSuggestions(data);
    }
  } catch (error) {
    console.warn('AI Promo Suggestions failed, using basic calculations:', error.message);
    return generateBasicPromoSuggestions(data);
  }
}

// Generate product-specific promo suggestions
async function generateProductPromoSuggestions(data) {
  try {
    const model = getModel();

    const { product, sales } = data;

    const prompt = `Analyze a product and suggest promotional strategies.

Product: ${product.name}
Current Price: $${product.price}
${product.cost ? `Cost: $${product.cost}` : ''}
Inventory: ${product.inventory}
Low Stock Threshold: ${product.threshold}
Sold in Last 30 Days: ${sales.total_sold}

Suggest promotional strategies:
1. Discount percentage recommendations
2. Flash sale opportunities
3. Bundle opportunities
4. Marketing angles
5. Timing suggestions

Format as JSON:
{
  "discount_recommendations": [
    {
      "discount_percent": 15,
      "new_price": 25.49,
      "reason": "Boost slow sales",
      "duration": "1 week"
    }
  ],
  "flash_sale": {
    "recommended": true,
    "discount_percent": 25,
    "duration": "48 hours",
    "reason": "Clear inventory"
  },
  "bundle_suggestions": [
    "Bundle with complementary products",
    "Create value packs"
  ],
  "marketing_angles": [
    "Highlight unique features",
    "Limited time offer"
  ]
}`;

    // Use timeout (18 seconds for complex promo analysis)
    const result = await withTimeout(model.generateContent(prompt), 18000);
    const response = await result.response;
    const aiResponse = response.text();

    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(aiResponse);
    } catch (parseError) {
      return generateBasicProductPromoSuggestions(data);
    }
  } catch (error) {
    console.warn('AI Product Promo failed:', error.message);
    return generateBasicProductPromoSuggestions(data);
  }
}

// Fallback: Basic promo suggestions
function generateBasicPromoSuggestions(data) {
  const { slowMoving, lowStock, highPerforming } = data;

  const discountCampaigns = slowMoving.slice(0, 5).map(product => ({
    product_id: product.id,
    product_name: product.name,
    current_price: parseFloat(product.price),
    suggested_discount: 20,
    discounted_price: Math.round(parseFloat(product.price) * 0.8 * 100) / 100,
    reason: 'Slow-moving inventory - needs promotion',
    expected_impact: 'Clear inventory, boost sales by 30-50%'
  }));

  const flashSales = lowStock.slice(0, 3).map(product => ({
    product_id: product.id,
    product_name: product.name,
    current_price: parseFloat(product.price),
    suggested_discount: 30,
    discounted_price: Math.round(parseFloat(product.price) * 0.7 * 100) / 100,
    duration: '48 hours',
    reason: 'Low stock clearance - urgent promotion needed',
    expected_impact: 'Clear remaining inventory quickly'
  }));

  const bundleDeals = highPerforming.length >= 2 ? [{
    products: highPerforming.slice(0, 2).map(p => p.name),
    bundle_price: Math.round(
      (parseFloat(highPerforming[0].price) + parseFloat(highPerforming[1].price)) * 0.85 * 100
    ) / 100,
    savings: Math.round(
      (parseFloat(highPerforming[0].price) + parseFloat(highPerforming[1].price)) * 0.15 * 100
    ) / 100,
    reason: 'High-performing products - create value bundle',
    expected_impact: 'Increase average order value'
  }] : [];

  return {
    discount_campaigns: discountCampaigns,
    flash_sales: flashSales,
    bundle_deals: bundleDeals,
    marketing_strategies: [
      'Run email campaigns for slow-moving products',
      'Create social media posts for flash sales',
      'Highlight bundle deals on homepage',
      'Use retargeting ads for abandoned carts'
    ]
  };
}

function generateBasicProductPromoSuggestions(data) {
  const { product, sales } = data;
  const currentPrice = product.price;
  const isSlowMoving = sales.total_sold < 5;
  const isLowStock = product.inventory <= product.threshold;

  const recommendations = [];

  if (isSlowMoving) {
    recommendations.push({
      discount_percent: 20,
      new_price: Math.round(currentPrice * 0.8 * 100) / 100,
      reason: 'Slow sales - boost with discount',
      duration: '1 week',
      expected_impact: 'Increase sales by 40-60%'
    });
  }

  if (isLowStock) {
    recommendations.push({
      discount_percent: 30,
      new_price: Math.round(currentPrice * 0.7 * 100) / 100,
      reason: 'Low stock - clear inventory',
      duration: '48 hours',
      expected_impact: 'Clear remaining stock quickly'
    });
  }

  return {
    discount_recommendations: recommendations.length > 0 ? recommendations : [{
      discount_percent: 10,
      new_price: Math.round(currentPrice * 0.9 * 100) / 100,
      reason: 'General promotion to boost sales',
      duration: '1 week',
      expected_impact: 'Increase visibility and sales'
    }],
    flash_sale: {
      recommended: isLowStock || isSlowMoving,
      discount_percent: isLowStock ? 30 : 20,
      duration: '48 hours',
      reason: isLowStock ? 'Clear low stock' : 'Boost slow sales'
    },
    bundle_suggestions: [
      'Bundle with complementary products',
      'Create value packs with related items',
      'Offer "Buy 2 Get 1" deals'
    ],
    marketing_angles: [
      'Limited time offer',
      'Best seller',
      'Customer favorite',
      'Special promotion'
    ]
  };
}

module.exports = promoController;

