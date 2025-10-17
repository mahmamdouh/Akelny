#!/bin/bash

# Akelny Deployment Script
# Usage: ./scripts/deploy.sh [environment]

set -e

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_NAME="akelny"
DOMAIN="akelny.nabd-co.com"

echo "🚀 Starting Akelny deployment for $ENVIRONMENT environment..."

# Check and resolve port conflicts
echo "🔍 Checking for port conflicts..."
if [ -f "scripts/fix-port-conflicts.sh" ]; then
    chmod +x scripts/fix-port-conflicts.sh
    ./scripts/fix-port-conflicts.sh
else
    echo "⚠️  Port conflict resolution script not found, continuing..."
fi

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
    cp .env.production .env
    echo "📝 Please edit .env file with your actual configuration values"
    echo "🔑 Don't forget to set secure passwords and secrets!"
    read -p "Press Enter after updating .env file..."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p nginx/conf.d
mkdir -p certbot/conf
mkdir -p certbot/www
mkdir -p monitoring
mkdir -p backend/logs
mkdir -p backend/uploads/meals

# Build and start services
echo "🏗️  Building and starting services..."

# Start database and cache first
docker-compose up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 30

# Run database migrations and seeding
echo "🗄️  Running database migrations..."
docker-compose exec -T postgres psql -U akelny_user -d akelny -f /docker-entrypoint-initdb.d/001_create_core_tables.sql || true
docker-compose exec -T postgres psql -U akelny_user -d akelny -f /docker-entrypoint-initdb.d/002_create_indexes.sql || true

# Build and start backend
echo "🔧 Building and starting backend..."
docker-compose up -d --build backend

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 20

# Seed the database with meals data
echo "🍽️  Seeding meals data..."
docker-compose exec -T backend npm run seed:meals || echo "⚠️  Meals seeding failed, continuing..."

# Setup SSL certificates
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🔒 Setting up SSL certificates..."
    
    # Start nginx without SSL first
    docker-compose up -d nginx
    
    # Get SSL certificate
    docker-compose run --rm certbot || echo "⚠️  SSL certificate generation failed"
    
    # Restart nginx with SSL
    docker-compose restart nginx
fi

# Start all services
echo "🌟 Starting all services..."
docker-compose up -d

# Health checks
echo "🏥 Performing health checks..."
sleep 30

# Check backend health (using new port)
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    echo "Trying alternative health check..."
    docker-compose exec backend curl -f http://localhost:3000/health || echo "Internal health check also failed"
    docker-compose logs backend
fi

# Check nginx health
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Nginx is healthy"
else
    echo "❌ Nginx health check failed"
    docker-compose logs nginx
fi

# Display service status
echo "📊 Service Status:"
docker-compose ps

# Display useful information
echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Service Information:"
echo "   🌐 Domain: https://$DOMAIN"
echo "   🔧 API: https://$DOMAIN/api"
echo "   🏥 Health: https://$DOMAIN/health"
echo "   � Direct iAPI: http://localhost:3001/api"
echo "   🏥 Direct Health: http://localhost:3001/health"
echo "   📊 Prometheus: http://localhost:9091 (if enabled)"
echo "   📈 Grafana: http://localhost:3002 (if enabled)"
echo ""
echo "📝 Useful Commands:"
echo "   View logs: docker-compose logs -f [service]"
echo "   Restart service: docker-compose restart [service]"
echo "   Stop all: docker-compose down"
echo "   Update: git pull && ./scripts/deploy.sh"
echo ""
echo "🔧 Next Steps:"
echo "   1. Test the API endpoints"
echo "   2. Configure monitoring (optional)"
echo "   3. Set up automated backups"
echo "   4. Configure mobile app to use https://$DOMAIN/api"
echo ""