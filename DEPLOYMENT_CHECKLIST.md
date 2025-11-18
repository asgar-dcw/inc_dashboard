# Deployment Checklist

Use this checklist to ensure a smooth deployment process.

## Pre-Deployment

- [ ] **Code is committed and pushed to Git**
  ```bash
  git add .
  git commit -m "Prepare for deployment"
  git push origin main
  ```

- [ ] **Environment variables documented**
  - Frontend: `VITE_API_URL`
  - Backend: Database credentials, CORS origins, etc.

- [ ] **Database is accessible**
  - MySQL database is running
  - Connection credentials are ready
  - Database allows external connections (if needed)

- [ ] **Dependencies are up to date**
  ```bash
  cd dcw_dashboard-main
  npm install
  cd backend
  npm install
  ```

- [ ] **Builds work locally**
  ```bash
  # Frontend
  cd dcw_dashboard-main
  npm run build
  
  # Backend
  cd backend
  npm run build
  ```

## Backend Deployment

- [ ] **Choose hosting platform** (Railway or Render)
- [ ] **Create account and connect GitHub**
- [ ] **Create new project/service**
- [ ] **Set root directory** to `dcw_dashboard-main/backend`
- [ ] **Configure build command**: `npm install && npm run build`
- [ ] **Configure start command**: `npm start`
- [ ] **Add environment variables**:
  - `PORT=3001`
  - `NODE_ENV=production`
  - `DB_HOST=...`
  - `DB_PORT=3306`
  - `DB_USER=...`
  - `DB_PASSWORD=...`
  - `DB_NAME=...`
  - `CORS_ORIGINS=...` (will update after frontend deployment)
- [ ] **Deploy and verify**
  - Check deployment logs
  - Test health endpoint: `https://your-backend-url/health`
  - Verify database connection in logs

## Frontend Deployment

- [ ] **Create Vercel account** and connect GitHub
- [ ] **Import repository**
- [ ] **Configure project**:
  - Framework: Vite
  - Root Directory: `dcw_dashboard-main`
  - Build Command: `npm run build`
  - Output Directory: `dist`
- [ ] **Add environment variable**:
  - `VITE_API_URL=https://your-backend-url/api`
- [ ] **Deploy**
- [ ] **Get frontend URL** (e.g., `https://your-app.vercel.app`)

## Post-Deployment

- [ ] **Update backend CORS**
  - Add frontend URL to `CORS_ORIGINS` in backend environment variables
  - Redeploy backend

- [ ] **Test frontend**
  - Visit frontend URL
  - Check browser console for errors
  - Verify API calls are working

- [ ] **Test key features**:
  - [ ] Dashboard loads
  - [ ] Charts render
  - [ ] Sales data displays
  - [ ] Products page works
  - [ ] Customers page works
  - [ ] Intelligence features work
  - [ ] Pipeline forecast displays

- [ ] **Performance check**:
  - Page load times
  - API response times
  - Database query performance

## Troubleshooting

If something doesn't work:

1. **Check deployment logs** in your hosting platform
2. **Check browser console** for frontend errors
3. **Verify environment variables** are set correctly
4. **Test backend health endpoint** directly
5. **Check CORS configuration** if API calls fail
6. **Verify database connection** in backend logs

## Quick Commands

```bash
# Test backend locally
cd dcw_dashboard-main/backend
npm run dev

# Test frontend locally
cd dcw_dashboard-main
npm run dev

# Build for production
cd dcw_dashboard-main
npm run build
cd backend
npm run build
```

