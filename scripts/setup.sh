#!/bin/bash

# Bait Shops USA - Development Setup Script

echo "🎣 Setting up Bait Shops USA directory website..."

# Check if nvm is installed
if ! command -v nvm &> /dev/null; then
    echo "❌ nvm (Node Version Manager) is not installed or not in PATH"
    echo "Please install nvm from: https://github.com/nvm-sh/nvm"
    exit 1
fi

# Use the specified Node version
echo "📦 Switching to Node.js 20.16.0..."
nvm use 20.16.0

if [ $? -ne 0 ]; then
    echo "⚠️  Node.js 20.16.0 not found. Installing..."
    nvm install 20.16.0
    nvm use 20.16.0
fi

# Install dependencies
echo "🔄 Installing dependencies..."
npm install

# Check if everything is working
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the development server:"
echo "   npm run dev"
echo ""
echo "🌐 Your website will be available at:"
echo "   http://localhost:3000"
echo ""
echo "📁 Project structure:"
echo "   ├── app/           - Next.js 14 App Router pages"
echo "   ├── components/    - Reusable React components"
echo "   ├── public/        - Static assets"
echo "   └── README.md      - Full documentation" 