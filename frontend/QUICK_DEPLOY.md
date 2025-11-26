# Quick Deployment Guide - Vercel

## 🚀 Quick Start

### 1. Prepare Your Code
```bash
cd frontend
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Vercel

**Option A: Via Dashboard (Easiest)**
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Set root directory to `frontend`
5. Add environment variable: `VITE_API_URL=https://your-backend-url.onrender.com`
6. Click "Deploy"

**Option B: Via CLI**
```bash
npm install -g vercel
cd frontend
vercel login
vercel
# Follow prompts, set VITE_API_URL when asked
vercel --prod
```

### 3. Set Environment Variable
In Vercel project settings → Environment Variables:
- **Name**: `VITE_API_URL`
- **Value**: Your backend API URL (e.g., `https://your-backend.onrender.com`)
- **Environment**: Production, Preview, Development

### 4. Done! 🎉
Your app will be live at `https://your-project.vercel.app`

## 📋 Checklist

- [ ] Code pushed to Git
- [ ] Vercel account created
- [ ] Project imported
- [ ] Environment variable `VITE_API_URL` set
- [ ] Backend CORS configured for Vercel domain
- [ ] Deployment successful
- [ ] Tested on production URL

## 🔧 Troubleshooting

**Build fails?**
- Check build logs in Vercel dashboard
- Verify Node version (18.x+)
- Check environment variables

**API not connecting?**
- Verify `VITE_API_URL` is set correctly
- Check backend CORS settings
- Ensure backend is deployed and accessible

**404 errors on routes?**
- Check `vercel.json` rewrites configuration
- Ensure SPA routing is configured

## 📚 Full Documentation
See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

