import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

// Simple rate limiting store
const rateLimitStore: { [key: string]: { count: number; resetTime: number } } = {};

// Create rate limiter function
const createRateLimiter = (windowMs: number, max: number, message: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    if (rateLimitStore[key] && now > rateLimitStore[key].resetTime) {
      delete rateLimitStore[key];
    }
    
    if (!rateLimitStore[key]) {
      rateLimitStore[key] = { count: 1, resetTime: now + windowMs };
    } else {
      rateLimitStore[key].count++;
    }
    
    if (rateLimitStore[key].count > max) {
      return res.status(429).json(message);
    }
    
    next();
  };
};

// Rate limiters
export const rateLimiters = {
  general: createRateLimiter(900000, 100, { error: 'Too many requests' }),
  auth: createRateLimiter(900000, 5, { error: 'Too many auth attempts' }),
  search: createRateLimiter(60000, 30, { error: 'Too many search requests' }),
  upload: createRateLimiter(3600000, 10, { error: 'Too many uploads' })
};

// Speed limiter
export const speedLimiters = {
  general: (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/health' || req.path === '/metrics') {
      return next();
    }
    next();
  }
};

// Security headers
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
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Request validation
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const patterns = [
    /<script/i,
    /javascript:/i,
    /union\s+select/i,
    /drop\s+table/i
  ];

  const checkString = (str: string): boolean => {
    return patterns.some(pattern => pattern.test(str));
  };

  if (checkString(req.url) || checkString(JSON.stringify(req.query)) || checkString(JSON.stringify(req.body))) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  next();
};

// Request size limit
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('Content-Length');
    if (contentLength && parseInt(contentLength) > 10485760) { // 10MB
      return res.status(413).json({ error: 'Request too large' });
    }
    next();
  };
};

// CORS options
export const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Accept-Language'],
  maxAge: 86400
};