# 🐳 Docker Compose Usage Guide

## ✅ YES! All Scripts Use Your Existing docker-compose.yml

All deployment scripts I created use your existing `docker-compose.yml` configuration. No changes to your Docker setup are needed.

---

## 📋 Your Docker Compose Configuration

Your `docker-compose.yml` includes these services:

### Core Services (Always Running)
1. **PostgreSQL Database** (`postgres`)
   - Port: 5433 (external) → 5432 (internal)
   - Container: `akelny-postgres`
   - Data: Persistent volume `postgres_data`
   - Migrations: Auto-loaded from `backend/src/migrations`

2. **Redis Cache** (`redis`)
   - Port: 6380 (external) → 6379 (internal)
   - Container: `akelny-redis`
   - Data: Persistent volume `redis_data`
   - Password protected

3. **Backend API** (`backend`)
   - Port: 3001 (external) → 3000 (internal)
   - Container: `akelny-backend`
   - Built from: `backend/Dockerfile`
   - Depends on: postgres, redis
   - Health check: `/health` endpoint

4. **Nginx Reverse Proxy** (`nginx`)
   - Ports: 80, 443
   - Container: `akelny-nginx`
   - SSL: Configured with certbot
   - Proxies to backend

5. **Certbot** (`certbot`)
   - SSL certificate management
   - Domain: akelny.nabd-co.com

### Optional Services (Monitoring)
6. **Prometheus** (`prometheus`)
   - Port: 9091
   - Profile: `monitoring`
   - Metrics collection

7. **Grafana** (`grafana`)
   - Port: 3002
   - Profile: `monitoring`
   - Visualization dashboard

---

## 🚀 How Deployment Scripts Use Docker Compose

### bulletproof-deploy.sh
```bash
# Stop existing containers
docker-compose -p akelny down

# Build backend image
docker-compose -p akelny build --no-cache backend

# Start database and cache
docker-compose -p akelny up -d postgres redis

# Start backend
docker-compose -p akelny up -d backend

# Check status
docker-compose -p akelny ps
```

### full-deployment.sh
```bash
# Calls bulletproof-deploy.sh which uses docker-compose
./scripts/bulletproof-deploy.sh

# Then sets up mobile app (no Docker needed)
cd mobile && npm install
```

### test-backend.sh
```bash
# Tests the running containers started by docker-compose
curl http://localhost:3001/health
curl http://localhost:3001/api
```

---

## 🔧 Docker Compose Commands You Can Use

### Basic Operations
```bash
# Start all services
docker-compose -p akelny up -d

# Start specific service
docker-compose -p akelny up -d backend

# Stop all services
docker-compose -p akelny down

# Restart service
docker-compose -p akelny restart backend

# Check status
docker-compose -p akelny ps

# View logs
docker-compose -p akelny logs -f backend
docker-compose -p akelny logs -f postgres
docker-compose -p akelny logs -f redis
```

### Build Operations
```bash
# Build backend image
docker-compose -p akelny build backend

# Build without cache
docker-compose -p akelny build --no-cache backend

# Pull latest images
docker-compose -p akelny pull
```

### Maintenance
```bash
# Execute command in container
docker-compose -p akelny exec backend npm run seed
docker-compose -p akelny exec postgres psql -U akelny_user -d akelny

# View resource usage
docker-compose -p akelny stats

# Remove volumes (CAUTION: Deletes data!)
docker-compose -p akelny down -v
```

### Monitoring (Optional)
```bash
# Start with monitoring
docker-compose -p akelny --profile monitoring up -d

# Access Prometheus
open http://localhost:9091

# Access Grafana
open http://localhost:3002
```

---

## 📊 Service Dependencies

```
┌─────────────────────────────────────┐
│           Nginx (80, 443)           │
│         Reverse Proxy + SSL         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Backend API (3001→3000)        │
│    Node.js + Express + TypeScript   │
└──────┬──────────────────────┬───────┘
       │                      │
       ▼                      ▼
┌──────────────┐      ┌──────────────┐
│  PostgreSQL  │      │    Redis     │
│  (5433→5432) │      │  (6380→6379) │
└──────────────┘      └──────────────┘
```

---

## 🔐 Environment Variables

Your docker-compose uses these environment variables (with defaults):

