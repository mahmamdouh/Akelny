# Performance Optimization Guide

This document outlines the performance optimizations and production configurations implemented in the Akelny backend.

## Overview

The backend has been optimized for production deployment with comprehensive caching, monitoring, security, and performance enhancements.

## Performance Features

### 1. API Response Caching

**Implementation**: Redis-based caching middleware with configurable TTL and cache invalidation.

**Features**:
- Automatic cache key generation based on request parameters
- User-specific caching for personalized content
- Cache headers (ETag, Cache-Control) for client-side caching
- Intelligent cache invalidation on data updates
- Multiple cache configurations for different endpoint types

**Cache Configurations**:
- `static`: 1 hour TTL for static data (kitchens, base ingredients)
- `semiStatic`: 15 minutes TTL for semi-static data (meal lists)
- `dynamic`: 5 minutes TTL for dynamic data (suggestions)
- `userSpecific`: 10 minutes TTL for user-specific data
- `search`: 30 minutes TTL for search results

**Usage**:
```typescript
// Apply caching to routes
router.get('/meals', cacheConfigs.semiStatic, MealsController.getMeals);
router.get('/suggestions', cacheConfigs.userSpecific, SuggestionsController.getSuggestions);
```

### 2. Database Query Optimization

**Implementation**: Optimized queries with proper indexing and connection pooling.

**Features**:
- Connection pool optimization for production/development environments
- Query performance monitoring with slow query detection
- Optimized SQL queries with proper JOIN strategies
- Batch operations for bulk updates
- Full-text search with PostgreSQL's built-in capabilities

**Optimized Queries**:
- Meal suggestions with ingredient availability filtering
- Ingredient search with bilingual full-text search
- Batch pantry updates to reduce database round trips

**Connection Pool Settings**:
```typescript
// Production
max: 20, min: 5, idleTimeoutMillis: 30000

// Development  
max: 10, min: 2, idleTimeoutMillis: 10000
```

### 3. Security Enhancements

**Implementation**: Multi-layered security with rate limiting, request validation, and security headers.

**Features**:
- Rate limiting with different tiers for different endpoints
- Speed limiting (progressive delays instead of blocking)
- Request validation to prevent injection attacks
- Enhanced security headers with Helmet.js
- CORS configuration for production environments
- Request size limiting to prevent DoS attacks

**Rate Limiting Tiers**:
- General API: 100 requests per 15 minutes
- Authentication: 5 requests per 15 minutes
- Search: 30 requests per minute
- File uploads: 10 uploads per hour

### 4. Monitoring and Logging

**Implementation**: Comprehensive monitoring with metrics collection and alerting.

**Features**:
- Structured logging with different log levels
- Performance metrics collection (response times, error rates)
- Database and cache health monitoring
- Real-time performance dashboard
- Prometheus-compatible metrics endpoint
- Automated alerting for critical issues

**Monitoring Endpoints**:
- `/health`: Health check with detailed system status
- `/metrics`: Prometheus-compatible metrics
- `/dashboard`: Interactive performance dashboard

### 5. Production Configuration

**Implementation**: Environment-specific configurations for production deployment.

**Features**:
- Separate production environment variables
- SSL/TLS configuration for database and Redis
- Enhanced error handling with error tracking
- Graceful shutdown handling
- Process monitoring and restart capabilities

## Configuration

### Environment Variables

**Production-specific variables** (`.env.production`):

```bash
# Database
DB_SSL=true
DB_MAX_CONNECTIONS=20
DB_MIN_CONNECTIONS=5

# Redis
REDIS_TLS=true
REDIS_MAX_RETRIES=3

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
TRUST_PROXY=true

# Performance
ENABLE_COMPRESSION=true
ENABLE_CACHING=true
CACHE_TTL_DEFAULT=300

# Monitoring
ENABLE_METRICS=true
ENABLE_ERROR_TRACKING=true
```

### Cache Configuration

