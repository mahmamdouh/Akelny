import { Pool, PoolConfig } from 'pg';
import { poolConfig } from '../utils/queryOptimization';
import { logger } from '../utils/logger';

// Get environment-specific pool configuration
const environment = process.env.NODE_ENV || 'development';
const envPoolConfig = environment === 'production' 
  ? poolConfig.production 
  : poolConfig.development;

const config: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'akelny_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  ...envPoolConfig
};

export const pool = new Pool(config);

// Test database connection with detailed logging
export const testConnection = async (): Promise<boolean> => {
  try {
    const start = Date.now();
    const client = await pool.connect();
    const result = await client.query('SELECT NOW(), version()');
    const duration = Date.now() - start;
    
    client.release();
    
    logger.info('Database connection test successful', {
      duration: `${duration}ms`,
      timestamp: result.rows[0].now,
      version: result.rows[0].version.split(' ')[0], // Just PostgreSQL version
      poolConfig: {
        max: config.max,
        min: config.min,
        idleTimeout: config.idleTimeoutMillis,
        connectionTimeout: config.connectionTimeoutMillis
      }
    });
    
    return true;
  } catch (error) {
    logger.error('Database connection test failed', { 
      error: error instanceof Error ? error.message : error,
      config: {
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        ssl: !!config.ssl
      }
    });
    return false;
  }
};

// Pool event handlers
pool.on('connect', (client) => {
  logger.debug('New database client connected', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  });
});

pool.on('error', (err, client) => {
  logger.error('Database pool error', { error: err.message });
});

pool.on('remove', (client) => {
  logger.debug('Database client removed from pool', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, closing database connections...`);
  try {
    await pool.end();
    logger.info('Database connections closed successfully');
  } catch (error) {
    logger.error('Error closing database connections', { error });
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));