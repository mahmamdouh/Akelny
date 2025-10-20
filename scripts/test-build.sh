#!/bin/bash

# Test Build Script - Just test if the backend builds successfully
# This script only tests the build without deploying

echo "🔧 Testing backend build..."

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: backend/package.json not found. Please run this script from the Akelny root directory."
    exit 1
fi

# Test TypeScript compilation
echo "📝 Testing TypeScript compilation..."
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Test build
echo "🏗️  Testing build..."
if npm run build; then
    echo "✅ Build successful!"
    echo "📁 Built files are in backend/dist/"
    ls -la dist/ 2>/dev/null || echo "No dist directory found"
else
    echo "❌ Build failed!"
    exit 1
fi

# Test if main files exist
if [ -f "dist/index.js" ]; then
    echo "✅ Main application file created: dist/index.js"
else
    echo "❌ Main application file missing: dist/index.js"
    exit 1
fi

echo ""
echo "🎉 Backend build test completed successfully!"
echo "📋 Next steps:"
echo "   1. Run the safe deployment: ../scripts/safe-deploy.sh"
echo "   2. Or test locally: npm start"