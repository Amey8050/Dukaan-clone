# Backend Deployment Guide - Render

This guide will help you deploy the Dukaan Clone backend to Render.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub/GitLab/Bitbucket Account**: Your code should be in a Git repository
3. **Supabase Account**: Database setup (see `database/README.md`)
4. **Environment Variables**: All required variables ready

## Deployment Steps

### Method 1: Deploy via Render Dashboard (Recommended)

1. **Push to Git Repository**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Create New Web Service**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your Git repository
   - Select the repository

3. **Configure Service**
   - **Name**: `dukaan-backend` (or your preferred name)
   - **Region**: Choose closest to your users (e.g., Oregon, Singapore)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

4. **Set Environment Variables**
   Click "Advanced" → "Environment Variables" and add:
   
   **Required:**
   ```
   NODE_ENV=production
   PORT=10000
   FRONTEND_URL=https://your-frontend.vercel.app
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
   
   **Optional (for features):**
   ```
   RAZORPAY_KEY_ID=your-razorpay-key-id
   RAZORPAY_KEY_SECRET=your-razorpay-secret
   RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
   GEMINI_API_KEY=your-gemini-api-key
   JWT_SECRET=your-secret-key
   ```

5. **Configure Health Check**
   - **Health Check Path**: `/health`
   - This helps Render monitor your service

6. **Deploy**
   - Click "Create Web Service"
   - Wait for build to complete
   - Your API will be live at `https://your-service.onrender.com`

### Method 2: Deploy via render.yaml (Infrastructure as Code)

1. **Create render.yaml** (already created in project root)
   ```yaml
   services:
     - type: web
       name: dukaan-backend
       env: node
       buildCommand: npm install
       startCommand: npm start
       healthCheckPath: /health
   ```

2. **Deploy via Dashboard**
   - Go to Render Dashboard
   - Click "New +" → "Blueprint"
   - Connect repository
   - Render will detect `render.yaml`
   - Review and deploy

3. **Set Environment Variables**
   - Go to service settings
   - Add environment variables (same as Method 1)

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `10000` (Render default) |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-app.vercel.app` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGc...` |

### Optional Variables

| Variable | Description | When Needed |
|----------|-------------|-------------|
| `RAZORPAY_KEY_ID` | Razorpay API key | Payment features |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | Payment features |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret | Payment webhooks |
| `GEMINI_API_KEY` | Google Gemini API key | AI features |
| `JWT_SECRET` | JWT secret key | Custom auth (if used) |

## Build Configuration

- **Runtime**: Node.js 18.x or higher
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Health Check**: `/health`

## Health Check

The backend includes a health check endpoint at `/health`:

```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

## CORS Configuration

After deployment, update CORS settings:

1. **Get your Render URL**: `https://your-service.onrender.com`
2. **Update Frontend**: Set `VITE_API_URL` to your Render URL
3. **Backend CORS**: Already configured via `FRONTEND_URL` env var

## Continuous Deployment

Render automatically deploys when you push to your Git repository:

- **Production**: Deploys from `main` branch
- **Preview**: Deploys from other branches (if enabled)

### Branch Protection

To ensure only production-ready code is deployed:

1. Enable branch protection in Git
2. Require pull request reviews
3. Run tests before merging

## Monitoring

### Render Dashboard

- View logs in real-time
- Monitor service health
- Check deployment history
- View metrics (on paid plans)

### Health Checks

Render automatically checks `/health` endpoint:
- Checks every 30 seconds
- Restarts service if unhealthy
- Sends alerts on failures

## Scaling

### Free Plan
- 750 hours/month
- Sleeps after 15 minutes of inactivity
- Wakes on first request (may take 30-60 seconds)

### Paid Plans
- Always-on service
- Better performance
- More resources
- Custom domains

## Troubleshooting

### Service Won't Start

1. **Check Build Logs**
   - Go to service logs
   - Look for build errors
   - Check Node version

2. **Common Issues**
   - Missing environment variables
   - Port configuration (must use `PORT` env var)
   - Database connection issues
   - Missing dependencies

### Health Check Failing

1. **Verify Health Endpoint**
   ```bash
   curl https://your-service.onrender.com/health
   ```

2. **Check Logs**
   - View service logs
   - Look for errors
   - Check database connectivity

### Environment Variables Not Working

1. **Verify Variable Names**
   - Case-sensitive
   - No typos
   - Correct format

2. **Redeploy After Changes**
   - Environment variable changes require redeployment
   - Click "Manual Deploy" → "Deploy latest commit"

### Database Connection Issues

1. **Check Supabase Settings**
   - Verify credentials
   - Check database is accessible
   - Verify RLS policies

2. **Check Network**
   - Render can access Supabase
   - No firewall blocking
   - Correct URLs

## Post-Deployment Checklist

- [ ] Service deployed successfully
- [ ] Environment variables configured
- [ ] Health check passing
- [ ] Database connection working
- [ ] CORS configured correctly
- [ ] Frontend can connect to API
- [ ] Authentication working
- [ ] All endpoints tested
- [ ] Logs monitored
- [ ] Custom domain configured (optional)

## Custom Domain Setup

1. **Add Domain in Render**
   - Go to service settings
   - Navigate to "Custom Domains"
   - Add your domain
   - Follow DNS configuration instructions

2. **Configure DNS**
   - Add CNAME record pointing to Render
   - Wait for DNS propagation (can take up to 48 hours)

3. **SSL Certificate**
   - Render automatically provisions SSL
   - HTTPS enabled by default

## Performance Optimization

### Already Configured

- ✅ Response compression (gzip)
- ✅ Rate limiting
- ✅ Caching
- ✅ Security headers
- ✅ Input validation
- ✅ Error handling

### Render Optimizations

- Edge network (on paid plans)
- Automatic HTTPS
- Load balancing (on paid plans)
- Auto-scaling (on paid plans)

## Cost Considerations

### Free Plan
- 750 hours/month
- Sleeps after inactivity
- Good for development/testing

### Paid Plans
- Starts at $7/month
- Always-on service
- Better performance
- More resources

## Rollback

If something goes wrong:

1. **Via Dashboard**
   - Go to service
   - Click "Manual Deploy"
   - Select previous deployment
   - Click "Deploy"

2. **Via Git**
   ```bash
   git revert HEAD
   git push origin main
   ```

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/node)
- [Environment Variables](https://render.com/docs/environment-variables)

## Support

If you encounter issues:
1. Check Render service logs
2. Review error messages
3. Verify environment variables
4. Test database connectivity
5. Consult Render documentation

