// Personalized Homepage Controller
const { supabaseAdmin } = require('../utils/supabaseClient');

const homepageController = {
  // Get personalized homepage data
  getPersonalizedHomepage: async (req, res, next) => {
    try {
      const { storeId } = req.params;
      const userId = req.userId; // Optional, from optionalAuth middleware

      // Verify store exists
      const { data: store, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id, name, slug, description, logo_url, banner_url, theme_color, is_active')
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

      // Check if store is active (only block if not owner)
      if (!store.is_active) {
        const userId = req.userId;
        // Allow store owner to view even if inactive
        if (!userId || store.owner_id !== userId) {
          return res.status(404).json({
            success: false,
            error: {
              message: 'Store not found or inactive'
            }
          });
        }
      }

      // OPTIMIZED: Load independent data in parallel for faster response
      const [
        featuredProductsResult,
        newArrivalsResult,
        categoriesResult
      ] = await Promise.all([
        // Get featured products
        supabaseAdmin
          .from('products')
          .select('id, name, price, images, short_description, featured, compare_at_price')
          .eq('store_id', storeId)
          .eq('status', 'active')
          .eq('featured', true)
          .limit(8)
          .order('created_at', { ascending: false }),
        
        // Get new arrivals (recently added products)
        supabaseAdmin
          .from('products')
          .select('id, name, price, images, short_description, compare_at_price')
          .eq('store_id', storeId)
          .eq('status', 'active')
          .limit(8)
          .order('created_at', { ascending: false }),
        
        // Get categories
        supabaseAdmin
          .from('categories')
          .select('id, name, slug, image_url')
          .eq('store_id', storeId)
          .limit(8)
      ]);

      const featuredProducts = featuredProductsResult.data || [];
      const newArrivals = newArrivalsResult.data || [];
      const categories = categoriesResult.data || [];

      // Get product counts per category
      const categoryCounts = {};
      if (categories && categories.length > 0) {
        const categoryIds = categories.map(cat => cat.id);
        
        // Get product counts for each category
        const countPromises = categoryIds.map(async (categoryId) => {
          const { count } = await supabaseAdmin
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', storeId)
            .eq('category_id', categoryId)
            .eq('status', 'active');
          return { categoryId, count: count || 0 };
        });
        
        const counts = await Promise.all(countPromises);
        counts.forEach(({ categoryId, count }) => {
          categoryCounts[categoryId] = count;
        });
      }

      // Attach product counts to categories
      const categoriesWithCounts = categories.map(category => ({
        ...category,
        product_count: categoryCounts[category.id] || 0
      }));

      // Get popular products (based on sales)
      let popularProducts = [];
      try {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - 30);

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
          .gte('orders.created_at', daysAgo.toISOString())
          .limit(1000); // Limit to prevent huge queries

        if (orderItems && orderItems.length > 0) {
          const productSales = {};
          orderItems.forEach(item => {
            if (!productSales[item.product_id]) {
              productSales[item.product_id] = { quantity: 0 };
            }
            productSales[item.product_id].quantity += item.quantity;
          });

          const sortedProductIds = Object.entries(productSales)
            .sort((a, b) => b[1].quantity - a[1].quantity)
            .slice(0, 8)
            .map(([id]) => id);

          if (sortedProductIds.length > 0) {
            const { data: products } = await supabaseAdmin
              .from('products')
              .select('id, name, price, images, short_description, featured, compare_at_price')
              .eq('store_id', storeId)
              .eq('status', 'active')
              .in('id', sortedProductIds);

            popularProducts = sortedProductIds
              .map(id => products.find(p => p.id === id))
              .filter(Boolean);
          }
        }
      } catch (error) {
        console.warn('Failed to get popular products:', error.message);
      }

      // Get personalized recommendations if user is authenticated
      let personalizedRecommendations = [];
      if (userId) {
        try {
          // Get user's purchase history
          const { data: orders } = await supabaseAdmin
            .from('orders')
            .select(`
              order_items (
                product_id
              )
            `)
            .eq('store_id', storeId)
            .eq('user_id', userId)
            .eq('status', 'delivered')
            .limit(10);

          const purchasedProductIds = new Set();
          orders?.forEach(order => {
            order.order_items?.forEach(item => {
              purchasedProductIds.add(item.product_id);
            });
          });

          if (purchasedProductIds.size > 0) {
            // Get products in same categories (limit to prevent huge queries)
            const idsArray = Array.from(purchasedProductIds).slice(0, 50); // Limit to 50 products
            const { data: purchasedProducts } = await supabaseAdmin
              .from('products')
              .select('category_id, tags')
              .in('id', idsArray)
              .limit(50);

            const categories = new Set(purchasedProducts?.map(p => p.category_id).filter(Boolean) || []);
            const tags = new Set();
            purchasedProducts?.forEach(p => {
              if (p.tags && Array.isArray(p.tags)) {
                p.tags.forEach(tag => tags.add(tag));
              }
            });

            // Find similar products
            let query = supabaseAdmin
              .from('products')
              .select('id, name, price, images, short_description, featured, compare_at_price')
              .eq('store_id', storeId)
              .eq('status', 'active')
              .limit(20); // Get more to filter

            if (categories.size > 0) {
              query = query.in('category_id', Array.from(categories));
            }

            const { data: allCandidates } = await query;
            
            // Filter out purchased products
            const candidates = (allCandidates || []).filter(
              p => !purchasedProductIds.has(p.id)
            );
            if (candidates && candidates.length > 0) {
              // Score products
              const scored = candidates.map(product => {
                let score = categories.has(product.category_id) ? 3 : 0;
                if (product.featured) score += 2;
                return { ...product, score };
              });

              personalizedRecommendations = scored
                .sort((a, b) => b.score - a.score)
                .slice(0, 8)
                .map(({ score, ...product }) => product);
            }
          }
        } catch (error) {
          console.warn('Failed to get personalized recommendations:', error.message);
        }
      }


      // Get products grouped by category - OPTIMIZED: Single query instead of N+1
      const productsByCategory = {};
      if (categoriesWithCounts && categoriesWithCounts.length > 0) {
        const categoryIds = categoriesWithCounts.map(cat => cat.id);
        
        // Fetch all products for all categories in a single query
        const { data: allCategoryProducts } = await supabaseAdmin
          .from('products')
          .select('id, name, price, images, short_description, featured, compare_at_price, category_id, created_at')
          .eq('store_id', storeId)
          .eq('status', 'active')
          .in('category_id', categoryIds)
          .order('created_at', { ascending: false });

        // Group products by category
        const productsMap = new Map();
        if (allCategoryProducts && allCategoryProducts.length > 0) {
          allCategoryProducts.forEach(product => {
            if (!productsMap.has(product.category_id)) {
              productsMap.set(product.category_id, []);
            }
            const categoryProducts = productsMap.get(product.category_id);
            if (categoryProducts.length < 6) { // Limit to 6 products per category
              categoryProducts.push(product);
            }
          });
        }

        // Build productsByCategory object
        categoriesWithCounts.forEach(category => {
          const categoryProducts = productsMap.get(category.id) || [];
          if (categoryProducts.length > 0) {
            productsByCategory[category.id] = {
              category: category,
              products: categoryProducts
            };
          }
        });
      }

      // Get store statistics (if user is store owner)
      let storeStats = null;
      if (userId) {
        const { data: storeCheck } = await supabaseAdmin
          .from('stores')
          .select('owner_id')
          .eq('id', storeId)
          .single();

        if (storeCheck && storeCheck.owner_id === userId) {
          // OPTIMIZED: Get basic stats in parallel
          const [productCountResult, orderCountResult] = await Promise.all([
            supabaseAdmin
              .from('products')
              .select('id', { count: 'exact', head: true })
              .eq('store_id', storeId)
              .eq('status', 'active'),
            supabaseAdmin
              .from('orders')
              .select('id', { count: 'exact', head: true })
              .eq('store_id', storeId)
              .eq('status', 'delivered')
          ]);

          storeStats = {
            total_products: productCountResult.count || 0,
            total_orders: orderCountResult.count || 0
          };
        }
      }

      res.json({
        success: true,
        data: {
          store: {
            id: store.id,
            name: store.name,
            slug: store.slug,
            description: store.description,
            logo_url: store.logo_url,
            banner_url: store.banner_url,
            theme_color: store.theme_color
          },
          sections: {
            featured: featuredProducts || [],
            popular: popularProducts,
            personalized: personalizedRecommendations,
            new_arrivals: newArrivals || [],
            categories: categoriesWithCounts || [],
            products_by_category: productsByCategory || {}
          },
          is_authenticated: !!userId,
          is_store_owner: storeStats !== null,
          store_stats: storeStats
        }
      });
    } catch (error) {
      console.error('Personalized Homepage Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to load homepage data',
          details: error.message
        }
      });
    }
  }
};

module.exports = homepageController;

