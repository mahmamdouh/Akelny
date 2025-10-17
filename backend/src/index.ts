import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
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

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'akelny-backend'
  });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Akelny API Server',
    version: '1.0.0'
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

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

// Search routes
app.use('/api/search', searchRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize connections and start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Connect to Redis
    await connectRedis();
    
    // Initialize auth service
    await AuthService.initialize();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();