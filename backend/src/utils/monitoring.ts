import { Request, Response } from 'express';
import { logger } from './logger';
import { checkDatabaseHealth } from './queryOptimization';
import { cache } from '../config/redis';
import { Pool } from 'pg';

interface SystemMetrics {
  timestamp: string;
  uptime: number;
  memory: NodeJS.MemoryUsage;
  cpu: {
    user: number;
    system: number;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  database: {
    healthy: boolean;
    connections: any;
    queryMetrics: any;
  };
  cache: {
    healthy: boolean;
    hitRate: number;
    operations: {
      gets: number;
      sets: number;
      deletes: number;
    };
  };
}

class MonitoringService {
  private metrics: {
    requests: {
      total: number;
      successful: number;
      failed: number;
      responseTimes: number[];
    };
    cache: {
      hits: number;
      misses: number;
      gets: number;
      sets: number;
      deletes: number;
    };
  };

  private startTime: number;

  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        responseTimes: []
      },
      cache: {
        hits: 0,
        misses: 0,
        gets: 0,
        sets: 0,
        deletes: 0
      }
    };
    
    this.startTime = Date.now();
    
    // Start periodic metrics collection
    if (process.env.ENABLE_METRICS === 'true') {
      this.startPeriodicCollection();
    }
  }

  // Record request metrics
  recordRequest(responseTime: number, statusCode: number): void {
    this.metrics.requests.total++;
    this.metrics.requests.responseTimes.push(responseTime);
    
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }
    
    // Keep only last 1000 response times
    if (this.metrics.requests.responseTimes.length > 1000) {
      this.metrics.requests.responseTimes = this.metrics.requests.responseTimes.slice(-1000);
    }
  }

  // Record cache metrics
  recordCacheHit(): void {
    this.metrics.cache.hits++;
    this.metrics.cache.gets++;
  }

  recordCacheMiss(): void {
    this.metrics.cache.misses++;
    this.metrics.cache.gets++;
  }

  recordCacheSet(): void {
    this.metrics.cache.sets++;
  }

  recordCacheDelete(): void {
    this.metrics.cache.deletes++;
  }

  // Get current system metrics
  async getSystemMetrics(dbPool?: Pool): Promise<SystemMetrics> {
    const now = Date.now();
    const uptime = Math.floor((now - this.startTime) / 1000);
    
    // Calculate average response time
    const responseTimes = this.metrics.requests.responseTimes;
    const averageResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
      : 0;

    // Calculate cache hit rate
    const totalCacheOps = this.metrics.cache.hits + this.metrics.cache.misses;
    const hitRate = totalCacheOps > 0 
      ? Math.round((this.metrics.cache.hits / totalCacheOps) * 100) / 100
      : 0;

    // Get database health
    let databaseHealth = { healthy: false, connections: {}, queryMetrics: {} };
    if (dbPool) {
      try {
        databaseHealth = await checkDatabaseHealth(dbPool);
      } catch (error) {
        logger.error('Failed to get database health', { error });
      }
    }

    // Test cache health
    let cacheHealthy = false;
    try {
      await cache.set('health_check', 'ok', 10);
      const result = await cache.get('health_check');
      cacheHealthy = result === 'ok';
      await cache.del('health_check');
    } catch (error) {
      logger.error('Cache health check failed', { error });
    }

    return {
      timestamp: new Date().toISOString(),
      uptime,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      requests: {
        total: this.metrics.requests.total,
        successful: this.metrics.requests.successful,
        failed: this.metrics.requests.failed,
        averageResponseTime
      },
      database: databaseHealth,
      cache: {
        healthy: cacheHealthy,
        hitRate,
        operations: {
          gets: this.metrics.cache.gets,
          sets: this.metrics.cache.sets,
          deletes: this.metrics.cache.deletes
        }
      }
    };
  }

  // Start periodic metrics collection
  private startPeriodicCollection(): void {
    const interval = parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000');
    
    setInterval(async () => {
      try {
        const metrics = await this.getSystemMetrics();
        logger.logMetrics(metrics);
        
        // Alert on high memory usage
        const memoryUsage = metrics.memory.heapUsed / metrics.memory.heapTotal;
        if (memoryUsage > 0.9) {
          logger.warn('High memory usage detected', {
            usage: `${Math.round(memoryUsage * 100)}%`,
            heapUsed: `${Math.round(metrics.memory.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(metrics.memory.heapTotal / 1024 / 1024)}MB`
          });
        }
        
        // Alert on high error rate
        const errorRate = metrics.requests.total > 0 
          ? metrics.requests.failed / metrics.requests.total 
          : 0;
        if (errorRate > 0.1) { // More than 10% error rate
          logger.warn('High error rate detected', {
            errorRate: `${Math.round(errorRate * 100)}%`,
            totalRequests: metrics.requests.total,
            failedRequests: metrics.requests.failed
          });
        }
        
        // Alert on slow average response time
        if (metrics.requests.averageResponseTime > 2000) {
          logger.warn('Slow average response time', {
            averageResponseTime: `${metrics.requests.averageResponseTime}ms`
          });
        }
        
        // Alert on database issues
        if (!metrics.database.healthy) {
          logger.error('Database health check failed', metrics.database);
        }
        
        // Alert on cache issues
        if (!metrics.cache.healthy) {
          logger.error('Cache health check failed');
        }
        
      } catch (error) {
        logger.error('Failed to collect metrics', { error });
      }
    }, interval);
  }

  // Reset metrics (useful for testing)
  resetMetrics(): void {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        responseTimes: []
      },
      cache: {
        hits: 0,
        misses: 0,
        gets: 0,
        sets: 0,
        deletes: 0
      }
    };
  }
}

