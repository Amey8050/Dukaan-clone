-- Performance optimization indexes for faster queries
-- Run this script in your Supabase SQL Editor to improve query performance

-- Indexes for orders table (used in sales analytics)
CREATE INDEX IF NOT EXISTS idx_orders_store_id_created_at 
ON orders(store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status 
ON orders(status);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
ON orders(payment_status);

-- Indexes for order_items table
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
ON order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product_id 
ON order_items(product_id);

-- Indexes for analytics_events table (used in traffic analytics)
CREATE INDEX IF NOT EXISTS idx_analytics_events_store_id_created_at 
ON analytics_events(store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type 
ON analytics_events(event_type);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id 
ON analytics_events(session_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id 
ON analytics_events(user_id);

-- Indexes for products table
CREATE INDEX IF NOT EXISTS idx_products_store_id 
ON products(store_id);

CREATE INDEX IF NOT EXISTS idx_products_status 
ON products(status);

CREATE INDEX IF NOT EXISTS idx_products_category_id 
ON products(category_id);

-- Indexes for stores table
CREATE INDEX IF NOT EXISTS idx_stores_owner_id 
ON stores(owner_id);

-- Indexes for inventory_changes table
CREATE INDEX IF NOT EXISTS idx_inventory_changes_product_id_created_at 
ON inventory_changes(product_id, created_at DESC);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_orders_store_status_created 
ON orders(store_id, status, created_at DESC);

-- Note: These indexes will speed up:
-- 1. Sales analytics queries (filtering by store_id and date range)
-- 2. Traffic analytics queries (filtering by store_id and date range)
-- 3. Product listing queries (filtering by store_id)
-- 4. Order listing queries (filtering by store_id and status)
-- 5. Inventory queries (filtering by product_id and date range)