**Redis Settings**:
```typescript
// Cache TTL configurations
static: 3600,      // 1 hour
semiStatic: 900,   // 15 minutes  
dynamic: 300,      // 5 minutes
userSpecific: 600, // 10 minutes
search: 1800       // 30 minutes
```

### Database Optimization

**Index Strategy**:
- Full-text search indexes on ingredient names (English/Arabic)
- Composite indexes on frequently queried columns
- Partial indexes for filtered queries

**Query Optimization**:
- Use of prepared statements for repeated queries
- Batch operations for bulk updates
- Proper JOIN strategies to minimize data transfer

## Deployment

### Production Setup

1. **Install dependencies**:
```bash
npm run production:setup
```

2. **Build application**:
```bash
npm run build
```

3. **Start production server**:
```bash
npm run production:start
```

### Monitoring

**Health Checks**:
```bash
# Check application health
curl http://localhost:3000/health

# View metrics
curl http://localhost:3000/metrics

# Access dashboard
open http://localhost:3000/dashboard
```

**Log Monitoring**:
```bash
# Tail current logs
npm run logs:tail

# View error logs
npm run logs:error

# Monitor with script
./scripts/monitor.sh
```

### Nginx Configuration

**Reverse Proxy Setup**:
```nginx
upstream akelny_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://akelny_backend;
        # ... additional proxy settings
    }
}
```

## Performance Metrics

### Key Performance Indicators

**Response Times**:
- Target: < 200ms for cached responses
- Target: < 500ms for database queries
- Target: < 1000ms for complex suggestions

**Throughput**:
- Target: 1000+ requests per minute
- Target: 95% cache hit rate for static content
- Target: < 5% error rate

**Resource Usage**:
- Target: < 80% memory usage
- Target: < 20 database connections under normal load
- Target: < 1GB Redis memory usage

### Monitoring Alerts

**Critical Alerts**:
- Memory usage > 90%
- Error rate > 10%
- Database connectivity issues
- Response time > 2 seconds

**Warning Alerts**:
- Memory usage > 80%
- Error rate > 5%
- Cache hit rate < 50%
- Slow query detection

## Troubleshooting

### Common Issues

**High Memory Usage**:
1. Check for memory leaks in application code
2. Review cache TTL settings
3. Monitor database connection pool
4. Restart application if necessary

**Slow Response Times**:
1. Check database query performance
2. Review cache hit rates
3. Monitor network latency
4. Analyze slow query logs

**Cache Issues**:
1. Verify Redis connectivity
2. Check cache invalidation logic
3. Monitor cache memory usage
4. Review cache key generation

### Performance Tuning

**Database Optimization**:
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT ...;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats WHERE tablename = 'meals';

-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;
```

**Cache Optimization**:
```bash
# Monitor Redis performance
redis-cli info memory
redis-cli info stats

# Check cache hit rates
redis-cli info stats | grep keyspace
```

## Best Practices

### Development

1. **Use appropriate cache TTL** for different data types
2. **Monitor query performance** during development
3. **Test with production-like data volumes**
4. **Profile memory usage** regularly

### Production

1. **Monitor all key metrics** continuously
2. **Set up automated alerts** for critical issues
3. **Regularly review performance** trends
4. **Plan for capacity scaling** based on usage patterns

### Security

1. **Keep rate limits** appropriate for usage patterns
2. **Monitor for suspicious activity** in logs
3. **Regularly update dependencies** for security patches
4. **Use HTTPS** for all production traffic

## Future Optimizations

### Planned Improvements

1. **Database read replicas** for read-heavy workloads
2. **CDN integration** for static asset delivery
3. **Advanced caching strategies** (cache warming, predictive caching)
4. **Microservices architecture** for better scalability
5. **GraphQL implementation** for more efficient data fetching

### Monitoring Enhancements

1. **APM integration** (New Relic, DataDog)
2. **Distributed tracing** for request flow analysis
3. **Custom business metrics** tracking
4. **Automated performance regression detection