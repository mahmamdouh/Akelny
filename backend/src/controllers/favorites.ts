import { Request, Response } from 'express';
import { pool } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { 
  UserFavorite, 
  AddFavoriteRequest, 
  FavoritesFilters,
  FavoritesListResponse 
} from '../../../shared/src/types/favorites';

export class FavoritesController {
  // Add a meal to favorites
  static async addFavorite(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { meal_id }: AddFavoriteRequest = req.body;

      if (!meal_id) {
        return res.status(400).json({ 
          error: 'Missing required field: meal_id' 
        });
      }

      // Check if meal exists
      const mealCheck = await pool.query(
        'SELECT id FROM meals WHERE id = $1',
        [meal_id]
      );

      if (mealCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Meal not found' });
      }

      // Check if already favorited
      const existingFavorite = await pool.query(
        'SELECT * FROM user_favorites WHERE user_id = $1 AND meal_id = $2',
        [userId, meal_id]
      );

      if (existingFavorite.rows.length > 0) {
        return res.status(409).json({ 
          error: 'Meal already in favorites' 
        });
      }

      // Add to favorites
      const result = await pool.query(
        `INSERT INTO user_favorites (user_id, meal_id)
         VALUES ($1, $2)
         RETURNING *`,
        [userId, meal_id]
      );

      const favorite: UserFavorite = result.rows[0];
      res.status(201).json(favorite);
    } catch (error) {
      console.error('Error adding favorite:', error);
      res.status(500).json({ error: 'Failed to add favorite' });
    }
  }

  // Remove a meal from favorites
  static async removeFavorite(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { meal_id } = req.params;

      const result = await pool.query(
        'DELETE FROM user_favorites WHERE user_id = $1 AND meal_id = $2 RETURNING *',
        [userId, meal_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Favorite not found' });
      }

      res.json({ message: 'Favorite removed successfully' });
    } catch (error) {
      console.error('Error removing favorite:', error);
      res.status(500).json({ error: 'Failed to remove favorite' });
    }
  }

  // Get user's favorite meals
  static async getFavorites(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const {
        meal_type,
        kitchen_ids,
        search,
        limit = 50,
        offset = 0
      }: FavoritesFilters = req.query as any;

      let query = `
        SELECT 
          uf.*,
          m.title_en,
          m.title_ar,
          m.description_en,
          m.description_ar,
          m.kitchen_id,
          m.meal_type,
          m.servings,
          m.prep_time_min,
          m.cook_time_min,
          m.nutrition_totals,
          m.image_url,
          m.is_public,
          m.created_at as meal_created_at
        FROM user_favorites uf
        JOIN meals m ON uf.meal_id = m.id
        WHERE uf.user_id = $1
      `;

      const queryParams: any[] = [userId];
      let paramIndex = 2;

      if (meal_type) {
        query += ` AND m.meal_type = $${paramIndex}`;
        queryParams.push(meal_type);
        paramIndex++;
      }

      if (kitchen_ids && kitchen_ids.length > 0) {
        const kitchenIdsArray = Array.isArray(kitchen_ids) ? kitchen_ids : kitchen_ids.split(',');
        query += ` AND m.kitchen_id = ANY($${paramIndex})`;
        queryParams.push(kitchenIdsArray);
        paramIndex++;
      }

      if (search) {
        query += ` AND (
          m.title_en ILIKE $${paramIndex} OR 
          m.title_ar ILIKE $${paramIndex} OR
          m.description_en ILIKE $${paramIndex} OR
          m.description_ar ILIKE $${paramIndex}
        )`;
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      // Get total count
      const countQuery = query.replace(
        'SELECT uf.*, m.title_en, m.title_ar, m.description_en, m.description_ar, m.kitchen_id, m.meal_type, m.servings, m.prep_time_min, m.cook_time_min, m.nutrition_totals, m.image_url, m.is_public, m.created_at as meal_created_at',
        'SELECT COUNT(*)'
      );
      const countResult = await pool.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].count);

      // Add ordering, limit, and offset
      query += ` ORDER BY uf.added_at DESC`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);

      const result = await pool.query(query, queryParams);

      const favorites: UserFavorite[] = result.rows.map(row => ({
        user_id: row.user_id,
        meal_id: row.meal_id,
        added_at: row.added_at,
        meal: {
          id: row.meal_id,
          title_en: row.title_en,
          title_ar: row.title_ar,
          description_en: row.description_en,
          description_ar: row.description_ar,
          kitchen_id: row.kitchen_id,
          meal_type: row.meal_type,
          servings: row.servings,
          prep_time_min: row.prep_time_min,
          cook_time_min: row.cook_time_min,
          steps_en: null,
          steps_ar: null,
          nutrition_totals: row.nutrition_totals,
          image_url: row.image_url,
          created_by_user_id: null,
          is_public: row.is_public,
          is_approved: true,
          created_at: row.meal_created_at,
          updated_at: row.meal_created_at
        }
      }));

      const response: FavoritesListResponse = {
        favorites,
        total,
        limit: parseInt(limit.toString()),
        offset: parseInt(offset.toString())
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      res.status(500).json({ error: 'Failed to fetch favorites' });
    }
  }

  // Check if a meal is favorited by the user
  static async checkFavorite(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { meal_id } = req.params;

      const result = await pool.query(
        'SELECT * FROM user_favorites WHERE user_id = $1 AND meal_id = $2',
        [userId, meal_id]
      );

      res.json({ is_favorite: result.rows.length > 0 });
    } catch (error) {
      console.error('Error checking favorite status:', error);
      res.status(500).json({ error: 'Failed to check favorite status' });
    }
  }

  // Get user's favorite meal IDs (for suggestion weighting)
  static async getFavoriteMealIds(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const result = await pool.query(
        'SELECT meal_id FROM user_favorites WHERE user_id = $1',
        [userId]
      );

      const favoriteMealIds = result.rows.map(row => row.meal_id);
      res.json({ favorite_meal_ids: favoriteMealIds });
    } catch (error) {
      console.error('Error fetching favorite meal IDs:', error);
      res.status(500).json({ error: 'Failed to fetch favorite meal IDs' });
    }
  }
}