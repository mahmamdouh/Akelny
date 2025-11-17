import { Request, Response } from 'express';
import { monitoring } from './monitoring';
import { queryOptimizer } from './queryOptimization';
import { cache } from '../config/redis';
import { pool } from '../config/database';

interface PerformanceDashboard {
  timestamp: string;
  uptime: number;
  system: {
    memory: {
      used: string;
      total: string;
      usage: string;
      heap: NodeJS.MemoryUsage;
    };
    cpu: NodeJS.CpuUsage;
  };
  api: {
    requests: {
      total: number;
      successful: number;
      failed: number;
      errorRate: string;
      averageResponseTime: number;
    };
    endpoints: {
      slowest: Array<{
        endpoint: string;
        averageTime: number;
        callCount: number;
      }>;
    };
  };
  database: {
    health: boolean;
    connections: {
      total: number;
      idle: number;
      waiting: number;
    };
    queries: {
      total: number;
      slow: number;
      averageTime: number;
      slowestQueries: Array<{
        query: string;
        duration: number;
        timestamp: Date;
      }>;
    };
  };
  cache: {
    health: boolean;
    hitRate: string;
    operations: {
      gets: number;
      sets: number;
      deletes: number;
    };
    memory: string;
  };
  alerts: Array<{
    level: 'warning' | 'error' | 'critical';
    message: string;
    timestamp: string;
    metric?: string;
    value?: any;
  }>;
}

class PerformanceDashboardService {
  private endpointMetrics: Map<string, { times: number[]; count: number }> = new Map();

  // Record endpoint performance
  recordEndpoint(endpoint: string, responseTime: number): void {
    if (!this.endpointMetrics.has(endpoint)) {
      this.endpointMetrics.set(endpoint, { times: [], count: 0 });
    }
    
    const metrics = this.endpointMetrics.get(endpoint)!;
    metrics.times.push(responseTime);
    metrics.count++;
    
    // Keep only last 100 measurements per endpoint
    if (metrics.times.length > 100) {
      metrics.times = metrics.times.slice(-100);
    }
  }

