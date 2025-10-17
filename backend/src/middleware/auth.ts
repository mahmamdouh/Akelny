import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth';
import { pool } from '../config/database';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: 'Access token required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Verify the token
    const decoded = jwt.verify(token, authConfig.jwt.secret as string) as {
      userId: string;
      email: string;
      iat: number;
      exp: number;
    };

    // Fetch user details from database to ensure user still exists
    const userQuery = 'SELECT id, email, name FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [decoded.userId]);

    if (userResult.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: 'Invalid token - user not found',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Add user info to request
    req.user = {
      id: userResult.rows[0].id,
      email: userResult.rows[0].email,
      name: userResult.rows[0].name,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_002',
          message: 'Token expired',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: 'Invalid token',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SYS_001',
        message: 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without authentication
      next();
      return;
    }

    // Try to authenticate, but don't fail if token is invalid
    try {
      const decoded = jwt.verify(token, authConfig.jwt.secret as string) as {
        userId: string;
        email: string;
      };

      const userQuery = 'SELECT id, email, name FROM users WHERE id = $1';
      const userResult = await pool.query(userQuery, [decoded.userId]);

      if (userResult.rows.length > 0) {
        req.user = {
          id: userResult.rows[0].id,
          email: userResult.rows[0].email,
          name: userResult.rows[0].name,
        };
      }
    } catch (tokenError: any) {
      // Invalid token, but continue without authentication
      console.log('Optional auth - invalid token:', tokenError?.message || tokenError);
    }

    next();
  } catch (error) {
    console.error('Optional authentication middleware error:', error);
    next(); // Continue even if there's an error
  }
};