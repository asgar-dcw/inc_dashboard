# Deployment Guide: IncStores Dashboard

This guide covers deploying the complete application stack to production.

## Architecture Overview

The application consists of two main components:

1. **Frontend**: React + Vite application → Deploy to **Vercel**
2. **Backend**: Node.js + Express API → Deploy to **Railway** or **Render**

## Prerequisites

- Node.js 20+ installed locally
- Git repository set up
- MySQL database accessible from the internet (or use a managed database service)
- Accounts on:
  - [Vercel](https://vercel.com) (free tier available)
  - [Railway](https://railway.app) or [Render](https://render.com) (free tiers available)

---

## Step 1: Backend Deployment (Railway or Render)

### Option A: Deploy to Railway (Recommended)

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select the `dcw_dashboard-main/backend` directory

3. **Configure Environment Variables**
   In Railway dashboard, go to Variables tab and add:
   ```
   PORT=3001
   NODE_ENV=production
   DB_HOST=your_mysql_host
   DB_PORT=3306
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_database_name
   CORS_ORIGINS=https://your-vercel-app.vercel.app
   GROQ_API_KEY=your_groq_key (optional)
   ```

4. **Configure Build Settings**
   - Root Directory: `dcw_dashboard-main/backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

5. **Get Backend URL**
   - Railway will provide a URL like: `https://your-app.railway.app`
   - Note this URL for frontend configuration

### Option B: Deploy to Render

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `dcw-dashboard-backend`
     - **Root Directory**: `dcw_dashboard-main/backend`
     - **Environment**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`

3. **Add Environment Variables** (same as Railway above)

4. **Get Backend URL**
   - Render will provide: `https://your-app.onrender.com`

---

## Step 2: Frontend Deployment (Vercel)

### Deploy to Vercel

1. **Install Vercel CLI** (optional, or use web interface)
   ```bash
   npm i -g vercel
   ```

2. **Deploy via Vercel Dashboard**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: `dcw_dashboard-main`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`

3. **Configure Environment Variables**
   In Vercel project settings → Environment Variables, add:
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   ```
   (Replace with your actual backend URL from Step 1)

4. **Redeploy**
   - After adding environment variables, trigger a new deployment

### Deploy via CLI

```bash
cd dcw_dashboard-main
vercel
# Follow prompts, then:
vercel --prod
```

---

## Step 3: Update CORS Configuration

After deploying the frontend, update the backend CORS settings:

1. Go to your backend deployment (Railway/Render)
2. Add your Vercel frontend URL to `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=https://your-app.vercel.app,https://your-app-git-main.vercel.app
   ```
3. Redeploy the backend

---

## Step 4: Database Configuration

### Option A: Use Existing MySQL Database

If your MySQL database is already accessible:
- Ensure it allows connections from your hosting provider's IP ranges
- Use the connection details in backend environment variables

### Option B: Use Managed Database

**Railway Database:**
- Railway offers MySQL databases
- Create a new MySQL service in Railway
- Use the connection string provided

**Render Database:**
- Render offers PostgreSQL (you'd need to migrate) or external MySQL

**Other Options:**
- [PlanetScale](https://planetscale.com) - MySQL compatible
- [Supabase](https://supabase.com) - PostgreSQL
- [AWS RDS](https://aws.amazon.com/rds/) - MySQL/PostgreSQL

---

## Step 5: Verify Deployment

1. **Check Backend Health**
   ```
   https://your-backend-url.railway.app/health
   ```
   Should return: `{"status":"ok","database":"connected",...}`

2. **Check Frontend**
   - Visit your Vercel URL
   - Open browser console (F12)
   - Verify API calls are going to your backend URL

3. **Test Key Features**
   - Dashboard loads data
   - Charts render correctly
   - API endpoints respond

---

## Troubleshooting

### Backend Issues

**Database Connection Failed:**
- Verify database credentials
- Check if database allows external connections
- Verify firewall rules allow your hosting provider's IPs

**CORS Errors:**
- Ensure frontend URL is in `CORS_ORIGINS`
- Check that backend is using the correct origin

**Build Failures:**
- Check Node.js version (should be 20+)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

### Frontend Issues

**API Calls Failing:**
- Verify `VITE_API_URL` is set correctly
- Check browser console for CORS errors
- Verify backend is running and accessible

**Build Errors:**
- Check that all environment variables are set
- Verify `vite.config.ts` is correct
- Check build logs in Vercel dashboard

---

## Environment Variables Reference

### Frontend (.env.local or Vercel)
```
VITE_API_URL=https://your-backend-url.railway.app/api
```

### Backend (Railway/Render)
```
PORT=3001
NODE_ENV=production
DB_HOST=your_mysql_host
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_database_name
CORS_ORIGINS=https://your-frontend.vercel.app
GROQ_API_KEY=optional
```

---

## Cost Estimation

**Free Tier Limits:**
- **Vercel**: Unlimited deployments, 100GB bandwidth/month
- **Railway**: $5/month free credit (usually enough for small apps)
- **Render**: Free tier available (with limitations)

**For Production:**
- Consider paid tiers for better performance and reliability
- Estimated cost: $10-20/month for small-medium traffic

---

## Continuous Deployment

Both Vercel and Railway/Render support automatic deployments:
- Push to `main` branch → Auto-deploy
- Pull requests → Preview deployments (Vercel)

---

## Security Considerations

1. **Never commit `.env` files** - Use environment variables in hosting platforms
2. **Use HTTPS** - Both Vercel and Railway/Render provide SSL by default
3. **Database Security** - Use strong passwords, restrict IP access if possible
4. **API Keys** - Store in environment variables, never in code

---

## Alternative: Single Platform Deployment

If you prefer to deploy everything on one platform:

### Vercel (Frontend + Serverless Functions)
- Frontend: Standard Vercel deployment
- Backend: Convert Express routes to Vercel serverless functions
- **Note**: This requires significant refactoring and may have limitations with MySQL connection pooling

### Railway (Full Stack)
- Deploy both frontend and backend to Railway
- Use Railway's static site hosting for frontend
- Use Railway's web service for backend

---

## Support

For issues or questions:
1. Check deployment logs in your hosting platform
2. Review this guide's troubleshooting section
3. Check application logs for specific errors

