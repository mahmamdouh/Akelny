import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

// Simple rate limiting implementation (without external dependencies)
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

const createRateLimiter = (windowMs: number, max: number, message: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    // Clean up expired entries
    if (rateLimitStore[key] && now > rateLimitStore[key].resetTime) {
      delete rateLimitStore[key];
    }
    
    // Initialize or increment counter
    if (!rateLimitStore[key]) {
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + windowMs
      };
    } else {
      rateLimitStore[key].count++;
    }
    
    // Check if limit exceeded
    if (rateLimitStore[key].count > max) {
      return res.status(429).json(message);
    }
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': max.toString(),
      'X-RateLimit-Remaining': Math.max(0, max - rateLimitStore[key].count).toString(),
      'X-RateLimit-Reset': new Date(rateLimitStore[key].resetTime).toISOString()
    });
    
    next();
  };
};

// Rate limiting configurations
export const rateLimiters = {
  // General API rate limiting
  general: createRateLimiter(
    parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    {
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes'
    }
  ),

  // Strict rate limiting for authentication endpoints
  auth: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5, // Limit each IP to 5 requests per windowMs
    {
      error: 'Too many authentication attempts, please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes'
    }
  ),

  // Rate limiting for search endpoints
  search: createRateLimiter(
    1 * 60 * 1000, // 1 minute
    30, // Limit each IP to 30 search requests per minute
    {
      error: 'Too many search requests, please slow down.',
      code: 'SEARCH_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 minute'
    }
  ),

  // Rate limiting for file uploads
  upload: createRateLimiter(
    60 * 60 * 1000, // 1 hour
    10, // Limit each IP to 10 uploads per hour
    {
      error: 'Too many file uploads, please try again later.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 hour'
    }
  )
};

// Simple speed limiting implementation
const speedLimitStore: RateLimitStore = {};

export const speedLimiters = {
  general: (req: Request, res: Response, next: NextFunction) => {
    // Skip for health checks
    if (req.path === '/health' || req.path === '/metrics') {
      return next();
    }
    
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const delayAfter = 50;
    const delayMs = 500;
    const maxDelayMs = 20000;
    
    // Clean up expired entries
    if (speedLimitStore[key] && now > speedLimitStore[key].resetTime) {
      delete speedLimitStore[key];
    }
    
    // Initialize or increment counter
    if (!speedLimitStore[key]) {
      speedLimitStore[key] = {
        count: 1,
        resetTime: now + windowMs
      };
    } else {
      speedLimitStore[key].count++;
    }
    
    // Calculate delay
    const requestsOverLimit = Math.max(0, speedLimitStore[key].count - delayAfter);
    const delay = Math.min(requestsOverLimit * delayMs, maxDelayMs);
    
    if (delay > 0) {
      setTimeout(next, delay);
    } else {
      next();
    }
  }
};

// Enhanced helmet configuration for production
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false, // Disable for API server
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// Request validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  // Check for suspicious patterns in request
  const suspiciousPatterns: RegExp[] = [
    /(<script|javascript:|vbscript:|onload=|onerror=)/i,
    /(union\s+select|drop\s+table|insert\s+into)/i,
    /(\.\./){3,}/,
    /(exec\s*\(|eval\s*\(|system\s*\()/i
  ];

  const checkString = (str: string): boolean => {
    return suspiciousPatterns.some((pattern: RegExp) => pattern.test(str));
  };

  const checkObject = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return checkString(obj);
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some((value: any) => checkObject(value));
    }
    return false;
  };

  // Check URL, query parameters, and body
  if (
    checkString(req.url) ||
    checkObject(req.query) ||
    checkObject(req.body)
  ) {
    console.warn('🚨 Suspicious request detected:', {
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    return res.status(400).json({
      error: 'Invalid request format',
      code: 'INVALID_REQUEST'
    });
  }

  next();
};

// IP whitelist middleware (for admin endpoints)
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || (req.socket && req.socket.remoteAddress) || '';
    
    if (!allowedIPs.includes(clientIP)) {
      console.warn('🚨 Unauthorized IP access attempt:', {
        ip: clientIP,
        url: req.url,
        timestamp: new Date().toISOString()
      });

      return res.status(403).json({
        error: 'Access denied',
        code: 'IP_NOT_ALLOWED'
      });
    }

    next();
  };
};

// Request size limiting
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const maxSizeInBytes = parseSize(maxSize);
      
      if (sizeInBytes > maxSizeInBytes) {
        return res.status(413).json({
          error: 'Request entity too large',
          code: 'REQUEST_TOO_LARGE',
          maxSize
        });
      }
    }
    
    next();
  };
};

// Helper function to parse size strings
const parseSize = (size: string): number => {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return value * (units[unit] || 1);
};

// CORS configuration for production
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['*'];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Accept-Language',
    'X-Request-ID'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Cache',
    'X-Request-ID',
    'X-Response-Time'
  ],
  maxAge: 86400 // 24 hours
};