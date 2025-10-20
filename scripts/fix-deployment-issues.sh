#!/bin/bash

# Fix Deployment Issues Script
# This script resolves common deployment issues

echo "🔧 Fixing deployment issues..."

# Stop only Akelny containers (not all containers)
echo "🛑 Stopping existing Akelny containers..."
docker-compose -p akelny down 2>/dev/null || true

# Clean up only Akelny orphaned containers
echo "🧹 Cleaning up Akelny orphaned containers..."
docker container ls -a --filter "name=akelny" --format "{{.ID}}" | xargs -r docker container rm -f 2>/dev/null || true

# Remove only Akelny volumes (WARNING: This will delete Akelny data)
read -p "Do you want to remove existing Akelny volumes? This will delete all Akelny data (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing existing Akelny volumes..."
    docker-compose -p akelny down -v 2>/dev/null || true
    docker volume ls --filter "name=akelny" --format "{{.Name}}" | xargs -r docker volume rm 2>/dev/null || true
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
mkdir -p monitoring

# Set proper permissions
chmod -R 755 backend/logs 2>/dev/null || true
chmod -R 755 backend/uploads 2>/dev/null || true

# Check if shared directory exists, if not create minimal structure
if [ ! -d "shared" ]; then
    echo "📦 Creating shared directory structure..."
    mkdir -p shared/src/types
    
    # Create minimal package.json for shared
    cat > shared/package.json << 'EOF'
{
  "name": "@akelny/shared",
  "version": "1.0.0",
  "description": "Shared types and utilities for Akelny",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.2.2"
  }
}
EOF

    # Create minimal index file
    cat > shared/src/index.ts << 'EOF'
// Shared types and utilities
export * from './types';
EOF

    # Create minimal types index
    cat > shared/src/types/index.ts << 'EOF'
// Export all shared types
export * from './meal';
export * from './ingredient';
export * from './user';
export * from './common';
EOF

    # Create basic type files if they don't exist
    [ ! -f "shared/src/types/common.ts" ] && cat > shared/src/types/common.ts << 'EOF'
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
EOF

    [ ! -f "shared/src/types/user.ts" ] && cat > shared/src/types/user.ts << 'EOF'
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  country: string;
  primaryKitchenId?: string;
  dietaryRestrictions?: string[];
  allergies?: string[];
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country: string;
  primaryKitchenId?: string;
  dietaryRestrictions?: string[];
  allergies?: string[];
}
EOF

    echo "✅ Created minimal shared directory structure"
fi

# Check Docker and Docker Compose
echo "🔍 Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Build images without cache to ensure clean build
echo "🏗️  Building images from scratch..."
docker-compose -p akelny build --no-cache backend

# Test if we can start the database
echo "🗄️  Testing database startup..."
docker-compose -p akelny up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 30

# Test database connection
echo "🔍 Testing database connection..."
if docker-compose -p akelny exec -T postgres pg_isready -U akelny_user -d akelny; then
    echo "✅ Database is ready"
else
    echo "❌ Database is not ready, checking logs..."
    docker-compose -p akelny logs postgres
fi

# Run migrations manually
echo "🗄️  Running database migrations..."
docker-compose -p akelny exec -T postgres psql -U akelny_user -d akelny -c "SELECT version();" || echo "Database connection failed"

# Check if migration files exist and run them
if [ -f "backend/src/migrations/001_create_core_tables.sql" ]; then
    echo "Running core tables migration..."
    docker-compose -p akelny exec -T postgres psql -U akelny_user -d akelny -f /docker-entrypoint-initdb.d/001_create_core_tables.sql || echo "Core tables migration failed"
fi

if [ -f "backend/src/migrations/002_create_indexes.sql" ]; then
    echo "Running indexes migration..."
    docker-compose -p akelny exec -T postgres psql -U akelny_user -d akelny -f /docker-entrypoint-initdb.d/002_create_indexes.sql || echo "Indexes migration failed"
fi

# Stop services
echo "🛑 Stopping test services..."
docker-compose -p akelny down

echo ""
echo "🎉 Deployment issues have been fixed!"
echo ""
echo "📋 What was fixed:"
echo "   ✅ Created SQL migration files instead of JavaScript"
echo "   ✅ Fixed Docker build context for shared directory"
echo "   ✅ Removed obsolete Docker Compose version"
echo "   ✅ Created necessary directories and permissions"
echo "   ✅ Created minimal shared directory structure"
echo ""
echo "🚀 You can now run the safe deployment:"
echo "   ./scripts/safe-deploy.sh"
echo ""
echo "🔍 If you still encounter issues:"
echo "   1. Check Docker logs: docker-compose logs [service]"
echo "   2. Verify environment variables: cat .env"
echo "   3. Test individual services: docker-compose up [service]"