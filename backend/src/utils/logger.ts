import fs from 'fs';
import path from 'path';

// Log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: any;
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

class Logger {
  private logLevel: LogLevel;
  private logDir: string;
  private enableConsole: boolean;
  private enableFile: boolean;

  constructor() {
    this.logLevel = this.getLogLevel();
    this.logDir = path.join(process.cwd(), 'logs');
    this.enableConsole = process.env.NODE_ENV !== 'production';
    this.enableFile = true;
    
    this.ensureLogDirectory();
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toLowerCase() || 'info';
    switch (level) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatLogEntry(level: string, message: string, meta?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      meta,
      requestId: meta?.requestId,
      userId: meta?.userId,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    };
  }

  private writeToFile(entry: LogEntry): void {
    if (!this.enableFile) return;

    const date = new Date().toISOString().split('T')[0];
    const filename = `${date}.log`;
    const filepath = path.join(this.logDir, filename);
    
    const logLine = JSON.stringify(entry) + '\n';
    
    fs.appendFile(filepath, logLine, (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });
  }

  private writeToConsole(entry: LogEntry): void {
    if (!this.enableConsole) return;

    const colors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[37m', // White
      RESET: '\x1b[0m'
    };

    const color = colors[entry.level as keyof typeof colors] || colors.INFO;
    const timestamp = entry.timestamp.substring(11, 19); // HH:MM:SS
    
    let output = `${color}[${timestamp}] ${entry.level}${colors.RESET}: ${entry.message}`;
    
    if (entry.requestId) {
      output += ` [${entry.requestId}]`;
    }
    
    console.log(output);
    
    if (entry.meta && Object.keys(entry.meta).length > 0) {
      console.log('  Meta:', JSON.stringify(entry.meta, null, 2));
    }
  }

  private log(level: LogLevel, levelName: string, message: string, meta?: any): void {
    if (level > this.logLevel) return;

    const entry = this.formatLogEntry(levelName, message, meta);
    
    this.writeToConsole(entry);
    this.writeToFile(entry);
  }

  error(message: string, meta?: any): void {
    this.log(LogLevel.ERROR, 'error', message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log(LogLevel.WARN, 'warn', message, meta);
  }

  info(message: string, meta?: any): void {
    this.log(LogLevel.INFO, 'info', message, meta);
  }

  debug(message: string, meta?: any): void {
    this.log(LogLevel.DEBUG, 'debug', message, meta);
  }

  // HTTP request logging
  logRequest(req: any, res: any, responseTime: number): void {
    const entry = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      requestId: req.requestId,
      contentLength: res.get('Content-Length'),
      referer: req.get('Referer')
    };

    if (res.statusCode >= 400) {
      this.error('HTTP Error', entry);
    } else if (responseTime > 1000) {
      this.warn('Slow Request', entry);
    } else {
      this.info('HTTP Request', entry);
    }
  }

  // Database query logging
  logQuery(query: string, duration: number, params?: any[]): void {
    const entry = {
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      duration: `${duration}ms`,
      paramCount: params?.length || 0
    };

    if (duration > 1000) {
      this.warn('Slow Query', entry);
    } else {
      this.debug('Database Query', entry);
    }
  }

  // Error logging with stack trace
  logError(error: Error, context?: any): void {
    const entry = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context
    };

    this.error('Application Error', entry);
  }

  // Performance metrics logging
  logMetrics(metrics: any): void {
    this.info('Performance Metrics', metrics);
  }

  // Security event logging
  logSecurityEvent(event: string, details: any): void {
    this.warn(`Security Event: ${event}`, details);
  }
}

export const logger = new Logger();

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  
  // Generate request ID
  req.requestId = Math.random().toString(36).substring(2, 15);
  
  // Log request start
  logger.debug('Request Started', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.requestId
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk: any, encoding: any) {
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);
    originalEnd.call(res, chunk, encoding);
  };

  next();
};

// Error logging middleware
export const errorLogger = (err: Error, req: any, res: any, next: any) => {
  logger.logError(err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    requestId: req.requestId,
    body: req.body,
    query: req.query
  });

  next(err);
};