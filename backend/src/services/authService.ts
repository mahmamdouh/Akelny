import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { authConfig } from '../config/auth';
import { redisClient } from '../config/redis';

// Local type definitions
interface User {
  id: string;
  name: string;
  email: string;
  country: string;
  primaryKitchenId: string;
  language: 'en' | 'ar';
  createdAt: Date;
  updatedAt: Date;
}

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

interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export class AuthService {
  static async initialize() {
    // Redis client is already initialized in the main server
    console.log('✅ AuthService initialized');
  }

  /**
   * Generate JWT access and refresh tokens
   */
  static generateTokens(userId: string, email: string): { token: string; refreshToken: string } {
    const payload = { userId, email };
    
    // Generate access token
    const token = jwt.sign(
      payload, 
      authConfig.jwt.secret as string,
      { expiresIn: '1h' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      payload, 
      authConfig.jwt.refreshSecret as string,
      { expiresIn: '7d' }
    );

    return { token, refreshToken };
  }

  /**
   * Verify refresh token and generate new access token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, authConfig.jwt.refreshSecret as string) as {
        userId: string;
        email: string;
      };

      // Check if refresh token is blacklisted
      try {
        const isBlacklisted = await redisClient.get(`blacklist:${refreshToken}`);
        if (isBlacklisted) {
          throw new Error('Refresh token is blacklisted');
        }
      } catch (redisError: any) {
        console.warn('Redis check failed, continuing without cache:', redisError?.message || redisError);
      }

      // Verify user still exists
      const userQuery = 'SELECT id, email FROM users WHERE id = $1';
      const userResult = await pool.query(userQuery, [decoded.userId]);

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      // Generate new tokens
      const tokens = this.generateTokens(decoded.userId, decoded.email);

      // Blacklist the old refresh token
      try {
        await redisClient.setEx(
          `blacklist:${refreshToken}`,
          authConfig.session.ttl,
          'true'
        );
      } catch (redisError: any) {
        console.warn('Redis blacklist failed:', redisError?.message || redisError);
      }

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Register a new user
   */
  static async register(userData: CreateUserRequest): Promise<AuthResponse> {
    const { name, email, password, country, language } = userData;

    // Check if user already exists
    const existingUserQuery = 'SELECT id FROM users WHERE email = $1';
    const existingUser = await pool.query(existingUserQuery, [email.toLowerCase()]);

    if (existingUser.rows.length > 0) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, authConfig.bcrypt.saltRounds);

    // Get primary kitchen based on country mapping
    const primaryKitchenId = await this.getPrimaryKitchenByCountry(country);

    // Create user
    const insertUserQuery = `
      INSERT INTO users (name, email, password_hash, country, primary_kitchen_id, language)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, country, primary_kitchen_id, language, created_at, updated_at
    `;

    const userResult = await pool.query(insertUserQuery, [
      name,
      email.toLowerCase(),
      hashedPassword,
      country,
      primaryKitchenId,
      language,
    ]);

    const user = userResult.rows[0];

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email);

    // Store refresh token in Redis
    try {
      await redisClient.setEx(
        `refresh_token:${user.id}`,
        authConfig.session.ttl,
        tokens.refreshToken
      );
    } catch (redisError: any) {
      console.warn('Redis token storage failed:', redisError?.message || redisError);
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        country: user.country,
        primaryKitchenId: user.primary_kitchen_id,
        language: user.language,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      token: tokens.token,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Login user
   */
  static async login(loginData: LoginRequest): Promise<AuthResponse> {
    const { email, password } = loginData;

    // Find user by email
    const userQuery = `
      SELECT id, name, email, password_hash, country, primary_kitchen_id, language, created_at, updated_at
      FROM users 
      WHERE email = $1
    `;
    const userResult = await pool.query(userQuery, [email.toLowerCase()]);

    if (userResult.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = userResult.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email);

    // Store refresh token in Redis
    try {
      await redisClient.setEx(
        `refresh_token:${user.id}`,
        authConfig.session.ttl,
        tokens.refreshToken
      );
    } catch (redisError: any) {
      console.warn('Redis token storage failed:', redisError?.message || redisError);
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        country: user.country,
        primaryKitchenId: user.primary_kitchen_id,
        language: user.language,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      token: tokens.token,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Logout user (blacklist refresh token)
   */
  static async logout(refreshToken: string): Promise<void> {
    try {
      // Blacklist the refresh token
      await redisClient.setEx(
        `blacklist:${refreshToken}`,
        authConfig.session.ttl,
        'true'
      );
    } catch (redisError: any) {
      console.warn('Redis logout failed:', redisError?.message || redisError);
    }
  }

  /**
   * Get primary kitchen based on country
   */
  private static async getPrimaryKitchenByCountry(country: string): Promise<string> {
    // Country to kitchen mapping
    const countryKitchenMap: { [key: string]: string } = {
      'EG': 'Egyptian',
      'SA': 'Gulf',
      'AE': 'Gulf',
      'KW': 'Gulf',
      'QA': 'Gulf',
      'BH': 'Gulf',
      'OM': 'Gulf',
      'CN': 'Asian',
      'JP': 'Asian',
      'KR': 'Asian',
      'TH': 'Asian',
      'VN': 'Asian',
      'IN': 'Indian',
      'PK': 'Indian',
      'BD': 'Indian',
      'US': 'European',
      'GB': 'European',
      'FR': 'European',
      'DE': 'European',
      'IT': 'European',
      'ES': 'European',
      'MX': 'Mexican',
      'GT': 'Mexican',
      'HN': 'Mexican',
    };

    const kitchenName = countryKitchenMap[country] || 'European'; // Default to European

    // Get kitchen ID from database
    const kitchenQuery = 'SELECT id FROM kitchens WHERE name_en = $1';
    const kitchenResult = await pool.query(kitchenQuery, [kitchenName]);

    if (kitchenResult.rows.length === 0) {
      // Fallback to first available kitchen
      const fallbackQuery = 'SELECT id FROM kitchens LIMIT 1';
      const fallbackResult = await pool.query(fallbackQuery);
      return fallbackResult.rows[0]?.id || null;
    }

    return kitchenResult.rows[0].id;
  }
}