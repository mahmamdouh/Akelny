# Safe Deployment Guide for Akelny

This guide provides a safe deployment approach that won't interfere with your existing Docker services.

## 🔧 **Fixed Issues**

### **1. NPM CI Error**
- **Issue**: `npm ci` requires `package-lock.json` file
- **Fix**: Updated Dockerfile to use `npm install` instead
- **Result**: Build process now works without package-lock.json

### **2. Docker Build Context**
- **Issue**: Dockerfile couldn't find shared directory
- **Fix**: Simplified Dockerfile to work without shared dependencies
- **Result**: Clean build process that doesn't depend on external directories

### **3. Container Isolation**
- **Issue**: Deployment scripts affected other Docker services
- **Fix**: Created safe deployment scripts with project-specific naming
- **Result**: Only Akelny containers are managed, other services remain untouched

## 🚀 **Safe Deployment Process**

### **Step 1: Fix Deployment Issues**
```bash
cd /root/Akelny
chmod +x scripts/fix-deployment-issues.sh
./scripts/fix-deployment-issues.sh
```

### **Step 2: Run Safe Deployment**
```bash
chmod +x scripts/safe-deploy.sh
./scripts/safe-deploy.sh
```

## 📋 **What the Safe Deployment Does**

### **Container Isolation**
- Uses project name `akelny` to isolate containers
- Only manages Akelny-related containers
- Leaves your other Docker services untouched

### **Port Configuration**
- **Backend API**: `localhost:3001` (instead of 3000)
- **Database**: `localhost:5433` (instead of 5432)
- **Redis**: `localhost:6380` (instead of 6379)
- **Nginx**: `localhost:80/443` (only if not conflicting)

### **Safe Operations**
- Stops only Akelny containers
- Removes only Akelny volumes (if requested)
- Builds only Akelny images
- Monitors only Akelny services

## 🔍 **Verification Steps**

After deployment, verify everything is working:

```bash
# Check backend health
curl http://localhost:3001/health

# Check service status
docker-compose -p akelny ps

# View logs if needed
docker-compose -p akelny logs backend

# Check database
docker-compose -p akelny exec postgres pg_isready -U akelny_user -d akelny
```

## 📊 **Service Access Points**

| Service | Internal Port | External Port | Access URL |
|---------|---------------|---------------|------------|
| Backend API | 3000 | 3001 | `http://localhost:3001/api` |
| Health Check | 3000 | 3001 | `http://localhost:3001/health` |
| Dashboard | 3000 | 3001 | `http://localhost:3001/dashboard` |
| PostgreSQL | 5432 | 5433 | `localhost:5433` |
| Redis | 6379 | 6380 | `localhost:6380` |
| Nginx HTTP | 80 | 80 | `http://localhost` |
| Nginx HTTPS | 443 | 443 | `https://localhost` |

## 🛠️ **Management Commands**

### **View Service Status**
```bash
docker-compose -p akelny ps
```

### **View Logs**
```bash
# All services
docker-compose -p akelny logs -f

# Specific service
docker-compose -p akelny logs -f backend
docker-compose -p akelny logs -f postgres
```

### **Restart Services**
```bash
# Restart specific service
docker-compose -p akelny restart backend

# Restart all services
docker-compose -p akelny restart
```

### **Stop Services**
```bash
# Stop all Akelny services
docker-compose -p akelny down

# Stop and remove volumes (deletes data)
docker-compose -p akelny down -v
```

### **Update Deployment**
```bash
git pull
./scripts/safe-deploy.sh
```

## 🔒 **Security Considerations**

### **Firewall Configuration**
Make sure these ports are accessible:
```bash
# Allow HTTP and HTTPS
ufw allow 80
ufw allow 443

# Allow direct API access (optional)
ufw allow 3001
```

### **Environment Variables**
Ensure your `.env` file has secure values:
```bash
# Generate secure passwords
DB_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
```

## 🚨 **Troubleshooting**

### **Backend Won't Start**
```bash
# Check logs
docker-compose -p akelny logs backend

# Check if port is available
netstat -tlnp | grep 3001

# Restart backend
docker-compose -p akelny restart backend
```

### **Database Connection Issues**
```bash
# Check database logs
docker-compose -p akelny logs postgres

# Test connection
docker-compose -p akelny exec postgres pg_isready -U akelny_user -d akelny

# Restart database
docker-compose -p akelny restart postgres
```

### **Port Conflicts**
```bash
# Check what's using a port
lsof -i :3001
lsof -i :5433
lsof -i :6380

# Kill process if needed
kill -9 $(lsof -ti :3001)
```

### **Clean Restart**
```bash
# Stop everything
docker-compose -p akelny down

# Remove volumes (WARNING: deletes data)
docker-compose -p akelny down -v

# Rebuild and restart
docker-compose -p akelny build --no-cache
./scripts/safe-deploy.sh
```

## 📈 **Monitoring**

### **Health Checks**
```bash
# Backend health
curl -s http://localhost:3001/health | jq

# Performance metrics
curl -s http://localhost:3001/metrics

# Performance dashboard
open http://localhost:3001/dashboard
```

### **Resource Usage**
```bash
# Container resource usage
docker stats $(docker-compose -p akelny ps -q)

# Disk usage
docker system df
```

## 🔄 **Backup and Recovery**

### **Database Backup**
```bash
# Create backup
docker-compose -p akelny exec postgres pg_dump -U akelny_user akelny > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose -p akelny exec -T postgres psql -U akelny_user akelny < backup_file.sql
```

### **Volume Backup**
```bash
# Backup uploads
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz backend/uploads/

# Restore uploads
tar -xzf uploads_backup_file.tar.gz
```

## ✅ **Success Indicators**

Your deployment is successful when:

1. ✅ `curl http://localhost:3001/health` returns `{"status":"healthy"}`
2. ✅ `docker-compose -p akelny ps` shows all services as "Up"
3. ✅ Database migrations completed without errors
4. ✅ No port conflicts with existing services
5. ✅ Backend logs show successful startup
6. ✅ Performance dashboard accessible at `http://localhost:3001/dashboard`

## 📞 **Support**

If you encounter issues:

1. Check the logs: `docker-compose -p akelny logs -f`
2. Verify environment configuration: `cat .env`
3. Test individual services: `docker-compose -p akelny up [service]`
4. Review this troubleshooting guide
5. Check system resources: `df -h` and `free -m`

The safe deployment approach ensures your existing Docker services remain unaffected while providing a robust Akelny deployment.