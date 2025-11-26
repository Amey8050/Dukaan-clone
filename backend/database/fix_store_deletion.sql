-- Fix Store Deletion: Change order_items constraint to allow store deletion
-- This allows stores to be deleted even if products have orders
-- Order history is preserved (order_items remain, but product_id can be NULL)

-- Step 1: Make product_id nullable in order_items
ALTER TABLE order_items 
ALTER COLUMN product_id DROP NOT NULL;

-- Step 2: Drop the existing RESTRICT constraint
ALTER TABLE order_items 
DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- Step 3: Recreate with SET NULL (preserves order history)
ALTER TABLE order_items
ADD CONSTRAINT order_items_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES products(id) 
ON DELETE SET NULL;

-- Note: After this change:
-- - Stores can be deleted even if products have orders
-- - When a product is deleted, order_items.product_id becomes NULL
-- - Order history is preserved (order_items remain with product_name, price, etc.)
-- - Products with orders can be deleted (product_id in order_items becomes NULL)

