# Deployment Troubleshooting Guide

This guide helps resolve common deployment issues with the Akelny application.

## Port Conflicts Resolution

### Problem
```
Error response from daemon: failed to set up container networking: 
driver failed programming external connectivity on endpoint akelny-redis: 
Bind for 0.0.0.0:6379 failed: port is already allocated
```

### Solution

The deployment has been updated to use alternative ports to avoid conflicts:

| Service | Original Port | New Port | Access |
|---------|---------------|----------|---------|
| PostgreSQL | 5432 | 5433 | `localhost:5433` |
| Redis | 6379 | 6380 | `localhost:6380` |
| Backend API | 3000 | 3001 | `http://localhost:3001/api` |
| Prometheus | 9090 | 9091 | `http://localhost:9091` |
| Grafana | 3000 | 3002 | `http://localhost:3002` |

### Automatic Resolution

1. **Run the port conflict resolution script:**
   ```bash
   cd akelny
   ./scripts/fix-port-conflicts.sh
   ```

2. **Deploy with updated configuration:**
   ```bash
   ./scripts/deploy.sh
   ```

### Manual Resolution

If you prefer to manually resolve conflicts:

1. **Check what's using the ports:**
   ```bash
   # Check Redis port
   lsof -i :6379
   
   # Check PostgreSQL port
   lsof -i :5432
   
   # Check backend port
   lsof -i :3000
   ```

2. **Stop conflicting services:**
   ```bash
   # Stop Redis service
   sudo systemctl stop redis-server
   sudo systemctl disable redis-server
   
   # Stop PostgreSQL service
   sudo systemctl stop postgresql
   sudo systemctl disable postgresql
   
   # Kill processes using specific ports
   sudo kill -9 $(lsof -ti :6379)
   sudo kill -9 $(lsof -ti :5432)
   ```

3. **Update your environment configuration:**
   ```bash
   # Use the generated .env.docker file
   cp .env.docker .env
   ```

## Common Deployment Issues

### 1. Docker Not Found

**Error:** `Docker is not installed`

**Solution:**
```bash
# Install Docker on Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Permission Denied

**Error:** `Permission denied while trying to connect to Docker daemon`

**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Restart session or run
newgrp docker

# Or use sudo for docker commands
sudo docker-compose up -d
```

### 3. Database Connection Failed

**Error:** `Database connection failed`

**Solution:**
```bash
# Check if PostgreSQL container is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres

# Wait for database to be ready
sleep 30
```

### 4. SSL Certificate Issues

**Error:** `SSL certificate generation failed`

**Solution:**
```bash
# Check if domain is accessible
curl -I http://akelny.nabd-co.com

# Manually generate certificate
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@nabd-co.com \
  --agree-tos \
  --no-eff-email \
  -d akelny.nabd-co.com

# Restart nginx
docker-compose restart nginx
```

### 5. Backend Health Check Failed

**Error:** `Backend health check failed`

**Solution:**
```bash
# Check backend logs
docker-compose logs backend

# Check if backend is running
docker-compose ps backend

# Test backend directly
curl http://localhost:3001/health

# Restart backend
docker-compose restart backend
```

### 6. Nginx Configuration Issues

**Error:** `Nginx health check failed`

**Solution:**
```bash
# Check nginx logs
docker-compose logs nginx

# Test nginx configuration
docker-compose exec nginx nginx -t

# Restart nginx
docker-compose restart nginx

# Check if nginx is accessible
curl http://localhost/health
```

## Deployment Steps

### Quick Deployment

```bash
# 1. Clone and navigate to project
git clone <repository-url>
cd akelny

# 2. Resolve port conflicts
./scripts/fix-port-conflicts.sh

# 3. Deploy
./scripts/deploy.sh
```

### Step-by-Step Deployment

```bash
# 1. Check system requirements
docker --version
docker-compose --version

# 2. Configure environment
cp .env.production .env
nano .env  # Edit with your values

# 3. Resolve port conflicts
./scripts/fix-port-conflicts.sh

# 4. Start database services
docker-compose up -d postgres redis

# 5. Wait for services to be ready
sleep 30

# 6. Start backend
docker-compose up -d --build backend

# 7. Start nginx
docker-compose up -d nginx

# 8. Check health
curl http://localhost:3001/health
```

## Monitoring and Logs

### View Service Status
```bash
# Check all services
docker-compose ps

# Check specific service
docker-compose ps backend
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f nginx
```

### Health Checks
```bash
# Backend health
curl http://localhost:3001/health

# Backend metrics
curl http://localhost:3001/metrics

# Performance dashboard
open http://localhost:3001/dashboard
```

## Environment Configuration

### Production Environment Variables

Create `.env` file with:

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=akelny
DB_USER=akelny_user
DB_PASSWORD=your_secure_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Domain
CORS_ORIGIN=https://akelny.nabd-co.com
```

### Port Mapping Reference

| Internal (Container) | External (Host) | Service |
|---------------------|-----------------|---------|
| postgres:5432 | localhost:5433 | PostgreSQL |
| redis:6379 | localhost:6380 | Redis |
| backend:3000 | localhost:3001 | Backend API |
| nginx:80 | localhost:80 | HTTP |
| nginx:443 | localhost:443 | HTTPS |

## Recovery Procedures

### Complete Reset
```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: This deletes data)
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Clean rebuild
docker-compose up -d --build
```

### Backup and Restore
```bash
# Backup database
docker-compose exec postgres pg_dump -U akelny_user akelny > backup.sql

# Restore database
docker-compose exec -T postgres psql -U akelny_user akelny < backup.sql

# Backup uploads
tar -czf uploads-backup.tar.gz backend/uploads/

# Restore uploads
tar -xzf uploads-backup.tar.gz
```

## Performance Optimization

### Resource Limits
```yaml
# Add to docker-compose.yml services
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

### Monitoring
```bash
# Enable monitoring stack
docker-compose --profile monitoring up -d

# Access Prometheus
open http://localhost:9091

# Access Grafana
open http://localhost:3002
```

## Support

If you continue to experience issues:

1. Check the logs: `docker-compose logs -f`
2. Verify port availability: `./scripts/fix-port-conflicts.sh`
3. Test individual services: `docker-compose ps`
4. Review environment configuration: `cat .env`
5. Check system resources: `docker system df`

For additional support, provide:
- Error messages from logs
- Output of `docker-compose ps`
- System information (`uname -a`, `docker --version`)
- Environment configuration (without sensitive data)