```bash
# Database
DB_PASSWORD=akelny_secure_password_2024

# Redis
REDIS_PASSWORD=akelny_redis_password_2024

# JWT
JWT_SECRET=akelny_jwt_secret_key_2024_very_secure
JWT_REFRESH_SECRET=akelny_refresh_secret_key_2024_very_secure

# Grafana (optional)
GRAFANA_PASSWORD=admin123
```

To customize, create a `.env` file:
```bash
# .env
DB_PASSWORD=your_secure_password
REDIS_PASSWORD=your_redis_password
JWT_SECRET=your_jwt_secret
```

---

## 📁 Persistent Data Volumes

Your docker-compose creates these volumes:

```bash
# View volumes
docker volume ls | grep akelny

# Volumes created:
- postgres_data      # Database data
- redis_data         # Cache data
- backend_logs       # Application logs
- nginx_logs         # Web server logs
- prometheus_data    # Metrics (optional)
- grafana_data       # Dashboards (optional)
```

### Backup Volumes
```bash
# Backup database
docker-compose -p akelny exec postgres pg_dump -U akelny_user akelny > backup.sql

# Backup volume
docker run --rm -v akelny_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

---

## 🌐 Network Configuration

Your docker-compose creates a bridge network:
```bash
# Network name: akelny-network
# All services communicate through this network

# View network
docker network inspect akelny_akelny-network

# Services can reach each other by name:
# - backend → postgres:5432
# - backend → redis:6379
# - nginx → backend:3000
```

---

## 🔍 Health Checks

Your docker-compose includes health checks:

```yaml
# PostgreSQL
test: pg_isready -U akelny_user -d akelny

# Redis
test: redis-cli --raw incr ping

# Backend
test: curl -f http://localhost:3000/health

# Nginx
test: curl -f http://localhost/health
```

Check health status:
```bash
docker-compose -p akelny ps
# Look for "healthy" status
```

---

## 🚨 Troubleshooting

### Services Won't Start
```bash
# Check logs
docker-compose -p akelny logs

# Check specific service
docker-compose -p akelny logs backend

# Restart services
docker-compose -p akelny restart
```

### Port Conflicts
```bash
# Check what's using ports
sudo lsof -i :3001  # Backend
sudo lsof -i :5433  # PostgreSQL
sudo lsof -i :6380  # Redis

# Change ports in docker-compose.yml if needed
```

### Database Issues
```bash
# Check database status
docker-compose -p akelny exec postgres pg_isready

# Connect to database
docker-compose -p akelny exec postgres psql -U akelny_user -d akelny

# View tables
docker-compose -p akelny exec postgres psql -U akelny_user -d akelny -c "\dt"
```

### Build Issues
```bash
# Clean build
docker-compose -p akelny build --no-cache backend

# Remove old images
docker image prune -a

# Start fresh
docker-compose -p akelny down -v
docker-compose -p akelny up -d
```

---

## ✅ Deployment Workflow

### Development
```bash
# Start services
docker-compose -p akelny up -d

# View logs
docker-compose -p akelny logs -f

# Make changes, then rebuild
docker-compose -p akelny build backend
docker-compose -p akelny restart backend
```

### Production
```bash
# Use deployment script
./scripts/bulletproof-deploy.sh

# Or manually
docker-compose -p akelny down
docker-compose -p akelny build --no-cache
docker-compose -p akelny up -d

# Enable monitoring
docker-compose -p akelny --profile monitoring up -d
```

---

## 📝 Summary

✅ **All deployment scripts use your existing docker-compose.yml**
✅ **No changes to your Docker configuration needed**
✅ **Scripts just automate docker-compose commands**
✅ **Your services, ports, and volumes are preserved**
✅ **Monitoring services are optional (use --profile monitoring)**

---

## 🚀 Quick Start

```bash
# Deploy everything
./scripts/bulletproof-deploy.sh

# This runs:
# 1. docker-compose -p akelny down
# 2. docker-compose -p akelny build backend
# 3. docker-compose -p akelny up -d postgres redis
# 4. docker-compose -p akelny up -d backend
# 5. Waits for health checks
# 6. Runs migrations
# 7. Verifies deployment
```

**Your docker-compose.yml is the foundation - the scripts just make it easier to use!** 🎉