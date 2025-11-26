# Store Deletion Fix

## Problem
Stores cannot be deleted if they have products with orders due to `ON DELETE RESTRICT` constraint on `order_items.product_id`.

## Solution

### Option 1: Run SQL Migration (Recommended)
Run the SQL script to change the constraint:

```sql
-- Run this in Supabase SQL Editor
-- File: backend/database/fix_store_deletion.sql
```

This changes `order_items.product_id` from `ON DELETE RESTRICT` to `ON DELETE SET NULL`, which:
- ✅ Allows store deletion even with products that have orders
- ✅ Preserves order history (order_items remain)
- ✅ Sets product_id to NULL when products are deleted (order data preserved)

### Option 2: Current Code Behavior
The current code will:
1. Archive products with orders before deletion
2. Try to delete the store
3. If deletion fails due to RESTRICT constraint, return error

**After running the SQL migration, store deletion will work automatically!**

## How It Works

### Before SQL Migration:
- Store deletion fails if products have orders (RESTRICT constraint)
- Error: "Cannot delete store due to existing relationships"

### After SQL Migration:
- Store deletion succeeds
- Products with orders are archived first (good practice)
- Products are deleted via CASCADE
- Order history preserved (order_items.product_id becomes NULL)

## Steps to Enable Store Deletion

1. **Run the SQL migration:**
   ```sql
   -- Copy and run: backend/database/fix_store_deletion.sql
   ```

2. **Test store deletion:**
   - Try deleting a store with products that have orders
   - Should succeed now ✅

3. **Verify order history:**
   - Check `order_items` table
   - `product_id` should be NULL for deleted products
   - Order data (product_name, price, quantity) remains intact

## Benefits

- ✅ Stores can be deleted regardless of orders
- ✅ Order history is preserved
- ✅ No data loss
- ✅ Clean deletion process

