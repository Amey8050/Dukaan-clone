# Product Deletion Guide

This guide explains different approaches to handle product deletion when products have foreign key relationships with `order_items`.

## Problem

When trying to delete a product that has orders, PostgreSQL throws:
```
"update or delete on table \"products\" violates foreign key constraint \"order_items_product_id_fkey\" on table \"order_items\""
```

This happens because `order_items.product_id` has `ON DELETE RESTRICT` constraint (line 162 in `schema.sql`).

---

## Solutions

### Solution 1: Prevent Deletion (Current Implementation) ✅ **RECOMMENDED**

**What it does:** Checks for orders before deletion and prevents deletion if orders exist.

**Pros:**
- Preserves order history
- Prevents accidental data loss
- No database schema changes needed

**Cons:**
- Products with orders cannot be deleted
- Need alternative (soft delete) to "hide" products

**Implementation:** Already implemented in `productController.js`

**Usage:**
```javascript
DELETE /api/products/:id
// Returns 409 if product has orders
```

---

### Solution 2: Soft Delete ✅ **BEST FOR PRODUCTION**

**What it does:** Sets `status = 'archived'` and `deleted_at = NOW()` instead of deleting.

**Pros:**
- Preserves all data (orders, reviews, etc.)
- Can be restored later
- No foreign key issues
- Better for audit trails

**Cons:**
- Products table grows over time
- Need to filter `deleted_at IS NULL` in queries

**Database Setup:**
```sql
-- Add deleted_at column (if not exists)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) 
WHERE deleted_at IS NULL;
```

**Implementation:** See `productController_softDelete.js` for example

**Update Queries:**
```javascript
// In all product queries, add:
.eq('deleted_at', null)  // or .is('deleted_at', null)

// Example:
const { data: products } = await supabaseAdmin
  .from('products')
  .select('*')
  .eq('store_id', storeId)
  .is('deleted_at', null)  // Only get non-deleted products
  .eq('status', 'active');
```

---

### Solution 3: Cascade Delete ⚠️ **NOT RECOMMENDED**

**What it does:** Automatically deletes `order_items` when product is deleted.

**Pros:**
- Allows hard deletion
- No code changes needed

**Cons:**
- **LOSES ORDER HISTORY** - Very bad for business!
- Breaks order records
- Cannot be undone

**Database Setup:**
```sql
ALTER TABLE order_items 
DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

ALTER TABLE order_items
ADD CONSTRAINT order_items_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES products(id) 
ON DELETE CASCADE;
```

**⚠️ WARNING:** Only use this if you're okay losing order history!

---

### Solution 4: SET NULL (Preserve Order History)

**What it does:** Sets `product_id = NULL` in `order_items` when product is deleted.

**Pros:**
- Preserves order records
- Allows product deletion

**Cons:**
- Order items lose product reference
- Need to make `product_id` nullable (breaking change)
- Order history becomes incomplete

**Database Setup:**
```sql
-- Make product_id nullable
ALTER TABLE order_items 
ALTER COLUMN product_id DROP NOT NULL;

-- Change constraint
ALTER TABLE order_items 
DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

ALTER TABLE order_items
ADD CONSTRAINT order_items_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES products(id) 
ON DELETE SET NULL;
```

---

## Recommended Approach

**For Production:** Use **Solution 2 (Soft Delete)** + **Solution 1 (Prevent Hard Delete)**

1. Add `deleted_at` column to products table
2. Update `deleteProduct` to use soft delete by default
3. Check for orders before allowing hard delete
4. Update all product queries to filter `deleted_at IS NULL`

**Benefits:**
- Preserves all data
- Can restore products later
- Maintains order history integrity
- Better for compliance/auditing

---

## Implementation Steps

### Step 1: Add `deleted_at` column
```sql
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) 
WHERE deleted_at IS NULL;
```

### Step 2: Update `deleteProduct` function
Replace the function in `productController.js` with the soft delete version (see `productController_softDelete.js`)

### Step 3: Update all product queries
Add `.is('deleted_at', null)` to all product SELECT queries:
- `getProductsByStore`
- `getProduct`
- `getAllProducts`
- Any other product listing endpoints

### Step 4: Test
1. Create a product
2. Create an order with that product
3. Try to delete product → Should soft delete (archive)
4. Verify product is hidden but order still exists

---

## API Endpoints

### Soft Delete (Default)
```
DELETE /api/products/:id
```
Archives the product (sets `status = 'archived'` and `deleted_at = NOW()`)

### Hard Delete (Force)
```
DELETE /api/products/:id?hardDelete=true
```
Permanently deletes product (only if no orders exist)

### Restore Product
```
PATCH /api/products/:id
Body: { deleted_at: null, status: 'active' }
```
Restores a soft-deleted product

---

## Example Response

### Product with orders (Soft Delete):
```json
{
  "success": true,
  "message": "Product archived successfully",
  "data": {
    "product": {
      "id": "...",
      "name": "Product Name",
      "status": "archived",
      "deleted_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Product with orders (Hard Delete attempt):
```json
{
  "success": false,
  "error": {
    "message": "Cannot delete product with existing orders",
    "details": "This product has 5 order(s). Products with order history cannot be deleted.",
    "orderCount": 5,
    "suggestion": "Use soft delete (archive) instead to hide the product while preserving order history."
  }
}
```

