import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { SuggestionEngine } from '../services/suggestionEngine';
import { redisClient } from '../config/redis';

export class SuggestionsController {
  /**
   * Get meal suggestions based on user preferences and pantry
   */
  static async getSuggestions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          error: {
            code: 'AUTH_003',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const {
        mealType,
        kitchenIds,
        excludeRecent = 'true',
        strictMode = 'true',
        favoriteBoost = 'true',
        limit = '10',
        offset = '0'
      } = req.query;

      // Parse query parameters
      const options = {
        mealType: mealType as 'breakfast' | 'lunch' | 'dinner' | undefined,
        kitchenIds: kitchenIds ? (kitchenIds as string).split(',') : undefined,
        excludeRecent: excludeRecent === 'true',
        strictMode: strictMode === 'true',
        favoriteBoost: favoriteBoost === 'true',
        limit: Math.min(parseInt(limit as string) || 10, 50), // Max 50 suggestions
        offset: parseInt(offset as string) || 0
      };

      // Generate cache key
      const cacheKey = `suggestions:${userId}:${JSON.stringify(options)}`;
      
      // Try to get from cache first
      try {
        const cachedResult = await redisClient.get(cacheKey);
        if (cachedResult) {
          const parsedResult = JSON.parse(cachedResult);
          res.json({
            ...parsedResult,
            cached: true,
            cache_timestamp: new Date().toISOString()
          });
          return;
        }
      } catch (cacheError) {
        console.warn('Cache read error:', cacheError);
        // Continue without cache
      }

      // Get suggestions from engine
      const result = await SuggestionEngine.getSuggestions(userId, options);

      // Cache the result for 1 hour
      try {
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));
      } catch (cacheError) {
        console.warn('Cache write error:', cacheError);
        // Continue without caching
      }

      res.json({
        ...result,
        cached: false,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting meal suggestions:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to get meal suggestions',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Filter meals by user's pantry ingredients
   */
  static async filterByPantry(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          error: {
            code: 'AUTH_003',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const {
        strictMode = 'false',
        mealType,
        kitchenIds
      } = req.query;

      const options = {
        strictMode: strictMode === 'true',
        mealType: mealType as 'breakfast' | 'lunch' | 'dinner' | undefined,
        kitchenIds: kitchenIds ? (kitchenIds as string).split(',') : undefined
      };

      // Generate cache key
      const cacheKey = `pantry-filter:${userId}:${JSON.stringify(options)}`;
      
      // Try to get from cache first
      try {
        const cachedResult = await redisClient.get(cacheKey);
        if (cachedResult) {
          const parsedResult = JSON.parse(cachedResult);
          res.json({
            ...parsedResult,
            cached: true,
            cache_timestamp: new Date().toISOString()
          });
          return;
        }
      } catch (cacheError) {
        console.warn('Cache read error:', cacheError);
      }

      const result = await SuggestionEngine.filterByPantry(userId, options);

      // Cache for 30 minutes (pantry changes more frequently)
      try {
        await redisClient.setEx(cacheKey, 1800, JSON.stringify(result));
      } catch (cacheError) {
        console.warn('Cache write error:', cacheError);
      }

      res.json({
        ...result,
        user_id: userId,
        filters: options,
        cached: false,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error filtering meals by pantry:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to filter meals by pantry',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Get random meal suggestions with weighted selection
   */
  static async getRandomPicker(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          error: {
            code: 'AUTH_003',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const {
        count = '3',
        mealType,
        kitchenIds,
        excludeRecent = 'true',
        strictMode = 'true',
        favoriteBoost = 'true'
      } = req.query;

      const options = {
        randomCount: Math.min(parseInt(count as string) || 3, 10), // Max 10 random meals
        mealType: mealType as 'breakfast' | 'lunch' | 'dinner' | undefined,
        kitchenIds: kitchenIds ? (kitchenIds as string).split(',') : undefined,
        excludeRecent: excludeRecent === 'true',
        strictMode: strictMode === 'true',
        favoriteBoost: favoriteBoost === 'true'
      };

      // Don't cache random results as they should be different each time
      const result = await SuggestionEngine.getRandomSuggestions(userId, options);

      res.json({
        ...result,
        user_id: userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting random meal suggestions:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to get random meal suggestions',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Clear suggestion cache for a user (useful after pantry updates)
   */
  static async clearCache(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          error: {
            code: 'AUTH_003',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      try {
        // Clear all suggestion-related cache entries for this user
        const keys = await redisClient.keys(`suggestions:${userId}:*`);
        const pantryKeys = await redisClient.keys(`pantry-filter:${userId}:*`);
        
        const allKeys = [...keys, ...pantryKeys];
        
        if (allKeys.length > 0) {
          await redisClient.del(allKeys);
        }

        res.json({
          message: 'Suggestion cache cleared successfully',
          cleared_keys: allKeys.length,
          user_id: userId,
          timestamp: new Date().toISOString()
        });
      } catch (cacheError) {
        console.warn('Cache clear error:', cacheError);
        res.json({
          message: 'Cache clear attempted but may have failed',
          user_id: userId,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error clearing suggestion cache:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to clear suggestion cache',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Get suggestion statistics for debugging/analytics
   */
  static async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          error: {
            code: 'AUTH_003',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      // Get basic stats about user's suggestion context
      const result = await SuggestionEngine.getSuggestions(userId, { 
        limit: 1, 
        strictMode: false 
      });

      const stats = {
        user_id: userId,
        total_eligible_meals: result.metadata.eligibleMealsCount,
        partial_matches: result.metadata.partialMatchesCount,
        recent_meals_excluded: result.metadata.excludedRecentCount,
        favorite_boost_available: result.metadata.favoriteBoostApplied,
        applied_filters: result.appliedFilters,
        timestamp: new Date().toISOString()
      };

      res.json(stats);
    } catch (error) {
      console.error('Error getting suggestion stats:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to get suggestion statistics',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
}