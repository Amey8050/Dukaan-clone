// Admin Controller - Platform-wide administration
const { supabaseAdmin } = require('../utils/supabaseClient');

const adminController = {
  // Get platform overview statistics
  getOverview: async (req, res, next) => {
    try {
      // Get total counts
      const [
        { count: totalUsers },
        { count: totalStores },
        { count: totalProducts },
        { count: totalOrders }
      ] = await Promise.all([
        supabaseAdmin.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('stores').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('products').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('orders').select('*', { count: 'exact', head: true })
      ]);

      // Get active stores count
      const { count: activeStores } = await supabaseAdmin
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get recent users (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: recentUsers } = await supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      // Get total revenue from orders
      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed');
      
      const totalRevenue = orders?.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0) || 0;

      res.json({
        success: true,
        data: {
          overview: {
            totalUsers: totalUsers || 0,
            totalStores: totalStores || 0,
            activeStores: activeStores || 0,
            totalProducts: totalProducts || 0,
            totalOrders: totalOrders || 0,
            totalRevenue: totalRevenue,
            recentUsers: recentUsers || 0
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all users with pagination
  getUsers: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const search = req.query.search || '';

      let query = supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      }

      const { data: users, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.json({
        success: true,
        data: {
          users: users || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all stores with pagination
  getStores: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const search = req.query.search || '';

      let query = supabaseAdmin
        .from('stores')
        .select(`
          *,
          owner:user_profiles!owner_id(id, email, full_name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      const { data: stores, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.json({
        success: true,
        data: {
          stores: stores || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all orders with pagination
  getOrders: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const status = req.query.status;

      let query = supabaseAdmin
        .from('orders')
        .select(`
          *,
          store:stores!orders_store_id_fkey(id, name, slug),
          customer:user_profiles!orders_customer_id_fkey(id, email, full_name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: orders, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.json({
        success: true,
        data: {
          orders: orders || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all products with pagination
  getProducts: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const search = req.query.search || '';

      let query = supabaseAdmin
        .from('products')
        .select(`
          *,
          store:stores!products_store_id_fkey(id, name, slug)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data: products, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.json({
        success: true,
        data: {
          products: products || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update user role
  updateUserRole: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!role || !['user', 'store_owner', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid role. Must be: user, store_owner, or admin'
          }
        });
      }

      const { data: user, error } = await supabaseAdmin
        .from('user_profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  },

  // Toggle store active status
  toggleStoreStatus: async (req, res, next) => {
    try {
      const { storeId } = req.params;
      const { is_active } = req.body;

      const { data: store, error } = await supabaseAdmin
        .from('stores')
        .update({ is_active: is_active !== undefined ? is_active : true })
        .eq('id', storeId)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        message: `Store ${store.is_active ? 'activated' : 'deactivated'} successfully`,
        data: { store }
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete user
  deleteUser: async (req, res, next) => {
    try {
      const { userId } = req.params;

      // Check if user exists
      const { data: user, error: fetchError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, email')
        .eq('id', userId)
        .single();

      if (fetchError || !user) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'User not found'
          }
        });
      }

      // Delete user (cascade will handle related data)
      const { error: deleteError } = await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (deleteError) throw deleteError;

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete store
  deleteStore: async (req, res, next) => {
    try {
      const { storeId } = req.params;

      // Check if store exists
      const { data: store, error: fetchError } = await supabaseAdmin
        .from('stores')
        .select('id, name')
        .eq('id', storeId)
        .single();

      if (fetchError || !store) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Store not found'
          }
        });
      }

      // Delete store (cascade will handle related data)
      const { error: deleteError } = await supabaseAdmin
        .from('stores')
        .delete()
        .eq('id', storeId);

      if (deleteError) throw deleteError;

      res.json({
        success: true,
        message: 'Store deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = adminController;

