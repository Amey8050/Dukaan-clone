# Debugging Store & Product Deletion Issues

## Current Behavior

### Product Deletion
- ✅ **Products WITHOUT orders**: Delete successfully
- ❌ **Products WITH orders**: Returns `409 Conflict` (by design to preserve order history)

### Store Deletion  
- ✅ **Stores WITHOUT products that have orders**: Delete successfully
- ❌ **Stores WITH products that have orders**: May fail due to foreign key constraints

## Common Issues

### Issue 1: Product Has Orders (409 Error)
**Error:** `Cannot delete product with existing orders`

**Why:** Products with order history cannot be deleted to preserve order records.

**Solution:**
- Archive the product instead (set `status = 'archived'`)
- Or delete orders first (not recommended - loses order history)

### Issue 2: Store Has Products With Orders
**Error:** `Cannot delete store with products that have orders`

**Why:** When deleting a store, it tries to cascade delete products, but products with orders have `ON DELETE RESTRICT` constraint.

**Solution:**
1. Delete products without orders first
2. Archive products with orders (`status = 'archived'`)
3. Then delete the store

## How to Debug

### Step 1: Check Backend Console
Look for these log messages:

**Product Deletion:**
```
Delete product request: { id: '...', userId: '...' }
Product deletion error: Product has orders { id: '...', orderCount: X }
```

**Store Deletion:**
```
Delete store request: { id: '...', userId: '...' }
Store deletion error: { id: '...', error: '...', code: '...' }
```

### Step 2: Check for Orders
Run this in Supabase SQL Editor:

```sql
-- Check if product has orders
SELECT COUNT(*) as order_count
FROM order_items
WHERE product_id = 'YOUR_PRODUCT_ID';

-- Check if store has products with orders
SELECT p.id, p.name, COUNT(oi.id) as order_count
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
WHERE p.store_id = 'YOUR_STORE_ID'
GROUP BY p.id, p.name
HAVING COUNT(oi.id) > 0;
```

### Step 3: Check Error Response
In browser console, check the error response:

```javascript
// Product deletion error
{
  "success": false,
  "error": {
    "message": "Cannot delete product with existing orders",
    "details": "This product has X order(s)...",
    "orderCount": X,
    "suggestion": "Use soft delete (archive) instead..."
  }
}
```

## Quick Fixes

### Fix 1: Archive Product Instead of Delete
```javascript
// Update product status to archived
PATCH /api/products/:id
Body: { status: 'archived' }
```

### Fix 2: Delete Products Without Orders First
1. List all products in the store
2. Check which ones have orders
3. Delete only products without orders
4. Archive products with orders
5. Then delete the store

### Fix 3: Enable Soft Delete (Recommended)
See `PRODUCT_DELETION_GUIDE.md` for instructions on enabling soft delete.

## Testing Deletion

### Test Product Deletion (No Orders)
1. Create a product
2. Don't create any orders
3. Try to delete → Should succeed ✅

### Test Product Deletion (With Orders)
1. Create a product
2. Create an order with that product
3. Try to delete → Should return 409 ❌ (expected)

### Test Store Deletion
1. Create a store
2. Create products (some with orders, some without)
3. Delete products without orders
4. Archive products with orders
5. Delete store → Should succeed ✅

## Error Codes

- **409 Conflict**: Resource has dependencies that prevent deletion
- **403 Forbidden**: User doesn't own the resource
- **404 Not Found**: Resource doesn't exist
- **500 Internal Server Error**: Database error (check backend logs)

