# Complete Setup Guide - Dukaan Clone

This guide will walk you through setting up the entire Dukaan Clone project from scratch.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ installed ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Git** installed
- **Supabase account** ([Sign up](https://supabase.com))
- **Code editor** (VS Code recommended)
- **GitHub account** (for deployment)

## Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/dukaan-clone.git
cd dukaan-clone
```

## Step 2: Set Up Supabase Database

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details
5. Wait for project to be created

### 2.2 Get Supabase Credentials

1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 2.3 Set Up Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Open `backend/database/schema.sql`
3. Copy and paste into SQL Editor
4. Click **Run** to execute

### 2.4 Set Up Row Level Security (RLS)

1. In SQL Editor, open `backend/database/rls_policies.sql`
2. Copy and paste into SQL Editor
3. Click **Run** to execute

### 2.5 Create Storage Buckets

1. Go to **Storage** in Supabase dashboard
2. Create the following buckets (all public):
   - `product-images` - For product images
   - `store-logos` - For store logos
   - `store-banners` - For store banners
   - `user-avatars` - For user avatars

For each bucket:
- Set as **Public**
- Enable **File size limit** (5MB)
- Enable **Allowed MIME types** (image/jpeg, image/png, image/webp)

## Step 3: Set Up Backend

### 3.1 Install Dependencies

```bash
cd backend
npm install
```

### 3.2 Configure Environment Variables

1. Create `.env` file in `backend/` directory:

```bash
cp .env.example .env
```

2. Edit `.env` and add your credentials:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: Razorpay (for payment features)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Optional: Gemini AI (for AI features)
GEMINI_API_KEY=your-gemini-api-key

# Optional: JWT Secret
JWT_SECRET=your-secret-key-change-in-production
```

### 3.3 Test Backend

```bash
npm run dev
```

You should see:
```
🚀 Server is running on http://localhost:5000
```

Test the health endpoint:
```bash
curl http://localhost:5000/health
```

## Step 4: Set Up Frontend

### 4.1 Install Dependencies

```bash
cd ../frontend
npm install
```

### 4.2 Configure Environment Variables

1. Create `.env` file in `frontend/` directory:

```bash
cp .env.example .env
```

2. Edit `.env` and add:

```env
VITE_API_URL=http://localhost:5000
```

### 4.3 Test Frontend

```bash
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

Open `http://localhost:5173` in your browser.

## Step 5: Optional: Set Up Payment (Razorpay)

### 5.1 Create Razorpay Account

1. Go to [razorpay.com](https://razorpay.com)
2. Sign up for an account
3. Complete KYC verification
4. Get your API keys from dashboard

### 5.2 Add Razorpay Keys

Add to `backend/.env`:
```env
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
```

## Step 6: Optional: Set Up AI Features (Google Gemini)

### 6.1 Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Create API key
4. Copy the key

### 6.2 Add Gemini Key

Add to `backend/.env`:
```env
GEMINI_API_KEY=your-api-key
```

## Step 7: Verify Setup

### 7.1 Test Backend API

```bash
# Health check
curl http://localhost:5000/health

# API info
curl http://localhost:5000/
```

### 7.2 Test Frontend

1. Open `http://localhost:5173`
2. Try registering a new user
3. Create a store
4. Add a product
5. Test shopping cart

### 7.3 Test Database Connection

```bash
curl http://localhost:5000/api/test/db-connection
```

## Step 8: Deployment (Optional)

### 8.1 Deploy Frontend to Vercel

See [Frontend Deployment Guide](./frontend/DEPLOYMENT.md)

### 8.2 Deploy Backend to Render

See [Backend Deployment Guide](./backend/DEPLOYMENT.md)

## Troubleshooting

### Backend Won't Start

1. **Check Node version**: `node --version` (should be 18+)
2. **Check environment variables**: Ensure all required vars are set
3. **Check database connection**: Verify Supabase credentials
4. **Check port**: Ensure port 5000 is not in use

### Frontend Won't Start

1. **Check Node version**: `node --version` (should be 18+)
2. **Check API URL**: Verify `VITE_API_URL` is correct
3. **Check CORS**: Ensure backend CORS allows frontend URL
4. **Clear cache**: `rm -rf node_modules && npm install`

### Database Connection Issues

1. **Verify credentials**: Check Supabase URL and keys
2. **Check RLS policies**: Ensure policies are set up correctly
3. **Check network**: Ensure you can access Supabase
4. **Check logs**: Review Supabase dashboard logs

### CORS Errors

1. **Check FRONTEND_URL**: Ensure it matches your frontend URL
2. **Check CORS config**: Verify backend CORS settings
3. **Check headers**: Ensure Authorization header is sent

## Next Steps

- Read [Testing Guide](./TESTING.md)
- Review [API Documentation](./backend/README.md)
- Check [Security Guide](./backend/SECURITY.md)
- Explore [Optimization Guide](./backend/OPTIMIZATION.md)

## Getting Help

- Check [Documentation](./README.md)
- Review [FAQ](#) (coming soon)
- Open an [Issue](https://github.com/your-username/dukaan-clone/issues)
- Check [Discussions](https://github.com/your-username/dukaan-clone/discussions)

## Congratulations! 🎉

You've successfully set up Dukaan Clone! Start building your e-commerce platform.

