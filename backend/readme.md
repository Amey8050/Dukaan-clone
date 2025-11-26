# Dukaan Clone - Backend API

Backend server for the Dukaan Clone e-commerce platform built with Node.js and Express.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Project Structure

```
backend/
├── config/          # Configuration files
│   └── config.js    # Environment config
├── controllers/     # Request handlers
│   ├── authController.js
│   ├── storeController.js
│   └── productController.js
├── middleware/      # Custom middleware
│   ├── errorHandler.js  # Global error handler
│   ├── logger.js        # Request logger
│   └── notFound.js      # 404 handler
├── models/          # Data models
├── routes/          # API routes
│   ├── index.js         # Main routes file
│   ├── authRoutes.js
│   ├── storeRoutes.js
│   ├── productRoutes.js
│   ├── cartRoutes.js
│   ├── orderRoutes.js
│   ├── analyticsRoutes.js
│   └── aiRoutes.js
├── utils/           # Utility functions
│   └── supabaseClient.js  # Supabase client setup
├── index.js         # Entry point
├── package.json     # Dependencies
└── .env             # Environment variables
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your Supabase credentials (see `database/README.md` for detailed setup)

4. Set up the database:
   - Go to Supabase SQL Editor
   - Run `database/schema.sql` to create tables
   - Run `database/rls_policies.sql` to set up security policies
   - Create storage buckets (see `database/README.md`)

5. Run the server:
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## API Endpoints

### Base Routes
- `GET /` - API information and available endpoints
- `GET /health` - Health check

### API Routes

#### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user (protected)
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user (protected)

#### Store Management (`/api/stores`)
- `POST /api/stores` - Create store (protected)
- `GET /api/stores/my` - Get current user's stores (protected)
- `GET /api/stores/:id` - Get store by ID (public)
- `PUT /api/stores/:id` - Update store (protected)
- `DELETE /api/stores/:id` - Delete store (protected)

#### Product Management (`/api/products`)
- `POST /api/products` - Create product (protected)
- `GET /api/products/store/:storeId` - Get products by store (public)
- `GET /api/products/:id` - Get product by ID (public)
- `PUT /api/products/:id` - Update product (protected)
- `DELETE /api/products/:id` - Delete product (protected)

#### Shopping Cart (`/api/cart`)
- `GET /api/cart?storeId=xxx` - Get user's cart (optional auth)
- `POST /api/cart` - Add item to cart (optional auth)
- `PUT /api/cart/:itemId` - Update cart item quantity (optional auth)
- `DELETE /api/cart/:itemId` - Remove item from cart (optional auth)
- `DELETE /api/cart?storeId=xxx` - Clear cart (optional auth)

#### Order Management (`/api/orders`)
- `POST /api/orders` - Create order (checkout) - optional auth
- `GET /api/orders/my` - Get current user's orders (protected)
- `GET /api/orders/store/:storeId` - Get store orders (protected, store owner)
- `GET /api/orders/:id` - Get order by ID (optional auth)
- `PUT /api/orders/:id/status` - Update order status (protected, store owner)

#### Payment Processing (`/api/payments`)
- `POST /api/payments/create-order` - Create Razorpay payment order (optional auth)
- `POST /api/payments/verify` - Verify payment (optional auth)
- `POST /api/payments/webhook` - Razorpay webhook handler

#### AI Features (`/api/ai`)
- `POST /api/ai/generate-description` - Generate product description
- `POST /api/ai/generate-seo` - Generate SEO keywords and meta tags
- `POST /api/ai/pricing-suggestions` - Get pricing suggestions
- `POST /api/ai/recommendations` - Get product recommendations
- `POST /api/ai/cleanup-image` - Clean up product image

#### Inventory Management (`/api/inventory`)
- `GET /api/inventory/product/:productId/history` - Get inventory history for a product (protected)
- `POST /api/inventory/product/:productId/adjust` - Adjust inventory manually (protected)
- `GET /api/inventory/store/:storeId/low-stock` - Get low stock products (protected)
- `GET /api/inventory/store/:storeId/summary` - Get inventory summary (protected)

#### Sales Predictions (`/api/predictions`)
- `GET /api/predictions/store/:storeId/sales` - Get sales predictions for a store (protected)
- `GET /api/predictions/store/:storeId/product/:productId` - Get product sales predictions (protected)

#### Auto Pricing Engine (`/api/pricing`)
- `POST /api/pricing/product/:productId/recommendations` - Get pricing recommendations for a product (protected)
- `POST /api/pricing/store/:storeId/bulk` - Get bulk pricing recommendations (protected)
- `GET /api/pricing/store/:storeId/strategy` - Analyze pricing strategy for a store (protected)

#### Recommendation Engine (`/api/recommendations`)
- `GET /api/recommendations/store/:storeId/user` - Get personalized recommendations for user (optional auth)
- `GET /api/recommendations/store/:storeId/product/:productId` - Get product-based recommendations (public)
- `GET /api/recommendations/store/:storeId/popular` - Get popular/trending products (public)
- `GET /api/recommendations/store/:storeId/ai-personalized` - Get AI-powered personalized recommendations (optional auth)

#### Personalized Homepage (`/api/homepage`)
- `GET /api/homepage/store/:storeId` - Get personalized homepage data (optional auth)

#### Promo Suggestions (`/api/promo`)
- `GET /api/promo/store/:storeId/suggestions` - Get promotional suggestions for a store (protected)
- `GET /api/promo/product/:productId/suggestions` - Get product-specific promo suggestions (protected)

#### Analytics API (`/api/analytics`)
- `GET /api/analytics/store/:storeId/sales` - Get sales analytics (protected)
- `GET /api/analytics/store/:storeId/products` - Get product sales analytics (protected)
- `GET /api/analytics/store/:storeId/revenue-trends` - Get revenue trends (protected)
- `GET /api/analytics/store/:storeId/summary` - Get sales summary (protected)
- `GET /api/analytics/store/:storeId/traffic` - Get traffic analytics (protected)
- `GET /api/analytics/store/:storeId/product-views` - Get product view analytics (protected)
- `POST /api/analytics/track` - Track analytics event (public, optional auth)

#### Other Routes (Coming Soon)
- `/api/test/db-connection` - Test database connection

## Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `FRONTEND_URL` - Frontend URL for CORS
- `RAZORPAY_KEY_ID` - Razorpay API key ID
- `RAZORPAY_KEY_SECRET` - Razorpay API key secret
- `RAZORPAY_WEBHOOK_SECRET` - Razorpay webhook secret (optional)
- `GEMINI_API_KEY` - Google Gemini API key for AI features

## Development

The server runs on `http://localhost:5000` by default.

