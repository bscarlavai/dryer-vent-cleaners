#!/bin/bash

# Deploy to Cloudflare Workers with environment variables
# Make sure to set your Supabase credentials before running this script

echo "🚀 Deploying Self Car Wash Finder to Cloudflare Workers..."

# Check if .env.local exists and load it
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please create a .env.local file with your Supabase credentials:"
    echo ""
    echo "SUPABASE_URL=your-supabase-url"
    echo "SUPABASE_ANON_KEY=your-supabase-anon-key"
    echo ""
    exit 1
fi

# Load environment variables from .env.local
echo "📖 Loading environment variables from .env.local..."
source .env.local

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ Error: SUPABASE_URL environment variable is not set in .env.local"
    echo "Please add SUPABASE_URL=your-supabase-url to your .env.local file"
    exit 1
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: SUPABASE_ANON_KEY environment variable is not set in .env.local"
    echo "Please add SUPABASE_ANON_KEY=your-supabase-anon-key to your .env.local file"
    exit 1
fi

echo "✅ Environment variables loaded:"
echo "   SUPABASE_URL: ${SUPABASE_URL:0:20}..."
echo "   SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:0:20}..."

# Build the project
echo "📦 Building project..."
npm run build:cloudflare

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed"

# Deploy to Cloudflare Workers with environment variables
echo "🌐 Deploying to Cloudflare Workers..."
npx wrangler deploy \
    --var SUPABASE_URL="$SUPABASE_URL" \
    --var SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
    --var NODE_ENV="production"

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌍 Your app is now live on Cloudflare Workers"
else
    echo "❌ Deployment failed"
    exit 1
fi 