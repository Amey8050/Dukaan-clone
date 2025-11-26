# Quick Testing Checklist

Use this checklist for quick smoke testing before deployment.

## Critical Path Tests (Must Pass) ✅

### Authentication
- [ ] Register new user
- [ ] Login with credentials
- [ ] Logout works
- [ ] Protected routes redirect when not logged in

### Store Management
- [ ] Create store
- [ ] View store
- [ ] Update store (as owner)
- [ ] Delete store (as owner)

### Product Management
- [ ] Create product
- [ ] View product list
- [ ] View product details
- [ ] Update product (as owner)
- [ ] Delete product (as owner)

### Shopping Cart
- [ ] Add product to cart
- [ ] View cart
- [ ] Update cart quantity
- [ ] Remove from cart

### Checkout
- [ ] Proceed to checkout
- [ ] Create order
- [ ] View order confirmation
- [ ] View order in order list

### File Upload
- [ ] Upload product image
- [ ] Upload store logo
- [ ] Upload avatar
- [ ] Images display correctly

## Quick Health Checks

### API Health
```bash
curl https://your-backend.onrender.com/health
```
Expected: `{"status":"ok",...}`

### Frontend Loads
- [ ] Frontend loads without errors
- [ ] No console errors
- [ ] API connects successfully

### Database Connection
- [ ] Database queries work
- [ ] Data persists correctly
- [ ] RLS policies work

## 5-Minute Smoke Test

1. [ ] Register → Login → Create Store → Add Product → View Store → Add to Cart → Checkout
2. [ ] All steps complete without errors
3. [ ] Data persists correctly
4. [ ] No console errors

## Sign-Off

- [ ] Critical path tests passed
- [ ] Health checks passing
- [ ] No blocking errors
- [ ] Ready for deployment

**Tester**: [Name]
**Date**: [Date]