  // Generate performance dashboard data
  async generateDashboard(): Promise<PerformanceDashboard> {
    const systemMetrics = await monitoring.getSystemMetrics(pool);
    const queryMetrics = queryOptimizer.getMetrics();
    
    // Calculate memory usage
    const memoryUsage = systemMetrics.memory.heapUsed / systemMetrics.memory.heapTotal;
    const memoryUsedMB = Math.round(systemMetrics.memory.heapUsed / 1024 / 1024);
    const memoryTotalMB = Math.round(systemMetrics.memory.heapTotal / 1024 / 1024);
    
    // Calculate error rate
    const errorRate = systemMetrics.requests.total > 0 
      ? (systemMetrics.requests.failed / systemMetrics.requests.total) * 100 
      : 0;
    
    // Get slowest endpoints
    const slowestEndpoints = Array.from(this.endpointMetrics.entries())
      .map(([endpoint, metrics]) => ({
        endpoint,
        averageTime: Math.round(metrics.times.reduce((sum, time) => sum + time, 0) / metrics.times.length),
        callCount: metrics.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5);
    
    // Get cache memory usage
    let cacheMemory = 'Unknown';
    try {
      const info = await cache.get('info:memory') || '0';
      cacheMemory = `${Math.round(parseInt(info) / 1024 / 1024)}MB`;
    } catch (error) {
      // Ignore cache memory errors
    }
    
    // Generate alerts
    const alerts: PerformanceDashboard['alerts'] = [];
    
    if (memoryUsage > 0.9) {
      alerts.push({
        level: 'critical',
        message: `High memory usage: ${Math.round(memoryUsage * 100)}%`,
        timestamp: new Date().toISOString(),
        metric: 'memory_usage',
        value: memoryUsage
      });
    } else if (memoryUsage > 0.8) {
      alerts.push({
        level: 'warning',
        message: `Elevated memory usage: ${Math.round(memoryUsage * 100)}%`,
        timestamp: new Date().toISOString(),
        metric: 'memory_usage',
        value: memoryUsage
      });
    }
    
    if (errorRate > 10) {
      alerts.push({
        level: 'critical',
        message: `High error rate: ${Math.round(errorRate)}%`,
        timestamp: new Date().toISOString(),
        metric: 'error_rate',
        value: errorRate
      });
    } else if (errorRate > 5) {
      alerts.push({
        level: 'warning',
        message: `Elevated error rate: ${Math.round(errorRate)}%`,
        timestamp: new Date().toISOString(),
        metric: 'error_rate',
        value: errorRate
      });
    }
    
    if (systemMetrics.requests.averageResponseTime > 2000) {
      alerts.push({
        level: 'warning',
        message: `Slow average response time: ${systemMetrics.requests.averageResponseTime}ms`,
        timestamp: new Date().toISOString(),
        metric: 'response_time',
        value: systemMetrics.requests.averageResponseTime
      });
    }
    
    if (!systemMetrics.database.healthy) {
      alerts.push({
        level: 'critical',
        message: 'Database connectivity issues detected',
        timestamp: new Date().toISOString(),
        metric: 'database_health',
        value: false
      });
    }
    
    if (!systemMetrics.cache.healthy) {
      alerts.push({
        level: 'error',
        message: 'Cache connectivity issues detected',
        timestamp: new Date().toISOString(),
        metric: 'cache_health',
        value: false
      });
    }
    
    if (systemMetrics.cache.hitRate < 0.5) {
      alerts.push({
        level: 'warning',
        message: `Low cache hit rate: ${Math.round(systemMetrics.cache.hitRate * 100)}%`,
        timestamp: new Date().toISOString(),
        metric: 'cache_hit_rate',
        value: systemMetrics.cache.hitRate
      });
    }
    
    return {
      timestamp: new Date().toISOString(),
      uptime: systemMetrics.uptime,
      system: {
        memory: {
          used: `${memoryUsedMB}MB`,
          total: `${memoryTotalMB}MB`,
          usage: `${Math.round(memoryUsage * 100)}%`,
          heap: systemMetrics.memory
        },
        cpu: systemMetrics.cpu
      },
      api: {
        requests: {
          total: systemMetrics.requests.total,
          successful: systemMetrics.requests.successful,
          failed: systemMetrics.requests.failed,
          errorRate: `${Math.round(errorRate * 100) / 100}%`,
          averageResponseTime: systemMetrics.requests.averageResponseTime
        },
        endpoints: {
          slowest: slowestEndpoints
        }
      },
      database: {
        health: systemMetrics.database.healthy,
        connections: {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount
        },
        queries: {
          total: queryMetrics.totalQueries,
          slow: queryMetrics.slowQueries,
          averageTime: queryMetrics.avgDuration,
          slowestQueries: queryMetrics.recentMetrics
            .filter(m => m.duration > 1000)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 5)
        }
      },
      cache: {
        health: systemMetrics.cache.healthy,
        hitRate: `${Math.round(systemMetrics.cache.hitRate * 100)}%`,
        operations: systemMetrics.cache.operations,
        memory: cacheMemory
      },
      alerts
    };
  }

  // Reset metrics (useful for testing)
  resetMetrics(): void {
    this.endpointMetrics.clear();
  }
}

export const performanceDashboard = new PerformanceDashboardService();

// Dashboard endpoint handler
export const dashboardHandler = async (req: Request, res: Response) => {
  try {
    const dashboard = await performanceDashboard.generateDashboard();
    
    // Check if client wants HTML or JSON
    const acceptsHtml = req.headers.accept?.includes('text/html');
    
    if (acceptsHtml) {
      // Return HTML dashboard
      const html = generateDashboardHTML(dashboard);
      res.set('Content-Type', 'text/html');
      res.send(html);
    } else {
      // Return JSON data
      res.json(dashboard);
    }
  } catch (error) {
    console.error('Dashboard generation failed:', error);
    res.status(500).json({
      error: 'Dashboard generation failed',
      timestamp: new Date().toISOString()
    });
  }
};

// Generate HTML dashboard
function generateDashboardHTML(dashboard: PerformanceDashboard): string {
  const alertsHtml = dashboard.alerts.map(alert => {
    const colorClass = {
      warning: 'orange',
      error: 'red',
      critical: 'darkred'
    }[alert.level];
    
    return `<div style="color: ${colorClass}; margin: 5px 0;">
      <strong>[${alert.level.toUpperCase()}]</strong> ${alert.message}
    </div>`;
  }).join('');
  
  const endpointsHtml = dashboard.api.endpoints.slowest.map(endpoint => 
    `<tr>
      <td>${endpoint.endpoint}</td>
      <td>${endpoint.averageTime}ms</td>
      <td>${endpoint.callCount}</td>
    </tr>`
  ).join('');
  
  const slowQueriesHtml = dashboard.database.queries.slowestQueries.map(query => 
    `<tr>
      <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${query.query}</td>
      <td>${query.duration}ms</td>
      <td>${new Date(query.timestamp).toLocaleTimeString()}</td>
    </tr>`
  ).join('');
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Akelny Backend Performance Dashboard</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric-label { font-weight: bold; color: #666; }
        .metric-value { font-size: 1.2em; color: #333; }
        .status-healthy { color: green; }
        .status-unhealthy { color: red; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
        .refresh-btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        .refresh-btn:hover { background: #0056b3; }
    </style>
    <script>
        function refreshDashboard() {
            window.location.reload();
        }
        
        // Auto-refresh every 30 seconds
        setTimeout(refreshDashboard, 30000);
    </script>
</head>
<body>
    <div class="container">
        <h1>🚀 Akelny Backend Performance Dashboard</h1>
        <p>Last updated: ${dashboard.timestamp} | Uptime: ${Math.floor(dashboard.uptime / 3600)}h ${Math.floor((dashboard.uptime % 3600) / 60)}m</p>
        
        <button class="refresh-btn" onclick="refreshDashboard()">🔄 Refresh</button>
        
        ${dashboard.alerts.length > 0 ? `
        <div class="card">
            <h2>🚨 Alerts</h2>
            ${alertsHtml}
        </div>
        ` : ''}
        
        <div class="card">
            <h2>💻 System Metrics</h2>
            <div class="metric">
                <div class="metric-label">Memory Usage</div>
                <div class="metric-value">${dashboard.system.memory.usage} (${dashboard.system.memory.used} / ${dashboard.system.memory.total})</div>
            </div>
        </div>
        
        <div class="card">
            <h2>🌐 API Performance</h2>
            <div class="metric">
                <div class="metric-label">Total Requests</div>
                <div class="metric-value">${dashboard.api.requests.total}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Success Rate</div>
                <div class="metric-value">${100 - parseFloat(dashboard.api.requests.errorRate)}%</div>
            </div>
            <div class="metric">
                <div class="metric-label">Average Response Time</div>
                <div class="metric-value">${dashboard.api.requests.averageResponseTime}ms</div>
            </div>
            
            <h3>Slowest Endpoints</h3>
            <table>
                <tr><th>Endpoint</th><th>Avg Time</th><th>Calls</th></tr>
                ${endpointsHtml}
            </table>
        </div>
        
        <div class="card">
            <h2>🗄️ Database Performance</h2>
            <div class="metric">
                <div class="metric-label">Health</div>
                <div class="metric-value ${dashboard.database.health ? 'status-healthy' : 'status-unhealthy'}">
                    ${dashboard.database.health ? '✅ Healthy' : '❌ Unhealthy'}
                </div>
            </div>
            <div class="metric">
                <div class="metric-label">Connections</div>
                <div class="metric-value">${dashboard.database.connections.total} total, ${dashboard.database.connections.idle} idle</div>
            </div>
            <div class="metric">
                <div class="metric-label">Query Performance</div>
                <div class="metric-value">${dashboard.database.queries.averageTime}ms avg, ${dashboard.database.queries.slow} slow</div>
            </div>
            
            <h3>Slowest Queries</h3>
            <table>
                <tr><th>Query</th><th>Duration</th><th>Time</th></tr>
                ${slowQueriesHtml}
            </table>
        </div>
        
        <div class="card">
            <h2>⚡ Cache Performance</h2>
            <div class="metric">
                <div class="metric-label">Health</div>
                <div class="metric-value ${dashboard.cache.health ? 'status-healthy' : 'status-unhealthy'}">
                    ${dashboard.cache.health ? '✅ Healthy' : '❌ Unhealthy'}
                </div>
            </div>
            <div class="metric">
                <div class="metric-label">Hit Rate</div>
                <div class="metric-value">${dashboard.cache.hitRate}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Operations</div>
                <div class="metric-value">${dashboard.cache.operations.gets} gets, ${dashboard.cache.operations.sets} sets</div>
            </div>
            <div class="metric">
                <div class="metric-label">Memory Usage</div>
                <div class="metric-value">${dashboard.cache.memory}</div>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

// Middleware to record endpoint performance
export const endpointTrackingMiddleware = (req: Request, res: Response, next: any) => {
  const startTime = Date.now();
  
  // Override res.end to record metrics
  const originalEnd = res.end.bind(res);
  res.end = function(...args: any[]) {
    const responseTime = Date.now() - startTime;
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    performanceDashboard.recordEndpoint(endpoint, responseTime);
    return originalEnd(...args);
  } as any;

  next();
};