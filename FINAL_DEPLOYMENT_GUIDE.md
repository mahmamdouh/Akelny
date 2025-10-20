# 🚀 Final Deployment Guide for Akelny Backend

## ✅ All Issues Fixed

### **TypeScript Issues Resolved:**
1. ✅ **Duplicate function implementations** in `nutritionService.ts` - Fixed by renaming `calculateMealNutrition` to `calculateSimpleMealNutrition`
2. ✅ **Missing AuthenticatedRequest types** in routes and controllers - Fixed by importing and using proper types
3. ✅ **Request.user property errors** - Fixed by using `AuthenticatedRequest` interface
4. ✅ **Import inconsistencies** - Fixed all import statements

### **Performance Optimizations Added:**
1. ✅ **Redis caching middleware** with configurable TTL
2. ✅ **Database query optimization** with connection pooling
3. ✅ **Security enhancements** with rate limiting and validation
4. ✅ **Comprehensive monitoring** with health checks and metrics
5. ✅ **Production configurations** with environment-specific settings

## 🚀 **Deployment Commands**

### **Option 1: Final Fix and Deploy (Recommended)**
```bash
cd /root/Akelny

# Run the comprehensive fix and deploy script
chmod +x scripts/final-fix-and-deploy.sh
./scripts/final-fix-and-deploy.sh
```

### **Option 2: Quick Deploy (If Option 1 fails)**
```bash
cd /root/Akelny

# Stop existing containers
docker-compose -p akelny down

# Build and deploy
docker-compose -p akelny build --no-cache backend
docker-compose -p akelny up -d postgres redis
sleep 30
docker-compose -p akelny up -d backend

# Test health
curl http://localhost:3001/health
```

## 📊 **Service Access Points**

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Backend API** | 3001 | `http://localhost:3001/api` | Main API endpoints |
| **Health Check** | 3001 | `http://localhost:3001/health` | Service health status |
| **Performance Dashboard** | 3001 | `http://localhost:3001/dashboard` | Real-time performance metrics |
| **Metrics** | 3001 | `http://localhost:3001/metrics` | Prometheus-compatible metrics |
| **PostgreSQL** | 5433 | `localhost:5433` | Database connection |
| **Redis** | 6380 | `localhost:6380` | Cache connection |

## 🔧 **Management Commands**

### **Service Management**
```bash
# View all services status
docker-compose -p akelny ps

# View logs
docker-compose -p akelny logs -f backend
docker-compose -p akelny logs -f postgres
docker-compose -p akelny logs -f redis

# Restart services
docker-compose -p akelny restart backend
docker-compose -p akelny restart postgres

# Stop all services
docker-compose -p akelny down

# Complete cleanup (removes data)
docker-compose -p akelny down -v
```

### **Health Monitoring**
```bash
# Check backend health
curl -s http://localhost:3001/health | jq

# Check performance metrics
curl -s http://localhost:3001/metrics

# View performance dashboard
open http://localhost:3001/dashboard
```

### **Database Operations**
```bash
# Connect to database
docker-compose -p akelny exec postgres psql -U akelny_user -d akelny

# Run migrations manually
docker-compose -p akelny exec -T postgres psql -U akelny_user -d akelny -f /docker-entrypoint-initdb.d/001_create_core_tables.sql
docker-compose -p akelny exec -T postgres psql -U akelny_user -d akelny -f /docker-entrypoint-initdb.d/002_create_indexes.sql

# Backup database
docker-compose -p akelny exec postgres pg_dump -U akelny_user akelny > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 🛡️ **Security Features**

### **Rate Limiting**
- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes  
- **Search**: 30 requests per minute
- **File uploads**: 10 uploads per hour

### **Security Headers**
- Content Security Policy
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- XSS Protection

### **Request Validation**
- Input sanitization
- SQL injection prevention
- XSS attack prevention
- Request size limiting

## 📈 **Performance Features**

### **Caching Strategy**
- **Static data**: 1 hour TTL (kitchens, base ingredients)
- **Semi-static data**: 15 minutes TTL (meal lists)
- **Dynamic data**: 5 minutes TTL (suggestions)
- **User-specific data**: 10 minutes TTL
- **Search results**: 30 minutes TTL

### **Database Optimization**
- Connection pooling (20 max connections in production)
- Query performance monitoring
- Slow query detection (>1 second)
- Optimized SQL queries with proper indexing

### **Monitoring Metrics**
- Response times and error rates
- Memory and CPU usage
- Database connection health
- Cache hit rates
- Request volume and patterns

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Backend Won't Start**
```bash
# Check logs
docker-compose -p akelny logs backend

# Check TypeScript compilation
cd backend && npx tsc --noEmit

# Restart with fresh build
docker-compose -p akelny down
docker-compose -p akelny build --no-cache backend
docker-compose -p akelny up -d backend
```

#### **Database Connection Issues**
```bash
# Check database status
docker-compose -p akelny exec postgres pg_isready -U akelny_user -d akelny

# Check database logs
docker-compose -p akelny logs postgres

# Restart database
docker-compose -p akelny restart postgres
```

#### **Port Conflicts**
```bash
# Check what's using ports
lsof -i :3001  # Backend
lsof -i :5433  # Database
lsof -i :6380  # Redis

# Kill conflicting processes
kill -9 $(lsof -ti :3001)
```

#### **Performance Issues**
```bash
# Check resource usage
docker stats $(docker-compose -p akelny ps -q)

# Check performance dashboard
curl -s http://localhost:3001/dashboard

# Check slow queries
docker-compose -p akelny logs backend | grep "Slow query"
```

## ✅ **Success Verification**

Your deployment is successful when:

1. ✅ **Health check passes**: `curl http://localhost:3001/health` returns `{"status":"healthy"}`
2. ✅ **All services running**: `docker-compose -p akelny ps` shows all services as "Up"
3. ✅ **Database accessible**: Can connect to PostgreSQL on port 5433
4. ✅ **Cache working**: Redis accessible on port 6380
5. ✅ **API responding**: `curl http://localhost:3001/api` returns API info
6. ✅ **No TypeScript errors**: Backend logs show no compilation errors
7. ✅ **Performance dashboard**: Accessible at `http://localhost:3001/dashboard`

## 🎯 **Next Steps**

After successful deployment:

1. **Configure your domain** to point to the server
2. **Set up SSL certificates** for HTTPS
3. **Configure monitoring alerts** for production
4. **Set up automated backups** for database
5. **Test all API endpoints** with your mobile app
6. **Monitor performance metrics** and optimize as needed

## 📞 **Support**

If you encounter any issues:

1. **Check the logs**: `docker-compose -p akelny logs -f`
2. **Verify health status**: `curl http://localhost:3001/health`
3. **Check resource usage**: `docker stats`
4. **Review error logs**: `docker-compose -p akelny logs backend | grep ERROR`
5. **Test individual components**: Database, Redis, Backend separately

The deployment is now production-ready with comprehensive monitoring, security, and performance optimizations!