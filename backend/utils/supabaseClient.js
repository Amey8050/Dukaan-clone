const { createClient } = require('@supabase/supabase-js');
const config = require('../config/config');

// Validate Supabase configuration
if (!config.supabase.url || !config.supabase.anonKey || !config.supabase.serviceRoleKey) {
  console.error('\n❌ ERROR: Supabase configuration is missing!');
  console.error('\nPlease create a .env file in the backend directory with the following variables:');
  console.error('\nSUPABASE_URL=https://your-project.supabase.co');
  console.error('SUPABASE_ANON_KEY=your-anon-key');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.error('\nSee backend/database/README.md for setup instructions.\n');
  process.exit(1);
}

// Validate URL format
if (!config.supabase.url.startsWith('https://') || !config.supabase.url.includes('.supabase.co')) {
  console.error('\n❌ ERROR: Invalid Supabase URL format!');
  console.error('Expected format: https://your-project.supabase.co');
  console.error('Current value:', config.supabase.url);
  process.exit(1);
}

// Create Supabase client with error handling
let supabase;
let supabaseAdmin;

try {
  supabase = createClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      auth: {
        persistSession: false, // Don't persist session on server
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );

  supabaseAdmin = createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );
  
  console.log('✅ Supabase clients initialized successfully');
} catch (error) {
  console.error('\n❌ ERROR: Failed to create Supabase clients!');
  console.error('Error:', error.message);
  console.error('\nPlease check your Supabase credentials in .env file.\n');
  process.exit(1);
}

module.exports = {
  supabase,
  supabaseAdmin
};

