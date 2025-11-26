-- ============================================
-- PRODUCT DELETION SOLUTIONS
-- ============================================
-- Choose ONE of the following approaches based on your business requirements

-- ============================================
-- SOLUTION 1: CASCADE DELETE
-- ============================================
-- This will automatically delete order_items when a product is deleted
-- WARNING: This will lose order history data!
-- Use only if you want to completely remove products and their order history

-- Drop the existing constraint
ALTER TABLE order_items 
DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- Recreate with CASCADE
ALTER TABLE order_items
ADD CONSTRAINT order_items_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES products(id) 
ON DELETE CASCADE;

-- ============================================
-- SOLUTION 2: SET NULL (Preserve Order History)
-- ============================================
-- This keeps order_items but sets product_id to NULL
-- Better for preserving order history while allowing product deletion

-- Drop the existing constraint
ALTER TABLE order_items 
DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- Recreate with SET NULL (but product_id is NOT NULL, so we need to make it nullable first)
ALTER TABLE order_items 
ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE order_items
ADD CONSTRAINT order_items_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES products(id) 
ON DELETE SET NULL;

-- ============================================
-- SOLUTION 3: KEEP RESTRICT (Recommended)
-- ============================================
-- Keep the current RESTRICT constraint and handle deletion in backend code
-- This is the safest approach - prevents accidental data loss
-- No SQL changes needed - handle in application code (see productController.js)

-- ============================================
-- SOLUTION 4: SOFT DELETE (Recommended for Production)
-- ============================================
-- Add deleted_at column for soft delete functionality
-- This preserves all data while "hiding" deleted products

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) 
WHERE deleted_at IS NULL;

-- Update existing queries to filter out soft-deleted products:
-- SELECT * FROM products WHERE deleted_at IS NULL;