export const monitoring = new MonitoringService();

// Monitoring middleware
export const monitoringMiddleware = (req: Request, res: Response, next: any) => {
  const startTime = Date.now();
  
  // Override res.end to record metrics
  const originalEnd = res.end;
  res.end = function(chunk: any, encoding: any) {
    const responseTime = Date.now() - startTime;
    monitoring.recordRequest(responseTime, res.statusCode);
    originalEnd.call(res, chunk, encoding);
  };

  next();
};

// Health check endpoint handler
export const healthCheckHandler = async (req: Request, res: Response) => {
  try {
    const dbPool = (req as any).dbPool; // Assuming dbPool is attached to request
    const metrics = await monitoring.getSystemMetrics(dbPool);
    
    const isHealthy = 
      metrics.database.healthy && 
      metrics.cache.healthy &&
      metrics.memory.heapUsed / metrics.memory.heapTotal < 0.95;
    
    const status = isHealthy ? 200 : 503;
    
    res.status(status).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: metrics.timestamp,
      uptime: metrics.uptime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      metrics: {
        requests: metrics.requests,
        memory: {
          used: `${Math.round(metrics.memory.heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(metrics.memory.heapTotal / 1024 / 1024)}MB`,
          usage: `${Math.round((metrics.memory.heapUsed / metrics.memory.heapTotal) * 100)}%`
        },
        database: {
          healthy: metrics.database.healthy,
          connections: metrics.database.connections
        },
        cache: {
          healthy: metrics.cache.healthy,
          hitRate: `${Math.round(metrics.cache.hitRate * 100)}%`
        }
      }
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
};

// Metrics endpoint handler (for Prometheus or similar)
export const metricsHandler = async (req: Request, res: Response) => {
  try {
    const dbPool = (req as any).dbPool;
    const metrics = await monitoring.getSystemMetrics(dbPool);
    
    // Format metrics in Prometheus format
    const prometheusMetrics = `
# HELP akelny_requests_total Total number of HTTP requests
# TYPE akelny_requests_total counter
akelny_requests_total ${metrics.requests.total}

# HELP akelny_requests_successful_total Total number of successful HTTP requests
# TYPE akelny_requests_successful_total counter
akelny_requests_successful_total ${metrics.requests.successful}

# HELP akelny_requests_failed_total Total number of failed HTTP requests
# TYPE akelny_requests_failed_total counter
akelny_requests_failed_total ${metrics.requests.failed}

# HELP akelny_response_time_avg Average response time in milliseconds
# TYPE akelny_response_time_avg gauge
akelny_response_time_avg ${metrics.requests.averageResponseTime}

# HELP akelny_memory_heap_used_bytes Memory heap used in bytes
# TYPE akelny_memory_heap_used_bytes gauge
akelny_memory_heap_used_bytes ${metrics.memory.heapUsed}

# HELP akelny_memory_heap_total_bytes Memory heap total in bytes
# TYPE akelny_memory_heap_total_bytes gauge
akelny_memory_heap_total_bytes ${metrics.memory.heapTotal}

# HELP akelny_cache_hit_rate Cache hit rate (0-1)
# TYPE akelny_cache_hit_rate gauge
akelny_cache_hit_rate ${metrics.cache.hitRate}

# HELP akelny_database_healthy Database health status (1=healthy, 0=unhealthy)
# TYPE akelny_database_healthy gauge
akelny_database_healthy ${metrics.database.healthy ? 1 : 0}

# HELP akelny_cache_healthy Cache health status (1=healthy, 0=unhealthy)
# TYPE akelny_cache_healthy gauge
akelny_cache_healthy ${metrics.cache.healthy ? 1 : 0}

# HELP akelny_uptime_seconds Application uptime in seconds
# TYPE akelny_uptime_seconds counter
akelny_uptime_seconds ${metrics.uptime}
    `.trim();
    
    res.set('Content-Type', 'text/plain');
    res.send(prometheusMetrics);
  } catch (error) {
    logger.error('Metrics endpoint failed', { error });
    res.status(500).send('# Metrics collection failed');
  }
};