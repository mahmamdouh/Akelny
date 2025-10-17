import { Request, Response } from 'express';
import Joi from 'joi';
import { AuthService } from '../services/authService';

// Local type definitions
interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  country: string;
  language: 'en' | 'ar';
}

interface LoginRequest {
  email: string;
  password: string;
}

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  country: Joi.string().length(2).uppercase().required(),
  language: Joi.string().valid('en', 'ar').required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Validation failed',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
            })),
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const userData: CreateUserRequest = value;
      const result = await AuthService.register(userData);

      res.status(201).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Registration error:', error);

      if (error?.message === 'User already exists with this email') {
        res.status(409).json({
          success: false,
          error: {
            code: 'BIZ_001',
            message: 'User already exists with this email',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Internal server error',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Login user
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Validation failed',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
            })),
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const loginData: LoginRequest = value;
      const result = await AuthService.login(loginData);

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Login error:', error);

      if (error?.message === 'Invalid credentials') {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_001',
            message: 'Invalid credentials',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Internal server error',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = refreshTokenSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Validation failed',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
            })),
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { refreshToken } = value;
      const result = await AuthService.refreshAccessToken(refreshToken);

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Token refresh error:', error);

      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_002',
          message: 'Invalid or expired refresh token',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Logout user
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = refreshTokenSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Validation failed',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
            })),
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { refreshToken } = value;
      await AuthService.logout(refreshToken);

      res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully' },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Logout error:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Internal server error',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get current user profile (protected route)
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      // User info is added by the auth middleware
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_001',
            message: 'Authentication required',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { user },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get profile error:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Internal server error',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}