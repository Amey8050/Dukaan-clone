# Quick Deployment Guide - Render

## 🚀 Quick Start

### 1. Prepare Your Code
```bash
cd backend
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Render

**Via Dashboard:**
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your Git repository
4. Configure:
   - **Name**: `dukaan-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
5. Add environment variables (see below)
6. Click "Create Web Service"

### 3. Set Environment Variables

In Render service settings → Environment Variables:

**Required:**
```
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-frontend.vercel.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Optional:**
```
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-secret
GEMINI_API_KEY=your-api-key
```

### 4. Update Frontend

Update `VITE_API_URL` in Vercel to your Render URL:
```
VITE_API_URL=https://your-service.onrender.com
```

### 5. Done! 🎉

Your API will be live at `https://your-service.onrender.com`

## 📋 Checklist

- [ ] Code pushed to Git
- [ ] Render account created
- [ ] Web service created
- [ ] Environment variables set
- [ ] Health check configured
- [ ] Service deployed successfully
- [ ] Frontend API URL updated
- [ ] CORS configured
- [ ] Tested API endpoints

## 🔧 Troubleshooting

**Service won't start?**
- Check build logs in Render dashboard
- Verify all environment variables are set
- Check Node version (18.x+)
- Verify PORT is set to 10000

**Health check failing?**
- Verify `/health` endpoint works
- Check service logs
- Verify database connection

**API not connecting?**
- Verify Render URL is correct
- Check CORS settings
- Ensure FRONTEND_URL is set correctly
- Test with curl: `curl https://your-service.onrender.com/health`

## 📚 Full Documentation
See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

