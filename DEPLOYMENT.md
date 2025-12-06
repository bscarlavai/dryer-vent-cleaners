# Cloudflare Workers Deployment Guide

This guide will help you deploy your Self Car Wash Finder Directory to Cloudflare Workers with proper environment variable configuration.

## Prerequisites

1. **Cloudflare Account**: Make sure you have a Cloudflare account and are logged in
2. **Wrangler CLI**: Install Wrangler CLI globally
   ```bash
   npm install -g wrangler
   ```
3. **Supabase Project**: Ensure your Supabase project is set up with the required tables

## Step 1: Set Up Environment Variables

### Option A: Using the Setup Script (Recommended)

1. Create a `.env.local` file in your project root:
   ```bash
   touch .env.local
   ```

2. Add your Supabase credentials to `.env.local`:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. Run the setup script:
   ```bash
   npm run setup:env
   ```

### Option B: Manual Setup

1. Set environment variables in your terminal:
   ```bash
   export SUPABASE_URL="https://your-project-id.supabase.co"
   export SUPABASE_ANON_KEY="your-supabase-anon-key"
   export NODE_ENV="production"
   ```

## Step 2: Deploy to Cloudflare Workers

### Option A: Using the Deployment Script (Recommended)

```bash
npm run deploy:prod
```

### Option B: Manual Deployment

1. Build the project:
   ```bash
   npm run build:cloudflare
   ```

2. Deploy with environment variables:
   ```bash
   npx wrangler deploy \
     --var SUPABASE_URL="$SUPABASE_URL" \
     --var SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
     --var NODE_ENV="production"
   ```

## Step 3: Verify Deployment

1. Check the deployment status in your Cloudflare dashboard
2. Visit your deployed URL (usually `https://self-car-wash-finder.your-subdomain.workers.dev`)
3. Test the search functionality and database connections

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | ✅ |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key | ✅ |
| `NODE_ENV` | Environment (production/development) | ✅ |

## Troubleshooting

### Common Issues

1. **"Environment variables not found"**
   - Make sure your `.env.local` file exists and contains the correct variables
   - Verify the variable names match exactly

2. **"Build failed"**
   - Check that all dependencies are installed: `npm install`
   - Ensure you're using Node.js 18 or higher

3. **"Deployment failed"**
   - Verify your Cloudflare account has Workers enabled
   - Check that you're logged in to Wrangler: `wrangler login`

4. **"Database connection failed"**
   - Verify your Supabase URL and key are correct
   - Check that your Supabase project is active
   - Ensure your database tables exist

### Debug Commands

```bash
# Test environment variables
npm run setup:env

# Preview deployment locally
npm run preview

# Check Wrangler configuration
npx wrangler whoami

# View deployment logs
npx wrangler tail
```

## Security Notes

- Never commit your `.env.local` file to version control
- Use the anon key, not the service role key for client-side operations
- Consider using Cloudflare's secret management for sensitive variables

## Performance Optimization

- The deployment includes automatic image optimization
- Static assets are served from Cloudflare's global CDN
- Database queries are optimized for the Workers environment

## Monitoring

After deployment, monitor your application using:
- Cloudflare Analytics
- Supabase Dashboard for database performance
- Browser developer tools for client-side performance

## Support

If you encounter issues:
1. Check the Cloudflare Workers documentation
2. Review the OpenNext documentation
3. Check your Supabase project logs
4. Verify your environment variables are correctly set 