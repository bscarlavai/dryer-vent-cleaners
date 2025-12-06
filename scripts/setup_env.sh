#!/bin/bash

# Setup environment variables for Cloudflare Workers deployment
echo "🔧 Setting up environment variables for Self Car Wash Finder..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found"
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

# Export variables for deployment
export SUPABASE_URL
export SUPABASE_ANON_KEY
export NODE_ENV="production"

echo "✅ Environment variables loaded:"
echo "   SUPABASE_URL: ${SUPABASE_URL:0:20}..."
echo "   SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:0:20}..."
echo "   NODE_ENV: $NODE_ENV"

echo ""
echo "🚀 You can now run the deployment script:"
echo "   ./scripts/deploy.sh"
echo ""
echo "Or deploy manually with:"
echo "   npm run build:cloudflare"
echo "   npx wrangler deploy --var SUPABASE_URL='$SUPABASE_URL' --var SUPABASE_ANON_KEY='$SUPABASE_ANON_KEY'" 