# Dukaan Clone - Frontend

Frontend application for the Dukaan Clone e-commerce platform built with React and Vite.

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Styling**: CSS Modules

## Project Structure

```
frontend/src/
├── components/        # Reusable components
│   └── ProtectedRoute.jsx
├── contexts/          # React contexts
│   └── AuthContext.jsx
├── pages/             # Page components
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── Auth.css
│   └── Dashboard.css
├── services/          # API services
│   ├── api.js
│   ├── authService.js
│   ├── storeService.js
│   ├── productService.js
│   ├── cartService.js
│   ├── orderService.js
│   ├── aiService.js
│   ├── inventoryService.js
│   ├── homepageService.js
│   └── analyticsService.js
├── config/            # Configuration
│   └── api.js
├── App.jsx            # Main app component
└── main.jsx           # Entry point
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your backend API URL:
```env
VITE_API_URL=http://localhost:5000
```

4. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Features

### Authentication
- User registration
- User login
- Protected routes
- Token management
- Auto token refresh

### Pages
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Protected dashboard (requires authentication)
- `/stores` - List user's stores
- `/stores/create` - Create new store
- `/stores/:storeId/products` - Product listing for a store
- `/stores/:storeId/products/create` - Create new product
- `/stores/:storeId/products/:productId/edit` - Edit product
- `/stores/:storeId/products/:productId` - Product detail page (public)
- `/stores/:storeId/cart` - Shopping cart
- `/stores/:storeId/checkout` - Checkout page
- `/stores/:storeId/orders` - Store orders (store owner)
- `/stores/:storeId/orders/:orderId` - Order details

### AI Features
- **AI Product Description Generation** - Auto-generate product descriptions using Gemini AI
- **AI SEO Generation** - Generate SEO keywords, titles, and meta descriptions
- **AI Pricing Suggestions** - Get AI-powered pricing recommendations based on cost
- **AI Image Analysis** - Analyze product images and generate descriptions

### Analytics & Tracking
- **Event Tracking** - Track page views, product views, add to cart, purchases
- **Traffic Analytics** - Monitor visitor behavior and engagement
- **Sales Analytics** - Track revenue, orders, and performance metrics
- **Product Analytics** - Analyze product views and performance

## API Integration

The frontend connects to the backend API at the URL specified in `VITE_API_URL`.

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:5000)

## Development

- Development server runs on port 5173
- Hot Module Replacement (HMR) enabled
- ESLint configured for code quality

## Build

```bash
npm run build
```

The build output will be in the `dist` folder, ready for deployment to Vercel.
