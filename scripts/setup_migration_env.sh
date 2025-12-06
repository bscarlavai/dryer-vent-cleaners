#!/bin/bash

echo "🔧 Setting up environment variables for database migration..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found"
    echo "Creating .env.local file..."
    touch .env.local
fi

echo "📝 Please enter your Supabase credentials:"
echo ""

# Get Supabase URL
read -p "Enter your Supabase URL (e.g., https://your-project.supabase.co): " supabase_url
if [ -z "$supabase_url" ]; then
    echo "❌ Supabase URL is required"
    exit 1
fi

# Get Supabase Service Role Key
read -p "Enter your Supabase Service Role Key: " supabase_service_key
if [ -z "$supabase_service_key" ]; then
    echo "❌ Supabase Service Role Key is required"
    exit 1
fi

# Write to .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=$supabase_url" > .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=$supabase_service_key" >> .env.local

echo ""
echo "✅ Environment variables saved to .env.local"
echo ""
echo "🔑 To get these values from Supabase:"
echo "   1. Go to your Supabase dashboard"
echo "   2. Navigate to Settings > API"
echo "   3. Copy the 'Project URL' and 'service_role' key"
echo ""
echo "🚀 You can now run the migration:"
echo "   node scripts/migrate_to_google_id.js"
echo ""
echo "📝 Note: The .env.local file is already in .gitignore, so your credentials won't be committed" 