# Database Setup Guide

This guide will help you set up the Supabase database for the Dukaan Clone project.

## Prerequisites

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project in Supabase
3. Note down your project URL and API keys

## Setup Steps

### Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### Step 2: Update Environment Variables

Update your `backend/.env` file with the Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 3: Run Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `schema.sql`
4. Click **Run** to execute the SQL

This will create all the necessary tables, indexes, and triggers.

### Step 4: Set Up Row Level Security (RLS)

1. In the SQL Editor, copy and paste the contents of `rls_policies.sql`
2. Click **Run** to execute the SQL

This will enable RLS and set up security policies for all tables.

### Step 5: Set Up Storage Buckets

1. Go to **Storage** in your Supabase dashboard
2. Create the following buckets:
   - `product-images` - Public bucket for product images
   - `store-logos` - Public bucket for store logos
   - `store-banners` - Public bucket for store banners
   - `user-avatars` - Public bucket for user avatars

For each bucket:
- Set it as **Public**
- Enable **File size limit** (e.g., 5MB)
- Enable **Allowed MIME types** (image/jpeg, image/png, image/webp)

### Step 6: Test Database Connection

Run the backend server and test the connection:

```bash
cd backend
npm run dev
```

The server should start without errors. You can test the connection by making a request to `/health` endpoint.

## Database Schema Overview

### Core Tables

- **user_profiles** - User profile information (extends Supabase Auth)
- **stores** - Store information
- **categories** - Product categories
- **products** - Product information
- **product_variants** - Product variants (size, color, etc.)
- **cart** - Shopping cart
- **cart_items** - Cart items
- **orders** - Order information
- **order_items** - Order line items
- **reviews** - Product reviews and ratings
- **analytics_events** - Analytics tracking events
- **store_analytics** - Store analytics summary
- **notifications** - User notifications

## Security

- Row Level Security (RLS) is enabled on all tables
- Users can only access their own data
- Store owners can manage their stores and products
- Public can view active stores and products

## Notes

- The `user_profiles` table extends Supabase Auth users
- All timestamps use `TIMESTAMP WITH TIME ZONE`
- UUIDs are used for all primary keys
- Foreign keys have appropriate CASCADE/SET NULL behaviors
- Indexes are created for performance optimization

## Troubleshooting

### Connection Issues

- Verify your Supabase URL and keys are correct
- Check that your Supabase project is active
- Ensure your IP is not blocked (if using IP restrictions)

### RLS Policy Issues

- Make sure RLS policies are created correctly
- Check that users are authenticated when accessing protected data
- Verify the policies match your use case

### Migration Issues

- If tables already exist, you may need to drop them first (be careful!)
- Check for foreign key constraints before dropping tables
- Use `IF NOT EXISTS` clauses to avoid errors on re-runs

