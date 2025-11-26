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

      // Get featured products
      const { data: featuredProducts, error: featuredError } = await supabaseAdmin
        .from('products')
        .select('id, name, price, images, short_description, featured, compare_at_price')
        .eq('store_id', storeId)
        .eq('status', 'active')
        .eq('featured', true)
        .limit(8)
        .order('created_at', { ascending: false });

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
          .gte('orders.created_at', daysAgo.toISOString());

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
            // Get products in same categories
            const { data: purchasedProducts } = await supabaseAdmin
              .from('products')
              .select('category_id, tags')
              .in('id', Array.from(purchasedProductIds))
              .limit(10);

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

      // Get new arrivals (recently added products)
      const { data: newArrivals, error: newArrivalsError } = await supabaseAdmin
        .from('products')
        .select('id, name, price, images, short_description, compare_at_price')
        .eq('store_id', storeId)
        .eq('status', 'active')
        .limit(8)
        .order('created_at', { ascending: false });

      // Get categories with product counts
      const { data: categories, error: categoriesError } = await supabaseAdmin
        .from('categories')
        .select('id, name, slug, image_url')
        .eq('store_id', storeId)
        .limit(8);

      // Get store statistics (if user is store owner)
      let storeStats = null;
      if (userId) {
        const { data: storeCheck } = await supabaseAdmin
          .from('stores')
          .select('owner_id')
          .eq('id', storeId)
          .single();

        if (storeCheck && storeCheck.owner_id === userId) {
          // Get basic stats
          const { count: productCount } = await supabaseAdmin
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', storeId)
            .eq('status', 'active');

          const { count: orderCount } = await supabaseAdmin
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', storeId)
            .eq('status', 'delivered');

          storeStats = {
            total_products: productCount || 0,
            total_orders: orderCount || 0
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
            categories: categories || []
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

