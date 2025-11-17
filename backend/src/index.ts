import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { testConnection } from './config/database';
import { connectRedis } from './config/redis';
import { AuthService } from './services/authService';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import ingredientRoutes from './routes/ingredients';
import suggestionRoutes from './routes/suggestions';
import kitchenRoutes from './routes/kitchens';
import mealRoutes from './routes/meals';
import calendarRoutes from './routes/calendar';
import favoritesRoutes from './routes/favorites';
import communityRoutes from './routes/community';
import searchRoutes from './routes/search';

// Performance and monitoring imports
import { logger, requestLogger, errorLogger } from './utils/logger';
import { monitoring, monitoringMiddleware, healthCheckHandler, metricsHandler } from './utils/monitoring';
import { dashboardHandler, endpointTrackingMiddleware } from './utils/performanceDashboard';
import { 
  securityHeaders, 
  rateLimiters, 
  speedLimiters, 
  validateRequest, 
  requestSizeLimit,
  corsOptions 
} from './middleware/securitySimple';

// Load environment variables
dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
});

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for production (behind load balancer/reverse proxy)
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', true);
}

// Security middleware
app.use(securityHeaders);
app.use(validateRequest);
app.use(requestSizeLimit(process.env.MAX_REQUEST_SIZE || '10mb'));

// Rate limiting
app.use(rateLimiters.general);
app.use(speedLimiters.general);

// CORS
app.use(cors(corsOptions));

// Compression (should be early in middleware stack)
if (process.env.ENABLE_COMPRESSION !== 'false') {
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));
}

// Request logging
app.use(requestLogger);

// Monitoring
app.use(monitoringMiddleware);
app.use(endpointTrackingMiddleware);

// Body parsing
app.use(express.json({ 
  limit: process.env.MAX_REQUEST_SIZE || '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', healthCheckHandler);

// Metrics endpoint (for monitoring systems)
if (process.env.ENABLE_METRICS === 'true') {
  app.get('/metrics', metricsHandler);
  app.get('/dashboard', dashboardHandler);
}

// API routes
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Akelny API Server',
    version: '1.0.0'
  });
});

// Authentication routes (with stricter rate limiting)
app.use('/api/auth', rateLimiters.auth, authRoutes);

// User routes
app.use('/api/users', userRoutes);

// Ingredient routes
app.use('/api/ingredients', ingredientRoutes);

// Suggestion routes
app.use('/api/suggestions', suggestionRoutes);

// Kitchen routes
app.use('/api/kitchens', kitchenRoutes);

// Meal routes
app.use('/api/meals', mealRoutes);

// Calendar routes
app.use('/api/calendar', calendarRoutes);

// Favorites routes
app.use('/api/favorites', favoritesRoutes);

// Community routes
app.use('/api/community', communityRoutes);

// Search routes (with search-specific rate limiting)
app.use('/api/search', rateLimiters.search, searchRoutes);

// Error logging middleware
app.use(errorLogger);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Generate error ID for tracking
  const errorId = Math.random().toString(36).substring(2, 15);
  
  // Determine error status
  const status = (err as any).status || (err as any).statusCode || 500;
  
  // Log error with context
  logger.error('Unhandled error', {
    errorId,
    name: err.name,
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    requestId: (req as any).requestId
  });
  
  // Send appropriate response
  const response: any = {
    error: 'Internal server error',
    errorId,
    timestamp: new Date().toISOString()
  };
  
  // Include error details in development
  if (process.env.NODE_ENV === 'development') {
    response.message = err.message;
    response.stack = err.stack;
  }
  
  res.status(status).json(response);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize connections and start server
const startServer = async () => {
  try {
    logger.info('Starting Akelny Backend Server...', {
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: PORT
    });
    
    // Test database connection
    logger.info('Connecting to database...');
    const dbConnected = await testConnection();
    if (dbConnected) {
      logger.info('✅ Database connection established');
    } else {
      logger.error('❌ Database connection failed');
      throw new Error('Database connection failed');
    }
    
    // Connect to Redis
    logger.info('Connecting to Redis...');
    const redisConnected = await connectRedis();
    if (redisConnected) {
      logger.info('✅ Redis connection established');
    } else {
      logger.warn('⚠️ Redis connection failed, continuing without cache');
    }
    
    // Initialize auth service
    logger.info('Initializing authentication service...');
    try {
      await AuthService.initialize();
      logger.info('✅ AuthService initialized');
    } catch (error) {
      logger.error('❌ AuthService initialization failed', { error });
      throw error;
    }
    
    // Start server
    logger.info('Starting Express server...');
    console.log('🔧 About to call app.listen on port', PORT);
    const server = app.listen(Number(PORT), process.env.HOST || '0.0.0.0', () => {
      logger.info('🚀 Server started successfully', {
        port: PORT,
        host: process.env.HOST || '0.0.0.0',
        environment: process.env.NODE_ENV || 'development',
        healthCheck: `http://localhost:${PORT}/health`,
        metricsEnabled: process.env.ENABLE_METRICS === 'true',
        cacheEnabled: redisConnected,
        compressionEnabled: process.env.ENABLE_COMPRESSION !== 'false'
      });
    });
    
    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        
        // Close database connections, Redis, etc.
        process.exit(0);
      });
      
      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
      process.exit(1);
    });
    
  } catch (error) {
    logger.error('❌ Failed to start server', { error });
    process.exit(1);
  }
};

startServer();