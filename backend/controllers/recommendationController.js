// Recommendation Engine Controller
const { supabaseAdmin } = require('../utils/supabaseClient');
const { getModel, withTimeout } = require('../utils/geminiClient');

const recommendationController = {
  // Get product recommendations for a user
  getUserRecommendations: async (req, res, next) => {
    try {
      const { storeId } = req.params;
      const { limit = 10 } = req.query;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required'
          }
        });
      }

      // Get user's purchase history
      const { data: orders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select(`
          id,
          order_items (
            product_id,
            quantity
          )
        `)
        .eq('store_id', storeId)
        .eq('user_id', userId)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false })
        .limit(20);

      if (ordersError) {
        throw ordersError;
      }

      // Get user's viewed products (from analytics if available)
      const { data: views, error: viewsError } = await supabaseAdmin
        .from('analytics_events')
        .select('product_id')
        .eq('store_id', storeId)
        .eq('user_id', userId)
        .eq('event_type', 'product_view')
        .order('created_at', { ascending: false })
        .limit(50);

      // Extract product IDs from purchases and views
      const purchasedProductIds = new Set();
      orders?.forEach(order => {
        order.order_items?.forEach(item => {
          purchasedProductIds.add(item.product_id);
        });
      });

      const viewedProductIds = new Set(views?.map(v => v.product_id).filter(Boolean) || []);

      // Get recommendations based on user behavior
      const recommendations = await generateUserRecommendations(
        storeId,
        Array.from(purchasedProductIds),
        Array.from(viewedProductIds),
        parseInt(limit)
      );

      res.json({
        success: true,
        data: {
          store_id: storeId,
          recommendations: recommendations,
          count: recommendations.length,
          based_on: {
            purchases: purchasedProductIds.size,
            views: viewedProductIds.size
          }
        }
      });
    } catch (error) {
      console.error('User Recommendations Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to generate recommendations',
          details: error.message
        }
      });
    }
  },

  // Get product recommendations based on a specific product
  getProductRecommendations: async (req, res, next) => {
    try {
      const { storeId, productId } = req.params;
      const { limit = 8 } = req.query;

      // Get product details
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('id, name, description, category_id, tags, price')
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

      // Get similar products
      const recommendations = await generateProductBasedRecommendations(
        storeId,
        product,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: {
          product: {
            id: product.id,
            name: product.name
          },
          recommendations: recommendations,
          count: recommendations.length
        }
      });
    } catch (error) {
      console.error('Product Recommendations Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to generate product recommendations',
          details: error.message
        }
      });
    }
  },

  // Get popular/trending products
  getPopularProducts: async (req, res, next) => {
    try {
      const { storeId } = req.params;
      const { limit = 10, period = '30' } = req.query;

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));

      // Get products ordered by sales volume
      const { data: orderItems, error: itemsError } = await supabaseAdmin
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

      if (itemsError) {
        throw itemsError;
      }

      // Calculate product popularity
      const productSales = {};
      orderItems?.forEach(item => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = {
            quantity: 0,
            orders: 0
          };
        }
        productSales[item.product_id].quantity += item.quantity;
        productSales[item.product_id].orders += 1;
      });

      // Sort by quantity sold
      const sortedProducts = Object.entries(productSales)
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .slice(0, parseInt(limit))
        .map(([productId]) => productId);

      // Get product details
      const { data: products, error: productsError } = await supabaseAdmin
        .from('products')
        .select('id, name, price, images, short_description, featured')
        .eq('store_id', storeId)
        .eq('status', 'active')
        .in('id', sortedProducts);

      if (productsError) {
        throw productsError;
      }

      // Sort products to match popularity order
      const popularProducts = sortedProducts
        .map(id => products.find(p => p.id === id))
        .filter(Boolean)
        .map(product => ({
          ...product,
          sales_count: productSales[product.id].quantity,
          order_count: productSales[product.id].orders
        }));

      res.json({
        success: true,
        data: {
          store_id: storeId,
          period: parseInt(period),
          products: popularProducts,
          count: popularProducts.length
        }
      });
    } catch (error) {
      console.error('Popular Products Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch popular products',
          details: error.message
        }
      });
    }
  },

  // Get AI-powered personalized recommendations
  getAIPersonalizedRecommendations: async (req, res, next) => {
    try {
      const { storeId } = req.params;
      const { limit = 10 } = req.query;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required'
          }
        });
      }

      // Get user's purchase history with product details
      const { data: orders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select(`
          id,
          created_at,
          order_items (
            product_id,
            quantity,
            products (
              id,
              name,
              category_id,
              tags,
              price
            )
          )
        `)
        .eq('store_id', storeId)
        .eq('user_id', userId)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false })
        .limit(10);

      if (ordersError) {
        throw ordersError;
      }

      // Get all active products
      const { data: allProducts, error: productsError } = await supabaseAdmin
        .from('products')
        .select('id, name, description, category_id, tags, price, images, featured')
        .eq('store_id', storeId)
        .eq('status', 'active')
        .limit(100);

      if (productsError) {
        throw productsError;
      }

      // Extract purchased products
      const purchasedProducts = [];
      orders?.forEach(order => {
        order.order_items?.forEach(item => {
          if (item.products) {
            purchasedProducts.push(item.products);
          }
        });
      });

      // Use AI to generate personalized recommendations
      const recommendations = await generateAIPersonalizedRecommendations(
        purchasedProducts,
        allProducts || [],
        parseInt(limit)
      );

      res.json({
        success: true,
        data: {
          store_id: storeId,
          recommendations: recommendations,
          count: recommendations.length,
          based_on_purchases: purchasedProducts.length
        }
      });
    } catch (error) {
      console.error('AI Personalized Recommendations Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to generate AI recommendations',
          details: error.message
        }
      });
    }
  }
};

