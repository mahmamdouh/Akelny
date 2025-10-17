#!/bin/bash

# Production Setup Script for Akelny Backend
# This script prepares the backend for production deployment

set -e

echo "🚀 Setting up Akelny Backend for Production..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the backend directory."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18 or higher is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version check passed: $(node --version)"

# Install dependencies
echo "📦 Installing production dependencies..."
npm ci --only=production

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p uploads/meals
mkdir -p uploads/ingredients
mkdir -p uploads/users

# Set proper permissions
chmod 755 logs
chmod 755 uploads
chmod 755 uploads/meals
chmod 755 uploads/ingredients
chmod 755 uploads/users

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed. dist directory not found."
    exit 1
fi

echo "✅ Build completed successfully"

# Validate environment variables
echo "🔍 Validating environment configuration..."

# Required environment variables
REQUIRED_VARS=(
    "DB_HOST"
    "DB_NAME"
    "DB_USER"
    "DB_PASSWORD"
    "JWT_SECRET"
    "JWT_REFRESH_SECRET"
    "REDIS_HOST"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Error: Missing required environment variables:"
    printf '%s\n' "${MISSING_VARS[@]}"
    echo "Please set these variables before running in production."
    exit 1
fi

echo "✅ Environment validation passed"

# Test database connection
echo "🔍 Testing database connection..."
if ! npm run test:db-connection; then
    echo "❌ Error: Database connection test failed"
    exit 1
fi

echo "✅ Database connection test passed"

# Test Redis connection
echo "🔍 Testing Redis connection..."
if ! npm run test:redis-connection; then
    echo "❌ Error: Redis connection test failed"
    exit 1
fi

echo "✅ Redis connection test passed"

# Run database migrations
echo "🗄️ Running database migrations..."
npm run migrate:up

echo "✅ Database migrations completed"

# Create systemd service file (optional)
if command -v systemctl &> /dev/null; then
    echo "🔧 Creating systemd service file..."
    
    cat > /tmp/akelny-backend.service << EOF
[Unit]
Description=Akelny Backend API Server
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=akelny
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=akelny-backend

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$(pwd)/logs $(pwd)/uploads

[Install]
WantedBy=multi-user.target
EOF

    echo "📄 Systemd service file created at /tmp/akelny-backend.service"
    echo "   To install: sudo mv /tmp/akelny-backend.service /etc/systemd/system/"
    echo "   To enable: sudo systemctl enable akelny-backend"
    echo "   To start: sudo systemctl start akelny-backend"
fi

# Create nginx configuration (optional)
echo "🔧 Creating nginx configuration template..."

cat > /tmp/akelny-backend-nginx.conf << 'EOF'
upstream akelny_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=1r/s;
    
    # Main API proxy
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://akelny_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Auth endpoints with stricter rate limiting
    location /api/auth/ {
        limit_req zone=auth burst=5 nodelay;
        
        proxy_pass http://akelny_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://akelny_backend;
        access_log off;
    }
    
    # Static file serving with caching
    location /uploads/ {
        proxy_pass http://akelny_backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
}
EOF

echo "📄 Nginx configuration template created at /tmp/akelny-backend-nginx.conf"

# Create monitoring script
echo "🔧 Creating monitoring script..."

cat > scripts/monitor.sh << 'EOF'
#!/bin/bash

# Akelny Backend Monitoring Script

API_URL="http://localhost:3000"
LOG_FILE="logs/monitor.log"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check if service is running
check_service() {
    if curl -s -f "$API_URL/health" > /dev/null; then
        log "✅ Service is healthy"
        return 0
    else
        log "❌ Service health check failed"
        return 1
    fi
}

# Check database connectivity
check_database() {
    local response=$(curl -s "$API_URL/health" | jq -r '.metrics.database.healthy // false')
    if [ "$response" = "true" ]; then
        log "✅ Database is healthy"
        return 0
    else
        log "❌ Database health check failed"
        return 1
    fi
}

# Check Redis connectivity
check_redis() {
    local response=$(curl -s "$API_URL/health" | jq -r '.metrics.cache.healthy // false')
    if [ "$response" = "true" ]; then
        log "✅ Redis is healthy"
        return 0
    else
        log "❌ Redis health check failed"
        return 1
    fi
}

# Main monitoring function
monitor() {
    log "Starting health check..."
    
    if ! check_service; then
        log "🚨 ALERT: Service is down!"
        # Add notification logic here (email, Slack, etc.)
        exit 1
    fi
    
    if ! check_database; then
        log "🚨 ALERT: Database connectivity issue!"
        # Add notification logic here
    fi
    
    if ! check_redis; then
        log "🚨 ALERT: Redis connectivity issue!"
        # Add notification logic here
    fi
    
    log "Health check completed"
}

# Run monitoring
monitor
EOF

chmod +x scripts/monitor.sh

echo "📄 Monitoring script created at scripts/monitor.sh"

# Create log rotation configuration
echo "🔧 Creating log rotation configuration..."

cat > /tmp/akelny-backend-logrotate << EOF
$(pwd)/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 akelny akelny
    postrotate
        # Restart service to reopen log files if needed
        systemctl reload akelny-backend || true
    endscript
}
EOF

echo "📄 Log rotation config created at /tmp/akelny-backend-logrotate"
echo "   To install: sudo mv /tmp/akelny-backend-logrotate /etc/logrotate.d/akelny-backend"

# Final summary
echo ""
echo "🎉 Production setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Review and update environment variables in .env.production"
echo "   2. Configure SSL certificates for HTTPS"
echo "   3. Set up monitoring and alerting"
echo "   4. Configure log rotation"
echo "   5. Set up automated backups"
echo "   6. Test the deployment thoroughly"
echo ""
echo "🚀 To start the production server:"
echo "   NODE_ENV=production npm start"
echo ""
echo "📊 Monitor the service:"
echo "   ./scripts/monitor.sh"
echo ""
echo "🔍 Check logs:"
echo "   tail -f logs/$(date +%Y-%m-%d).log"