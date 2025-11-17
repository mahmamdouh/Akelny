#!/bin/bash

echo "🔄 Rebuilding backend with better logging..."
echo ""

echo "Step 1: Stop backend..."
docker-compose -p akelny stop backend

echo "Step 2: Rebuild backend image..."
docker-compose -p akelny build --no-cache backend

echo "Step 3: Start backend..."
docker-compose -p akelny up -d backend

echo "Step 4: Follow logs (Ctrl+C to stop)..."
echo "Watch for: 'About to call app.listen' message"
echo ""
docker-compose -p akelny logs -f backend
