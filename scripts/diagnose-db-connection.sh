#!/bin/bash

echo "🔍 Diagnosing Database Connection Issue..."
echo ""

echo "1️⃣ Checking PostgreSQL Container Status:"
docker-compose -p akelny ps postgres
echo ""

echo "2️⃣ Checking Backend Container Status:"
docker-compose -p akelny ps backend
echo ""

echo "3️⃣ Testing Network Connectivity (backend -> postgres):"
docker-compose -p akelny exec backend ping -c 3 postgres 2>&1 || echo "Ping failed"
echo ""

echo "4️⃣ Checking PostgreSQL Logs (last 20 lines):"
docker-compose -p akelny logs --tail=20 postgres
echo ""

echo "5️⃣ Checking Backend Environment Variables:"
docker-compose -p akelny exec backend env | grep -E "DB_|REDIS_|NODE_ENV"
echo ""

echo "6️⃣ Testing PostgreSQL Connection from Backend:"
docker-compose -p akelny exec backend sh -c 'psql -h postgres -U akelny_user -d akelny -c "SELECT version();"' 2>&1 || echo "Direct connection failed"
echo ""

echo "7️⃣ Checking if PostgreSQL is accepting connections:"
docker-compose -p akelny exec postgres pg_isready -U akelny_user -d akelny
echo ""

echo "8️⃣ Checking Backend Application Logs (last 30 lines):"
docker-compose -p akelny logs --tail=30 backend
echo ""

echo "9️⃣ Testing Health Endpoint:"
curl -s http://localhost:3001/health | jq . 2>/dev/null || curl -s http://localhost:3001/health
echo ""

echo "🔟 Checking Docker Network:"
docker network inspect akelny_akelny-network | grep -A 10 "Containers"
echo ""

echo "✅ Diagnosis Complete!"
