#!/bin/bash

# Quick Fix and Deploy Script
# This script fixes TypeScript issues and deploys safely

echo "🔧 Quick fix and deploy for Akelny..."

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -p akelny down 2>/dev/null || true

# Test TypeScript compilation locally first
echo "📝 Testing TypeScript compilation..."
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Test compilation
echo "🔍 Testing TypeScript compilation..."
if npx tsc --noEmit; then
    echo "✅ TypeScript compilation successful!"
else
    echo "❌ TypeScript compilation failed!"
    echo "Please fix the TypeScript errors before deploying."
    exit 1
fi

cd ..

# Now deploy with Docker
echo "🚀 Starting Docker deployment..."

# Build and start services
docker-compose -p akelny build --no-cache backend
docker-compose -p akelny up -d postgres redis

# Wait for database
echo "⏳ Waiting for database..."
sleep 30

# Run migrations
echo "🗄️  Running migrations..."
docker-compose -p akelny exec -T postgres psql -U akelny_user -d akelny -f /docker-entrypoint-initdb.d/001_create_core_tables.sql || echo "Migration 1 had issues"
docker-compose -p akelny exec -T postgres psql -U akelny_user -d akelny -f /docker-entrypoint-initdb.d/002_create_indexes.sql || echo "Migration 2 had issues"

# Start backend
echo "🔧 Starting backend..."
docker-compose -p akelny up -d backend

# Wait and test
echo "⏳ Waiting for backend to start..."
sleep 30

# Test health
if curl -f http://localhost:3001/health >/dev/null 2>&1; then
    echo "✅ Backend is healthy!"
    echo "🎉 Deployment successful!"
    echo ""
    echo "📋 Access points:"
    echo "   API: http://localhost:3001/api"
    echo "   Health: http://localhost:3001/health"
    echo "   Dashboard: http://localhost:3001/dashboard"
else
    echo "❌ Backend health check failed"
    echo "📋 Checking logs..."
    docker-compose -p akelny logs backend
    exit 1
fi