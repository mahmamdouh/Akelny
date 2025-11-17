#!/bin/bash

echo "🔍 Checking Akelny Backend Status..."
echo ""

echo "📊 Container Status:"
docker-compose -p akelny ps backend
echo ""

echo "📋 Recent Logs (last 50 lines):"
docker-compose -p akelny logs --tail=50 backend
echo ""

echo "🏥 Health Check Test:"
echo "Testing: curl http://localhost:3001/health"
curl -v http://localhost:3001/health 2>&1 || echo "Health check failed"
echo ""

echo "🔧 Container Details:"
docker inspect akelny-backend --format='{{.State.Health.Status}}: {{range .State.Health.Log}}{{.Output}}{{end}}'
echo ""

echo "📡 Network Test:"
docker-compose -p akelny exec backend curl -f http://localhost:3000/health 2>&1 || echo "Internal health check failed"
