# Vercel Full-Stack Deployment Guide

This guide covers deploying the complete application (frontend + backend) to Vercel as serverless functions.

## Architecture

- **Frontend**: React + Vite → Served as static files
- **Backend**: Express API → Converted to Vercel serverless functions
- **Database**: MySQL (external, must be accessible from Vercel)

## Prerequisites

1. Vercel account (free tier available)
2. MySQL database accessible from the internet
3. Git repository (GitHub recommended)

## Step 1: Prepare Environment Variables

In Vercel dashboard, add these environment variables:

### Database Configuration
```
DB_HOST=your_mysql_host
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_database_name
```

### Optional
```
GROQ_API_KEY=your_groq_key (for chatbot features)
NODE_ENV=production
```

**Note**: `VITE_API_URL` is NOT needed - the frontend automatically uses `/api` when deployed to Vercel.

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `dcw_dashboard-main` (or leave blank if repo root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Add environment variables (from Step 1)
6. Click "Deploy"

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd dcw_dashboard-main
vercel

# Follow prompts, then:
vercel --prod
```

## Step 3: Verify Deployment

1. **Check Frontend**: Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
2. **Check Backend**: Visit `https://your-app.vercel.app/api/health`
   - Should return: `{"status":"ok","database":"connected",...}`
3. **Test API**: Visit `https://your-app.vercel.app/api/sales/overview?days=30`

## Important Notes

### Database Connection

- **Connection Pooling**: The serverless function creates a new connection per request (no pooling)
- **Cold Starts**: First request after inactivity may be slower (2-5 seconds)
- **Connection Limits**: Ensure your MySQL server allows connections from Vercel's IP ranges

### Performance Considerations

1. **Cold Starts**: First request after ~10 minutes of inactivity will be slower
2. **Function Timeout**: Set to 60 seconds (Pro plan) or 10 seconds (Hobby plan)
3. **Database Queries**: Complex queries may timeout on Hobby plan

### Limitations

- **No Background Jobs**: Scheduled tasks won't work (use external cron services)
- **No Persistent Storage**: Can't store files locally
- **Function Memory**: Limited by Vercel plan (1GB on Pro)
- **Concurrent Executions**: Limited by plan

## Troubleshooting

### Database Connection Failed

1. **Check Firewall**: Ensure MySQL allows connections from Vercel IPs
2. **Verify Credentials**: Double-check environment variables
3. **Test Connection**: Use MySQL client to test connection from external IP
4. **Check Logs**: View function logs in Vercel dashboard

### API Returns 500 Errors

1. **Check Function Logs**: Vercel dashboard → Functions → View logs
2. **Verify Environment Variables**: All DB variables set correctly
3. **Check Database**: Ensure database is accessible
4. **Timeout Issues**: Complex queries may exceed function timeout

### Frontend Can't Connect to API

1. **Check API URL**: Should be `/api` (relative) when deployed
2. **CORS**: Should be handled automatically
3. **Network Tab**: Check browser console for errors
4. **Verify Routes**: Ensure `/api/*` routes are working

### Cold Start Issues

- **Warm Functions**: Use a cron service (e.g., cron-job.org) to ping `/api/health` every 5 minutes
- **Optimize Queries**: Reduce query complexity
- **Upgrade Plan**: Pro plan has better cold start performance

## Cost Estimation

**Vercel Hobby (Free)**:
- 100GB bandwidth/month
- 100 serverless function executions/day
- 10 second function timeout

**Vercel Pro ($20/month)**:
- Unlimited bandwidth
- Unlimited function executions
- 60 second function timeout
- Better cold start performance

**For Production**: Pro plan recommended for better performance and reliability.

## Alternative: Hybrid Deployment

If serverless functions don't meet your needs:

1. **Frontend**: Deploy to Vercel (static hosting)
2. **Backend**: Deploy to Railway/Render (persistent server)
3. **Update API URL**: Set `VITE_API_URL` to your backend URL

This gives you:
- ✅ Better database connection pooling
- ✅ No cold starts
- ✅ Background job support
- ✅ More control

See `DEPLOYMENT.md` for hybrid deployment guide.

## Support

For issues:
1. Check Vercel function logs
2. Review this guide's troubleshooting section
3. Check database connectivity
4. Verify environment variables

