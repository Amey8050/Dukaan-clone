const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../utils/supabaseClient');

// Test root endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoints available',
    endpoints: {
      dbConnection: '/api/test/db-connection',
      userProfile: '/api/test/user-profile (requires auth)',
      product: '/api/test/product/:id'
    }
  });
});

// Test database connection and tables
router.get('/db-connection', async (req, res, next) => {
  try {
    const tables = ['user_profiles', 'stores', 'notifications', 'products', 'cart', 'orders'];
    const results = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          results[table] = {
            exists: false,
            error: error.message,
            code: error.code
          };
        } else {
          results[table] = {
            exists: true,
            rowCount: data?.length || 0
          };
        }
      } catch (err) {
        results[table] = {
          exists: false,
          error: err.message
        };
      }
    }

    const missingTables = Object.keys(results).filter(t => !results[t].exists);
    
    res.json({
      success: missingTables.length === 0,
      message: missingTables.length === 0 
        ? 'All tables exist' 
        : `Missing tables: ${missingTables.join(', ')}`,
      tables: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Test user profile (requires authentication)
router.get('/user-profile', async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'No token provided. Please include a Bearer token in the Authorization header.'
        }
      });
    }

    const token = authHeader.split(' ')[1];
    const { supabase } = require('../utils/supabaseClient');
    
    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or expired token'
        }
      });
    }

    const userId = user.id;
    
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User profile not found',
          details: error.message,
          code: error.code,
          userId: userId
        }
      });
    }

    res.json({
      success: true,
      message: 'User profile found',
      data: {
        profile,
        userId
      }
    });
  } catch (error) {
    next(error);
  }
});

// Test product endpoint
router.get('/product/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { supabaseAdmin } = require('../utils/supabaseClient');
    
    console.log('Test product fetch:', { id });
    
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('id, name, store_id, status')
      .eq('id', id)
      .single();

    if (error) {
      return res.json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details
        },
        productId: id
      });
    }

    res.json({
      success: true,
      data: {
        product,
        productId: id
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

