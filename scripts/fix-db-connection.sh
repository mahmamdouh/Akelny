#!/bin/bash

echo "🔧 Fixing Database Connection Issue..."
echo ""

echo "Step 1: Restarting PostgreSQL container..."
docker-compose -p akelny restart postgres
sleep 5

echo "Step 2: Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker-compose -p akelny exec postgres pg_isready -U akelny_user -d akelny >/dev/null 2>&1; then
        echo "✅ PostgreSQL is ready"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done

echo "Step 3: Testing database connection..."
docker-compose -p akelny exec postgres psql -U akelny_user -d akelny -c "SELECT 'Database is accessible' as status;"

echo "Step 4: Restarting backend container..."
docker-compose -p akelny restart backend
sleep 10

echo "Step 5: Checking backend health..."
for i in {1..20}; do
    HEALTH=$(curl -s http://localhost:3001/health 2>/dev/null)
    if echo "$HEALTH" | grep -q '"status":"healthy"'; then
        echo "✅ Backend is now healthy!"
        echo "$HEALTH" | jq . 2>/dev/null || echo "$HEALTH"
        exit 0
    fi
    echo "Waiting for backend... ($i/20)"
    sleep 3
done

echo "❌ Backend still unhealthy. Checking logs..."
docker-compose -p akelny logs --tail=50 backend

echo ""
echo "💡 Try these manual steps:"
echo "1. Check database password: docker-compose -p akelny exec postgres psql -U akelny_user -d akelny"
echo "2. View full logs: docker-compose -p akelny logs backend"
echo "3. Restart all: docker-compose -p akelny restart"
