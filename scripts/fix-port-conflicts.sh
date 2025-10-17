#!/bin/bash

# Fix Port Conflicts Script
# This script helps resolve port conflicts during deployment

echo "🔍 Checking for port conflicts..."

# Function to check if a port is in use
check_port() {
    local port=$1
    local service_name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is in use by $service_name"
        
        # Get process info
        local process_info=$(lsof -Pi :$port -sTCP:LISTEN)
        echo "Process details:"
        echo "$process_info"
        
        return 1
    else
        echo "✅ Port $port is available"
        return 0
    fi
}

# Function to stop a service if it's running
stop_service() {
    local service_name=$1
    
    if systemctl is-active --quiet $service_name; then
        echo "🛑 Stopping $service_name service..."
        sudo systemctl stop $service_name
        sudo systemctl disable $service_name
        echo "✅ $service_name stopped and disabled"
    else
        echo "ℹ️  $service_name is not running as a system service"
    fi
}

# Function to kill processes on specific ports
kill_port_processes() {
    local port=$1
    local service_name=$2
    
    echo "🔪 Attempting to free port $port ($service_name)..."
    
    # Get PIDs using the port
    local pids=$(lsof -ti :$port)
    
    if [ -n "$pids" ]; then
        echo "Found processes using port $port: $pids"
        
        # Ask user for confirmation
        read -p "Do you want to kill these processes? (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            for pid in $pids; do
                echo "Killing process $pid..."
                kill -TERM $pid 2>/dev/null || kill -KILL $pid 2>/dev/null
            done
            
            # Wait a moment and check again
            sleep 2
            
            if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
                echo "✅ Port $port is now free"
            else
                echo "❌ Port $port is still in use"
                return 1
            fi
        else
            echo "❌ User chose not to kill processes"
            return 1
        fi
    else
        echo "✅ No processes found using port $port"
    fi
}

echo "🔍 Checking common port conflicts..."

# Check PostgreSQL (5432 -> 5433)
if ! check_port 5432 "PostgreSQL"; then
    echo "📝 Note: Docker will use port 5433 instead of 5432"
fi

# Check Redis (6379 -> 6380)
if ! check_port 6379 "Redis"; then
    echo "🔧 Attempting to resolve Redis port conflict..."
    
    # Try to stop Redis service
    stop_service redis-server
    stop_service redis
    
    # If still in use, offer to kill processes
    if ! check_port 6379 "Redis"; then
        kill_port_processes 6379 "Redis"
    fi
fi

# Check backend port (3000 -> 3001)
if ! check_port 3000 "Backend/Node.js"; then
    echo "📝 Note: Docker will use port 3001 instead of 3000"
fi

# Check Nginx ports
check_port 80 "HTTP/Nginx"
check_port 443 "HTTPS/Nginx"

# Check monitoring ports
if ! check_port 9090 "Prometheus"; then
    echo "📝 Note: Docker will use port 9091 instead of 9090"
fi

echo ""
echo "🔧 Port Configuration Summary:"
echo "  PostgreSQL: Host port 5433 -> Container port 5432"
echo "  Redis: Host port 6380 -> Container port 6379"
echo "  Backend API: Host port 3001 -> Container port 3000"
echo "  Nginx HTTP: Host port 80 -> Container port 80"
echo "  Nginx HTTPS: Host port 443 -> Container port 443"
echo "  Prometheus: Host port 9091 -> Container port 9090"
echo "  Grafana: Host port 3002 -> Container port 3000"
echo ""

# Update environment variables if needed
echo "📝 Updating environment variables for new ports..."

# Create or update .env file with new port configurations
cat > .env.docker << EOF
# Docker Port Configuration
# Updated to avoid conflicts with existing services

# Database
DB_HOST=localhost
DB_PORT=5433
DB_NAME=akelny
DB_USER=akelny_user
DB_PASSWORD=akelny_secure_password_2024

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=akelny_redis_password_2024

# Backend API
API_PORT=3001
API_BASE_URL=http://localhost:3001/api

# JWT Secrets
JWT_SECRET=akelny_jwt_secret_key_2024_very_secure
JWT_REFRESH_SECRET=akelny_refresh_secret_key_2024_very_secure

# Monitoring
PROMETHEUS_PORT=9091
GRAFANA_PORT=3002
GRAFANA_PASSWORD=admin123

# CORS
CORS_ORIGIN=https://akelny.nabd-co.com,http://localhost:3001
EOF

echo "✅ Created .env.docker with updated port configuration"
echo ""
echo "🚀 You can now run the deployment with:"
echo "   ./scripts/deploy.sh"
echo ""
echo "📡 Access points after deployment:"
echo "   Backend API: http://localhost:3001/api"
echo "   Health Check: http://localhost:3001/health"
echo "   Database: localhost:5433"
echo "   Redis: localhost:6380"
echo "   Prometheus: http://localhost:9091 (if monitoring enabled)"
echo "   Grafana: http://localhost:3002 (if monitoring enabled)"