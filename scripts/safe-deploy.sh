#!/bin/bash

# Safe Deployment Script for Akelny
# This script deploys only Akelny services without affecting other Docker containers

set -e

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_NAME="akelny"
COMPOSE_PROJECT_NAME="akelny"

echo "🚀 Starting safe Akelny deployment for $ENVIRONMENT environment..."

# Set Docker Compose project name to avoid conflicts
export COMPOSE_PROJECT_NAME=$COMPOSE_PROJECT_NAME

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f ".env.production" ]; then
        cp .env.production .env
    else
        echo "❌ No .env.production template found. Please create .env file manually."
        exit 1
    fi
    echo "📝 Please edit .env file with your actual configuration values"
    echo "🔑 Don't forget to set secure passwords and secrets!"
    read -p "Press Enter after updating .env file..."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/logs
mkdir -p backend/uploads/meals
mkdir -p backend/uploads/ingredients
mkdir -p backend/uploads/users
mkdir -p nginx/conf.d
mkdir -p certbot/conf
mkdir -p certbot/www

# Set proper permissions
chmod -R 755 backend/logs 2>/dev/null || true
chmod -R 755 backend/uploads 2>/dev/null || true

# Stop only Akelny services (not all Docker containers)
echo "🛑 Stopping existing Akelny services..."
docker-compose -p $COMPOSE_PROJECT_NAME down 2>/dev/null || true

# Build backend image
echo "🏗️  Building backend image..."
docker-compose -p $COMPOSE_PROJECT_NAME build --no-cache backend

# Start database and cache first
echo "🗄️  Starting database and cache services..."
docker-compose -p $COMPOSE_PROJECT_NAME up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
for i in {1..30}; do
    if docker-compose -p $COMPOSE_PROJECT_NAME exec -T postgres pg_isready -U akelny_user -d akelny >/dev/null 2>&1; then
        echo "✅ Database is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Database failed to start within 30 seconds"
        docker-compose -p $COMPOSE_PROJECT_NAME logs postgres
        exit 1
    fi
    sleep 1
done

# Run database migrations
echo "🗄️  Running database migrations..."
if [ -f "backend/src/migrations/001_create_core_tables.sql" ]; then
    echo "Running core tables migration..."
    docker-compose -p $COMPOSE_PROJECT_NAME exec -T postgres psql -U akelny_user -d akelny -f /docker-entrypoint-initdb.d/001_create_core_tables.sql || echo "⚠️  Core tables migration had issues, continuing..."
fi

if [ -f "backend/src/migrations/002_create_indexes.sql" ]; then
    echo "Running indexes migration..."
    docker-compose -p $COMPOSE_PROJECT_NAME exec -T postgres psql -U akelny_user -d akelny -f /docker-entrypoint-initdb.d/002_create_indexes.sql || echo "⚠️  Indexes migration had issues, continuing..."
fi

# Start backend
echo "🔧 Starting backend service..."
docker-compose -p $COMPOSE_PROJECT_NAME up -d backend

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
for i in {1..60}; do
    if curl -f http://localhost:3001/health >/dev/null 2>&1; then
        echo "✅ Backend is ready"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "❌ Backend failed to start within 60 seconds"
        docker-compose -p $COMPOSE_PROJECT_NAME logs backend
        exit 1
    fi
    sleep 1
done

# Start nginx (only if not conflicting with existing nginx)
if ! pgrep nginx > /dev/null; then
    echo "🌐 Starting nginx service..."
    docker-compose -p $COMPOSE_PROJECT_NAME up -d nginx
else
    echo "⚠️  Nginx is already running on the system, skipping Docker nginx"
fi

# Display service status
echo "📊 Akelny Service Status:"
docker-compose -p $COMPOSE_PROJECT_NAME ps

# Health checks
echo "🏥 Performing health checks..."

# Check backend health
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    docker-compose -p $COMPOSE_PROJECT_NAME logs backend
fi

# Display useful information
echo ""
echo "🎉 Safe deployment completed!"
echo ""
echo "📋 Service Information:"
echo "   🔧 Direct API: http://localhost:3001/api"
echo "   🏥 Health Check: http://localhost:3001/health"
echo "   📊 Performance Dashboard: http://localhost:3001/dashboard"
echo "   🗄️  Database: localhost:5433"
echo "   ⚡ Redis: localhost:6380"
echo ""
echo "📝 Useful Commands:"
echo "   View logs: docker-compose -p $COMPOSE_PROJECT_NAME logs -f [service]"
echo "   Restart service: docker-compose -p $COMPOSE_PROJECT_NAME restart [service]"
echo "   Stop Akelny services: docker-compose -p $COMPOSE_PROJECT_NAME down"
echo "   Update: git pull && ./scripts/safe-deploy.sh"
echo ""
echo "🔧 Next Steps:"
echo "   1. Test the API endpoints: curl http://localhost:3001/health"
echo "   2. Check service logs if needed"
echo "   3. Configure your domain to point to this server"
echo ""

# Final status check
echo "🔍 Final Status Check:"
echo "Backend API: $(curl -s http://localhost:3001/health | jq -r '.status // "ERROR"' 2>/dev/null || echo "ERROR")"
echo "Database: $(docker-compose -p $COMPOSE_PROJECT_NAME exec -T postgres pg_isready -U akelny_user -d akelny >/dev/null 2>&1 && echo "READY" || echo "ERROR")"
echo "Redis: $(docker-compose -p $COMPOSE_PROJECT_NAME exec -T redis redis-cli ping 2>/dev/null || echo "ERROR")"