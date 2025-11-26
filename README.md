# Dukaan Clone - E-Commerce Platform

A full-stack e-commerce platform that allows users to create their own online stores, manage products, process orders, and leverage AI-powered features for business growth.

## 🚀 Features

- **Store Management**: Create and customize your online store
- **Product Management**: Full CRUD operations with inventory tracking
- **Shopping Cart**: Guest and authenticated user cart support
- **Order Processing**: Complete checkout and order management
- **Payment Integration**: Razorpay payment gateway
- **AI-Powered Features**: Auto-generated descriptions, SEO, pricing suggestions
- **Analytics Dashboard**: Sales, traffic, and performance metrics
- **Inventory Management**: Real-time tracking with low stock alerts
- **File Upload**: Image upload for products, stores, and avatars
- **Notifications**: Real-time notifications for orders and inventory
- **User Profiles**: Complete user management system

## 🛠️ Tech Stack

### Frontend
- React 19 + Vite
- React Router DOM
- Axios
- Recharts
- CSS Modules

### Backend
- Node.js + Express.js
- Supabase (PostgreSQL)
- Supabase Auth
- Supabase Storage
- Razorpay
- Google Gemini AI

## 📁 Project Structure

```
Dukkan/
├── frontend/          # React frontend application
├── backend/           # Node.js backend API
├── render.yaml        # Render deployment config
└── docs/              # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Git

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

### Environment Variables

See [Environment Setup Guide](./backend/database/README.md) for detailed instructions.

## 📚 Documentation

- [Setup Guide](./SETUP_GUIDE.md) - Complete setup instructions
- [Project Summary](./PROJECT_SUMMARY.md) - Complete project overview
- [Testing Guide](./TESTING.md) - Comprehensive testing documentation
- [Quick Testing Checklist](./TESTING_CHECKLIST.md) - Quick smoke tests
- [Frontend Deployment](./frontend/DEPLOYMENT.md) - Vercel deployment guide
- [Backend Deployment](./backend/DEPLOYMENT.md) - Render deployment guide
- [Security Guide](./backend/SECURITY.md) - Security best practices
- [Optimization Guide](./backend/OPTIMIZATION.md) - Performance optimizations
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- [Changelog](./CHANGELOG.md) - Version history

## 🧪 Testing

Before deployment, run through the [Testing Checklist](./TESTING_CHECKLIST.md):

```bash
# Critical path tests
- Authentication flow
- Store management
- Product management
- Shopping cart
- Checkout process
```

## 🚢 Deployment

### Frontend (Vercel)
1. Push code to Git
2. Import in Vercel
3. Set `VITE_API_URL` environment variable
4. Deploy

See [Frontend Deployment Guide](./frontend/DEPLOYMENT.md) for details.

### Backend (Render)
1. Push code to Git
2. Create Web Service in Render
3. Set environment variables
4. Deploy

See [Backend Deployment Guide](./backend/DEPLOYMENT.md) for details.

## 🔒 Security

- Input validation and sanitization
- XSS and SQL injection prevention
- Rate limiting
- Security headers
- CORS configuration
- Authentication & authorization

See [Security Guide](./backend/SECURITY.md) for details.

## ⚡ Performance

- Code splitting and lazy loading
- Image optimization
- Response compression
- Request caching
- Database query optimization

See [Optimization Guide](./backend/OPTIMIZATION.md) for details.

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Stores
- `POST /api/stores` - Create store
- `GET /api/stores/:id` - Get store
- `PUT /api/stores/:id` - Update store

### Products
- `POST /api/products` - Create product
- `GET /api/products/store/:storeId` - Get products
- `GET /api/products/:id` - Get product

### Cart & Orders
- `POST /api/cart` - Add to cart
- `POST /api/orders` - Create order
- `GET /api/orders/my` - Get orders

See [Backend README](./backend/README.md) for complete API documentation.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE.md](./LICENSE.md) file for details.

## 🙏 Acknowledgments

- Dukaan for inspiration
- Supabase for backend infrastructure
- Vercel for frontend hosting
- Render for backend hosting

## 📞 Support

For issues or questions:
1. Check documentation
2. Review error logs
3. Check environment variables
4. Verify database connection

---

**Built with ❤️ using React, Node.js, and Supabase**

