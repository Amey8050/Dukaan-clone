# AI Features Guide

## ✅ AI API Key Setup

If you've added your `GEMINI_API_KEY` to `backend/.env`, the AI features are now ready to use!

## Test Your AI Setup

### Step 1: Test API Key
Open your browser and go to:
```
http://localhost:5000/api/ai/test
```

**Expected Response (if API key is configured):**
```json
{
  "success": true,
  "message": "AI API key is configured and ready to use",
  "features": [
    "Product description generation",
    "SEO keywords generation",
    "Pricing suggestions",
    "Product recommendations",
    "Promotional suggestions",
    "Sales predictions"
  ]
}
```

**If API key is missing:**
```json
{
  "success": false,
  "error": {
    "message": "AI features are not available",
    "details": "GEMINI_API_KEY is not configured..."
  }
}
```

## Available AI Features

### 1. Product Description Generation
**Endpoint:** `POST /api/ai/generate-description`

**Request:**
```json
{
  "product_name": "Wireless Headphones",
  "category": "Electronics",
  "features": "Noise cancelling, Bluetooth 5.0, 30hr battery",
  "price": 99.99
}
```

**Use Case:** When creating/editing products, click "Generate Description" to auto-generate SEO-friendly product descriptions.

---

### 2. SEO Keywords Generation
**Endpoint:** `POST /api/ai/generate-seo`

**Request:**
```json
{
  "product_name": "Wireless Headphones",
  "description": "Premium wireless headphones with noise cancellation..."
}
```

**Use Case:** Auto-generate SEO title, meta description, and keywords for products.

---

### 3. Pricing Suggestions
**Endpoint:** `POST /api/ai/pricing-suggestions`

**Request:**
```json
{
  "product_name": "Wireless Headphones",
  "cost_per_item": 50,
  "category": "Electronics"
}
```

**Use Case:** Get AI-powered pricing recommendations based on cost, category, and market analysis.

---

### 4. Product Recommendations
**Endpoint:** `POST /api/ai/recommendations`

**Request:**
```json
{
  "product_id": "uuid",
  "user_id": "uuid",
  "store_id": "uuid"
}
```

**Use Case:** Generate personalized product recommendations for users.

---

### 5. Promotional Suggestions
**Endpoint:** `GET /api/promo/store/:storeId/suggestions`

**Use Case:** Get AI-powered promotional campaign suggestions for your store.

---

### 6. Sales Predictions
**Endpoint:** `GET /api/predictions/store/:storeId`

**Use Case:** Get AI-powered sales predictions and inventory recommendations.

---

## Where AI Features Are Used

### Frontend Integration Points:

1. **Product Form** (`ProductForm.jsx`)
   - Generate product description
   - Generate SEO keywords
   - Get pricing suggestions

2. **Product Recommendations**
   - Personalized recommendations on homepage
   - "You may also like" suggestions
   - Related products

3. **Store Dashboard**
   - Sales predictions
   - Promotional suggestions
   - Inventory recommendations

## API Rate Limits

Google Gemini API free tier:
- **15 requests per minute (RPM)**
- **1,500 requests per day (RPD)**

The backend includes rate limiting to prevent exceeding these limits.

## Troubleshooting

### Issue: "AI features are not available"
**Solution:**
1. Check `backend/.env` file exists
2. Verify `GEMINI_API_KEY=your-actual-key` is set
3. Restart your backend server
4. Test with `GET /api/ai/test`

### Issue: "API key invalid"
**Solution:**
1. Get a new API key from: https://makersuite.google.com/app/apikey
2. Update `GEMINI_API_KEY` in `.env`
3. Restart backend server

### Issue: Rate limit exceeded
**Solution:**
- Wait a minute before making more requests
- The rate limiter will automatically handle this

## Get Your Free API Key

1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Get API Key"
4. Create new API key or use existing
5. Copy the key
6. Add to `backend/.env`:
   ```
   GEMINI_API_KEY=your-actual-api-key-here
   ```

## Next Steps

1. ✅ Test API key: `GET /api/ai/test`
2. ✅ Try generating a product description
3. ✅ Test pricing suggestions
4. ✅ Explore promotional suggestions

Your AI features are now ready to use! 🚀

