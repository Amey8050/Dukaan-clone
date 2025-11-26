# Frontend Deployment Guide - Vercel

This guide will help you deploy the Dukaan Clone frontend to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab/Bitbucket Account**: Your code should be in a Git repository
3. **Backend API**: Your backend should be deployed and accessible (e.g., Render, Heroku, etc.)

## Deployment Steps

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to Git Repository**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Import Project in Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your Git repository
   - Select the `frontend` folder as the root directory

3. **Configure Environment Variables**
   - In Vercel project settings, go to "Environment Variables"
   - Add the following:
     ```
     VITE_API_URL=https://your-backend-url.onrender.com
     ```
   - Replace with your actual backend URL

4. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Navigate to Frontend Directory**
   ```bash
   cd frontend
   ```

4. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts
   - Set environment variables when prompted
   - Choose production deployment

5. **Set Environment Variables**
   ```bash
   vercel env add VITE_API_URL
   ```
   - Enter your backend API URL when prompted

6. **Redeploy with Environment Variables**
   ```bash
   vercel --prod
   ```

## Environment Variables

### Required Variables

- `VITE_API_URL`: Your backend API URL
  - Example: `https://your-backend.onrender.com`
  - Default: `http://localhost:5000` (development)

### Setting Environment Variables in Vercel

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable:
   - **Name**: `VITE_API_URL`
   - **Value**: Your backend URL
   - **Environment**: Production, Preview, Development (select all)

## Build Configuration

The project uses Vite with the following build settings:

- **Framework**: Vite + React
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x or higher

## Custom Domain Setup

1. **Add Domain in Vercel**
   - Go to project settings
   - Navigate to "Domains"
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Configure DNS**
   - Add CNAME record pointing to Vercel
   - Wait for DNS propagation (can take up to 48 hours)

## Continuous Deployment

Vercel automatically deploys when you push to your Git repository:

- **Production**: Deploys from `main` branch
- **Preview**: Deploys from other branches/PRs

### Branch Protection

To ensure only production-ready code is deployed:

1. Enable branch protection in Git
2. Require pull request reviews
3. Run tests before merging

## Performance Optimization

### Already Configured

- ✅ Code splitting
- ✅ Lazy loading
- ✅ Image optimization
- ✅ Gzip compression
- ✅ Cache headers
- ✅ Security headers

### Vercel Optimizations

Vercel automatically provides:
- Edge network (CDN)
- Automatic HTTPS
- Image optimization
- Analytics (optional)

## Monitoring

### Vercel Analytics

1. Enable Analytics in project settings
2. View performance metrics
3. Monitor Core Web Vitals

### Error Tracking

Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Vercel Analytics for performance

## Troubleshooting

### Build Failures

1. **Check Build Logs**
   - Go to deployment page
   - View build logs
   - Check for errors

2. **Common Issues**
   - Missing environment variables
   - Node version mismatch
   - Dependency issues
   - Build command errors

### Environment Variables Not Working

1. **Check Variable Names**
   - Must start with `VITE_` for Vite
   - Case-sensitive

2. **Redeploy After Changes**
   - Environment variable changes require redeployment

3. **Check Environment Scope**
   - Ensure variables are set for correct environment

### API Connection Issues

1. **Check CORS Settings**
   - Ensure backend allows your Vercel domain
   - Check CORS configuration

2. **Check API URL**
   - Verify `VITE_API_URL` is correct
   - Ensure backend is accessible

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Backend API accessible
- [ ] CORS configured on backend
- [ ] Custom domain configured (if applicable)
- [ ] Analytics enabled (optional)
- [ ] Error tracking set up (optional)
- [ ] Performance tested
- [ ] Security headers verified

## Rollback

If something goes wrong:

1. **Via Dashboard**
   - Go to deployments
   - Find previous working deployment
   - Click "Promote to Production"

2. **Via CLI**
   ```bash
   vercel rollback
   ```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## Support

If you encounter issues:
1. Check Vercel build logs
2. Review error messages
3. Check environment variables
4. Verify backend connectivity
5. Consult Vercel documentation