// Generate user-based recommendations
async function generateUserRecommendations(storeId, purchasedProductIds, viewedProductIds, limit) {
  // Get products similar to purchased/viewed products
  const referenceProductIds = [...purchasedProductIds, ...viewedProductIds].slice(0, 10);

  if (referenceProductIds.length === 0) {
    // If no history, return featured/popular products
    return getFeaturedProducts(storeId, limit);
  }

  // Get reference products
  const { data: referenceProducts, error: refError } = await supabaseAdmin
    .from('products')
    .select('id, category_id, tags')
    .in('id', referenceProductIds)
    .eq('store_id', storeId);

  if (refError || !referenceProducts || referenceProducts.length === 0) {
    return getFeaturedProducts(storeId, limit);
  }

  // Extract categories and tags
  const categories = new Set(referenceProducts.map(p => p.category_id).filter(Boolean));
  const tags = new Set();
  referenceProducts.forEach(p => {
    if (p.tags && Array.isArray(p.tags)) {
      p.tags.forEach(tag => tags.add(tag));
    }
  });

  // Find similar products
  let query = supabaseAdmin
    .from('products')
    .select('id, name, price, images, short_description, featured, category_id, tags')
    .eq('store_id', storeId)
    .eq('status', 'active')
    .not('id', 'in', `(${referenceProductIds.join(',')})`)
    .limit(limit * 2); // Get more to filter

  // Filter by category or tags
  if (categories.size > 0) {
    query = query.in('category_id', Array.from(categories));
  }

  const { data: candidates, error: candidatesError } = await query;

  if (candidatesError) {
    throw candidatesError;
  }

  // Filter out purchased/viewed products
  const filteredCandidates = (candidates || []).filter(
    p => !referenceProductIds.includes(p.id)
  );

  if (filteredCandidates.length === 0) {
    return getFeaturedProducts(storeId, limit);
  }

  // Score and rank products
  const scoredProducts = filteredCandidates.map(product => {
    let score = 0;
    
    // Category match
    if (categories.has(product.category_id)) {
      score += 3;
    }

    // Tag matches
    if (product.tags && Array.isArray(product.tags)) {
      const matchingTags = product.tags.filter(tag => tags.has(tag)).length;
      score += matchingTags;
    }

    // Featured boost
    if (product.featured) {
      score += 2;
    }

    return { ...product, score };
  });

  // Sort by score and return top results
  return scoredProducts
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score, ...product }) => product);
}

