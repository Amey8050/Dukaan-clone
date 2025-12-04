# ✅ Quick Test Checklist - All 5 Stories

**Test Date:** $(date)  
**Status:** Ready for Manual Testing

---

## 🚀 Quick Start Testing

### Start Servers First:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm start
```

**Look for:**
- ✅ Backend: "🚀 Server is running on port 5000"
- ✅ Backend: "🚀 Starting scheduler service..."
- ✅ Frontend: "Compiled successfully!"

---

## ✅ STORY 1: Core E-Commerce

### Test Store Creation
1. [ ] Go to `/stores/create` or click "Create Store"
2. [ ] Enter store name: "Test Store"
3. [ ] Add description (optional)
4. [ ] Upload logo (optional)
5. [ ] Set theme color
6. [ ] Click "Create Store"
7. [ ] ✅ **VERIFY:** Store appears in `/stores` page
8. [ ] ✅ **VERIFY:** Store slug is auto-generated

**API Test:**
```bash
POST http://localhost:5000/api/stores
Headers: { Authorization: Bearer YOUR_TOKEN }
Body: { name: "Test Store", description: "Test" }
```

---

### Test Product CRUD
1. [ ] Go to Admin Dashboard → Products tab
2. [ ] Click "Add Product"
3. [ ] Fill product details:
   - Name: "Test Product"
   - Price: 99.99
   - Description: "Test description"
   - Images: Upload 1-2 images
4. [ ] Click "Create Product"
5. [ ] ✅ **VERIFY:** Product appears in products list
6. [ ] Edit product: Change price to 89.99
7. [ ] ✅ **VERIFY:** Price updated
8. [ ] Delete product (if no orders)
9. [ ] ✅ **VERIFY:** Product deleted

**API Test:**
```bash
POST http://localhost:5000/api/products
Body: { store_id: "xxx", name: "Test", price: 99.99 }
```

---

### Test Checkout Flow
1. [ ] Go to store homepage: `/stores/{storeId}`
2. [ ] Browse products
3. [ ] Click "Add to Cart" on a product
4. [ ] ✅ **VERIFY:** Cart icon shows item count
5. [ ] Go to Cart page
6. [ ] Update quantity: Change to 2
7. [ ] ✅ **VERIFY:** Total updates
8. [ ] Click "Checkout"
9. [ ] Fill shipping address
10. [ ] Select payment method
11. [ ] Click "Place Order"
12. [ ] ✅ **VERIFY:** Order created
13. [ ] ✅ **VERIFY:** Cart is cleared
14. [ ] Go to Orders page
15. [ ] ✅ **VERIFY:** Order appears in list

**API Test:**
```bash
POST http://localhost:5000/api/cart
Body: { store_id: "xxx", product_id: "xxx", quantity: 1 }

POST http://localhost:5000/api/orders
Body: { store_id: "xxx", shipping_address: {...}, ... }
```

---

## ✅ STORY 2: AI Content Automation

### Test AI Description Generation
1. [ ] Go to Product Form (create or edit)
2. [ ] Enter product name: "Wireless Headphones"
3. [ ] Click "Generate Description with AI" button
4. [ ] Wait 3-5 seconds
5. [ ] ✅ **VERIFY:** Description appears in textarea
6. [ ] ✅ **VERIFY:** Description is well-formatted

**API Test:**
```bash
POST http://localhost:5000/api/ai/generate-description
Body: { product_name: "Wireless Headphones", category: "Electronics" }
```

---

### Test SEO Generation
1. [ ] In Product Form, scroll to SEO section
2. [ ] Click "Generate SEO with AI" button
3. [ ] Wait 3-5 seconds
4. [ ] ✅ **VERIFY:** SEO title filled
5. [ ] ✅ **VERIFY:** SEO description filled
6. [ ] ✅ **VERIFY:** SEO keywords filled

**API Test:**
```bash
POST http://localhost:5000/api/ai/generate-seo
Body: { product_name: "Wireless Headphones", description: "..." }
```

---

### Test Image Analysis
1. [ ] In Product Form, add an image URL
2. [ ] Click "Analyze Image" button
3. [ ] Wait 5-10 seconds
4. [ ] ✅ **VERIFY:** Image analysis appears
5. [ ] ✅ **VERIFY:** Quality score shown
6. [ ] ✅ **VERIFY:** Recommendations displayed

**API Test:**
```bash
POST http://localhost:5000/api/ai/cleanup-image
Body: { image_url: "https://example.com/product.jpg", action: "analyze" }
```

---

## ✅ STORY 3: Inventory Intelligence

### Test Sales Predictions
1. [ ] Go to Admin Dashboard → Insights tab
2. [ ] Scroll to "Sales Predictions" section
3. [ ] ✅ **VERIFY:** Predictions display (if you have sales data)
4. [ ] Change period: 7/30/90 days
5. [ ] ✅ **VERIFY:** Predictions update

**API Test:**
```bash
GET http://localhost:5000/api/predictions/store/{storeId}/sales?period=30
Headers: { Authorization: Bearer YOUR_TOKEN }
```

---

### Test Low-Stock Alerts
1. [ ] Create a product with inventory tracking
2. [ ] Set inventory quantity: 3
3. [ ] Set low stock threshold: 5
4. [ ] ✅ **VERIFY:** Product shows as low stock
5. [ ] Go to Admin Dashboard → Overview
6. [ ] ✅ **VERIFY:** Low stock alert appears
7. [ ] Place an order to reduce inventory
8. [ ] ✅ **VERIFY:** Notification created (check notifications)
9. [ ] Go to Inventory page
10. [ ] ✅ **VERIFY:** Low stock products listed

**API Test:**
```bash
GET http://localhost:5000/api/inventory/store/{storeId}/low-stock
Headers: { Authorization: Bearer YOUR_TOKEN }
```

**Check Scheduler:**
- Look in backend console for: "🔍 Starting low stock check..."
- Should run every 6 hours automatically

---

### Test Auto-Pricing
1. [ ] Go to Product Form
2. [ ] Enter cost per item: 50
3. [ ] Click "Generate Pricing with AI" button
4. [ ] Wait 3-5 seconds
5. [ ] ✅ **VERIFY:** Suggested price appears
6. [ ] ✅ **VERIFY:** Pricing tiers shown (if displayed)

**API Test:**
```bash
POST http://localhost:5000/api/pricing/product/{productId}/recommendations
Body: { competitor_prices: [], target_margin: 30 }
```

---

## ✅ STORY 4: User Personalization

### Test Recommendations
1. [ ] Go to store homepage: `/stores/{storeId}`
2. [ ] Scroll to "Recommended for You" section
3. [ ] ✅ **VERIFY:** Recommended products display
4. [ ] If logged in, view personalized recommendations
5. [ ] View product detail page
6. [ ] ✅ **VERIFY:** "You may also like" section shows similar products

**API Test:**
```bash
GET http://localhost:5000/api/recommendations/store/{storeId}/user
Headers: { Authorization: Bearer YOUR_TOKEN }