// Generate product-based recommendations
async function generateProductBasedRecommendations(storeId, product, limit) {
  // Find products in same category
  let query = supabaseAdmin
    .from('products')
    .select('id, name, price, images, short_description, featured, category_id, tags')
    .eq('store_id', storeId)
    .eq('status', 'active')
    .neq('id', product.id)
    .limit(limit * 2);

  if (product.category_id) {
    query = query.eq('category_id', product.category_id);
  }

  const { data: candidates, error: candidatesError } = await query;

  if (candidatesError || !candidates || candidates.length === 0) {
    return getFeaturedProducts(storeId, limit);
  }

  // Score by similarity
  const productTags = new Set(product.tags || []);
  const scoredProducts = candidates.map(candidate => {
    let score = 0;

    // Same category
    if (candidate.category_id === product.category_id) {
      score += 5;
    }

    // Tag overlap
    if (candidate.tags && Array.isArray(candidate.tags)) {
      const matchingTags = candidate.tags.filter(tag => productTags.has(tag)).length;
      score += matchingTags * 2;
    }

    // Price similarity (within 20%)
    const priceDiff = Math.abs(candidate.price - product.price) / product.price;
    if (priceDiff < 0.2) {
      score += 2;
    }

    // Featured boost
    if (candidate.featured) {
      score += 1;
    }

    return { ...candidate, score };
  });

  return scoredProducts
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score, ...product }) => product);
}

// Get featured products as fallback
async function getFeaturedProducts(storeId, limit) {
  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('id, name, price, images, short_description, featured')
    .eq('store_id', storeId)
    .eq('status', 'active')
    .eq('featured', true)
    .limit(limit);

  if (error || !products || products.length === 0) {
    // Fallback to any active products
    const { data: fallback } = await supabaseAdmin
      .from('products')
      .select('id, name, price, images, short_description, featured')
      .eq('store_id', storeId)
      .eq('status', 'active')
      .limit(limit)
      .order('created_at', { ascending: false });

    return fallback || [];
  }

  return products;
}

// Generate AI-powered personalized recommendations
async function generateAIPersonalizedRecommendations(purchasedProducts, allProducts, limit) {
  try {
    const model = getModel();

    if (purchasedProducts.length === 0) {
      // Return featured products if no purchase history
      return allProducts.filter(p => p.featured).slice(0, limit);
    }

    const purchasedNames = purchasedProducts.map(p => p.name).join(', ');
    const productList = allProducts
      .slice(0, 50) // Limit for AI processing
      .map(p => `${p.name} ($${p.price})`)
      .join(', ');

    const prompt = `Based on a user's purchase history, recommend products they might like.

User's Purchased Products:
${purchasedNames}

Available Products:
${productList}

Analyze the user's preferences and recommend ${limit} products they would likely be interested in.
Consider:
- Product categories and types
- Price ranges
- Similar products
- Complementary products

Return a JSON array of product names (exact matches from the available products list):
["Product Name 1", "Product Name 2", ...]`;

    // Use timeout (15 seconds for recommendations)
    const result = await withTimeout(model.generateContent(prompt), 15000);
    const response = await result.response;
    const aiResponse = response.text();

    // Extract product names from AI response
    let recommendedNames = [];
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendedNames = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      // Fallback: extract names from text
      recommendedNames = aiResponse
        .split('\n')
        .map(line => line.replace(/[0-9]+\.\s*/, '').replace(/["\[\]]/g, '').trim())
        .filter(name => name.length > 0)
        .slice(0, limit);
    }

    // Match recommended names to products
    const recommendedProducts = recommendedNames
      .map(name => allProducts.find(p => 
        p.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(p.name.toLowerCase())
      ))
      .filter(Boolean)
      .slice(0, limit);

    // Fill remaining slots with featured products
    if (recommendedProducts.length < limit) {
      const remaining = limit - recommendedProducts.length;
      const featured = allProducts
        .filter(p => p.featured && !recommendedProducts.find(rp => rp.id === p.id))
        .slice(0, remaining);
      recommendedProducts.push(...featured);
    }

    return recommendedProducts.slice(0, limit);
  } catch (error) {
    console.warn('AI Recommendations failed, using fallback:', error.message);
    // Fallback to featured products
    return allProducts.filter(p => p.featured).slice(0, limit);
  }
}

module.exports = recommendationController;