GET http://localhost:5000/api/recommendations/store/{storeId}/product/{productId}
```

---

### Test Personalized Homepage
1. [ ] Visit store homepage: `/stores/{storeId}`
2. [ ] ✅ **VERIFY:** Featured products section
3. [ ] ✅ **VERIFY:** Popular products section
4. [ ] ✅ **VERIFY:** New arrivals section
5. [ ] ✅ **VERIFY:** Categories section
6. [ ] Login and visit again
7. [ ] ✅ **VERIFY:** Personalized recommendations appear

**API Test:**
```bash
GET http://localhost:5000/api/homepage/store/{storeId}
Headers: { Authorization: Bearer YOUR_TOKEN } # Optional
```

---

### Test Promo Suggestions
1. [ ] Go to Admin Dashboard → Insights tab
2. [ ] Scroll to "Promotional Suggestions"
3. [ ] ✅ **VERIFY:** Promo suggestions display
4. [ ] ✅ **VERIFY:** Discount recommendations shown
5. [ ] ✅ **VERIFY:** Flash sale suggestions shown

**API Test:**
```bash
GET http://localhost:5000/api/promo/store/{storeId}/suggestions
Headers: { Authorization: Bearer YOUR_TOKEN }
```

---

## ✅ STORY 5: Admin Dashboard

### Test Analytics UI
1. [ ] Go to Admin Dashboard → Analytics tab
2. [ ] ✅ **VERIFY:** Sales analytics chart displays
3. [ ] ✅ **VERIFY:** Traffic analytics chart displays
4. [ ] Change period: Select "Last 7 days"
5. [ ] ✅ **VERIFY:** Charts update
6. [ ] Change period: Select "Last 90 days"
7. [ ] ✅ **VERIFY:** Charts update again
8. [ ] ✅ **VERIFY:** Revenue trend line chart
9. [ ] ✅ **VERIFY:** Order statistics cards

**API Test:**
```bash
GET http://localhost:5000/api/analytics/store/{storeId}/sales?period=30
GET http://localhost:5000/api/analytics/store/{storeId}/traffic?period=30
```

---

### Test Reports
1. [ ] Go to Admin Dashboard → Reports tab
2. [ ] Select report type: "Sales Report"
3. [ ] Select date range
4. [ ] Click "Generate Report"
5. [ ] ✅ **VERIFY:** Report data displays
6. [ ] Switch to "Traffic Report"
7. [ ] ✅ **VERIFY:** Traffic data displays

**API Test:**
```bash
GET http://localhost:5000/api/analytics/store/{storeId}/summary?period=30
```

---

### Test AI Store Insights
1. [ ] Go to Admin Dashboard → Insights tab
2. [ ] ✅ **VERIFY:** Sales predictions section
3. [ ] ✅ **VERIFY:** Promo suggestions section
4. [ ] ✅ **VERIFY:** Pricing strategy section
5. [ ] ✅ **VERIFY:** Inventory alerts section
6. [ ] ✅ **VERIFY:** Performance metrics
7. [ ] Scroll to AI insights
8. [ ] ✅ **VERIFY:** AI-powered insights display

**API Test:**
```bash
POST http://localhost:5000/api/ai/analyze-analytics
Body: { salesData: {...}, trafficData: {...}, period: "30" }
```

---

## ✅ Automated Systems Test

### Test Scheduler Service
1. [ ] Check backend console on startup
2. [ ] ✅ **VERIFY:** "🚀 Starting scheduler service..." message
3. [ ] ✅ **VERIFY:** "✅ Scheduler service started" message
4. [ ] Wait 6 hours OR manually trigger:
   ```bash
   POST http://localhost:5000/api/scheduler/low-stock-check
   Headers: { Authorization: Bearer YOUR_TOKEN }
   ```
5. [ ] ✅ **VERIFY:** Low stock check runs
6. [ ] ✅ **VERIFY:** Notifications created (check database)

---

### Test Automatic Notifications
1. [ ] Create a product with inventory: 3, threshold: 5
2. [ ] Place an order for that product
3. [ ] ✅ **VERIFY:** Inventory decreases
4. [ ] ✅ **VERIFY:** Notification created automatically
5. [ ] Go to Notifications page
6. [ ] ✅ **VERIFY:** Low stock notification appears

---

## 🎯 Quick Verification

### All Routes Working? ✅
Test health endpoint:
```bash
GET http://localhost:5000/health
# Should return: { status: "ok", timestamp: "...", uptime: ... }
```

Test API info:
```bash
GET http://localhost:5000/
# Should return: { message: "Dukaan Clone Backend API", endpoints: {...} }
```

---

## ✅ Test Results Summary

| Story | Feature | Test Status |
|-------|---------|-------------|
| **Story 1** | Store Creation | ⬜ PASS / FAIL |
| **Story 1** | Product CRUD | ⬜ PASS / FAIL |
| **Story 1** | Checkout Flow | ⬜ PASS / FAIL |
| **Story 2** | AI Description | ⬜ PASS / FAIL |
| **Story 2** | Image Analysis | ⬜ PASS / FAIL |
| **Story 2** | SEO Generation | ⬜ PASS / FAIL |
| **Story 3** | Sales Predictions | ⬜ PASS / FAIL |
| **Story 3** | Low-Stock Alerts | ⬜ PASS / FAIL |
| **Story 3** | Auto-Pricing | ⬜ PASS / FAIL |
| **Story 4** | Recommendations | ⬜ PASS / FAIL |
| **Story 4** | Personalized Homepage | ⬜ PASS / FAIL |
| **Story 4** | Promo Suggestions | ⬜ PASS / FAIL |
| **Story 5** | Analytics UI | ⬜ PASS / FAIL |
| **Story 5** | Reports | ⬜ PASS / FAIL |
| **Story 5** | AI Insights | ⬜ PASS / FAIL |

---

## 🎉 All Tests Ready!

**Everything is implemented and ready for testing!**

Start testing by following the checklist above. All features should work as expected. 🚀

