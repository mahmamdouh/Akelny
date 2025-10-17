import { Request, Response } from 'express';
import { pool } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

interface IngredientFilters {
  category?: string;
  search?: string;
  language?: 'en' | 'ar';
  limit?: number;
  offset?: number;
}

interface CreateIngredientRequest {
  name_en: string;
  name_ar?: string;
  category: string;
  default_unit: string;
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  minerals?: Record<string, number>;
}

export class IngredientsController {
  // Get all ingredients with optional filtering and search
  static async getIngredients(req: Request, res: Response): Promise<void> {
    try {
      const {
        category,
        search,
        language = 'en',
        limit = 50,
        offset = 0
      } = req.query as IngredientFilters;

      let query = `
        SELECT 
          id,
          name_en,
          name_ar,
          category,
          default_unit,
          calories_per_100g,
          protein_per_100g,
          carbs_per_100g,
          fat_per_100g,
          minerals,
          user_created_by,
          is_approved,
          created_at
        FROM ingredients
        WHERE is_approved = true
      `;
      
      const queryParams: any[] = [];
      let paramIndex = 1;

      // Add category filter
      if (category) {
        query += ` AND category = $${paramIndex}`;
        queryParams.push(category);
        paramIndex++;
      }

      // Add search functionality for both English and Arabic
      if (search) {
        if (language === 'ar') {
          query += ` AND (name_ar ILIKE $${paramIndex} OR name_en ILIKE $${paramIndex})`;
        } else {
          query += ` AND (name_en ILIKE $${paramIndex} OR name_ar ILIKE $${paramIndex})`;
        }
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      // Add ordering and pagination
      query += ` ORDER BY name_${language} ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);

      const result = await pool.query(query, queryParams);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) FROM ingredients WHERE is_approved = true';
      const countParams: any[] = [];
      let countParamIndex = 1;

      if (category) {
        countQuery += ` AND category = $${countParamIndex}`;
        countParams.push(category);
        countParamIndex++;
      }

      if (search) {
        countQuery += ` AND (name_en ILIKE $${countParamIndex} OR name_ar ILIKE $${countParamIndex})`;
        countParams.push(`%${search}%`);
      }

      const countResult = await pool.query(countQuery, countParams);
      const totalCount = parseInt(countResult.rows[0].count);

      res.json({
        ingredients: result.rows,
        pagination: {
          total: totalCount,
          limit: parseInt(limit.toString()),
          offset: parseInt(offset.toString()),
          hasMore: parseInt(offset.toString()) + parseInt(limit.toString()) < totalCount
        }
      });
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to fetch ingredients',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  // Get ingredient by ID
  static async getIngredientById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query(`
        SELECT 
          id,
          name_en,
          name_ar,
          category,
          default_unit,
          calories_per_100g,
          protein_per_100g,
          carbs_per_100g,
          fat_per_100g,
          minerals,
          user_created_by,
          is_approved,
          created_at
        FROM ingredients
        WHERE id = $1 AND is_approved = true
      `, [id]);

      if (result.rows.length === 0) {
        res.status(404).json({
          error: {
            code: 'BIZ_001',
            message: 'Ingredient not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      res.json({ ingredient: result.rows[0] });
    } catch (error) {
      console.error('Error fetching ingredient:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to fetch ingredient',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  // Create new ingredient (user-contributed)
  static async createIngredient(req: AuthenticatedRequest, res: Response): Promise<void> {
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
        name_en,
        name_ar,
        category,
        default_unit,
        calories_per_100g,
        protein_per_100g,
        carbs_per_100g,
        fat_per_100g,
        minerals
      } = req.body as CreateIngredientRequest;

      // Validate required fields
      if (!name_en || !category || !default_unit) {
        res.status(400).json({
          error: {
            code: 'VAL_001',
            message: 'Missing required fields: name_en, category, default_unit',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      // Check if ingredient already exists
      const existingIngredient = await pool.query(`
        SELECT id FROM ingredients 
        WHERE LOWER(name_en) = LOWER($1) OR (name_ar IS NOT NULL AND LOWER(name_ar) = LOWER($2))
      `, [name_en, name_ar || '']);

      if (existingIngredient.rows.length > 0) {
        res.status(409).json({
          error: {
            code: 'BIZ_002',
            message: 'Ingredient already exists',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const result = await pool.query(`
        INSERT INTO ingredients (
          name_en, name_ar, category, default_unit,
          calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
          minerals, user_created_by, is_approved
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false)
        RETURNING *
      `, [
        name_en,
        name_ar || null,
        category,
        default_unit,
        calories_per_100g || null,
        protein_per_100g || null,
        carbs_per_100g || null,
        fat_per_100g || null,
        minerals ? JSON.stringify(minerals) : null,
        userId
      ]);

      res.status(201).json({
        ingredient: result.rows[0],
        message: 'Ingredient created successfully and pending approval'
      });
    } catch (error) {
      console.error('Error creating ingredient:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to create ingredient',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  // Get ingredient categories
  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const result = await pool.query(`
        SELECT DISTINCT category, COUNT(*) as count
        FROM ingredients 
        WHERE is_approved = true AND category IS NOT NULL
        GROUP BY category
        ORDER BY category ASC
      `);

      res.json({ categories: result.rows });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to fetch categories',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  // Search ingredients with advanced text search
  static async searchIngredients(req: Request, res: Response): Promise<void> {
    try {
      const { q, language = 'en', limit = 20 } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(400).json({
          error: {
            code: 'VAL_001',
            message: 'Search query is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      // Use PostgreSQL full-text search for better results
      const searchQuery = `
        SELECT 
          id,
          name_en,
          name_ar,
          category,
          default_unit,
          calories_per_100g,
          protein_per_100g,
          carbs_per_100g,
          fat_per_100g,
          minerals,
          ts_rank(
            to_tsvector('${language === 'ar' ? 'arabic' : 'english'}', 
                       COALESCE(name_${language}, name_en)), 
            plainto_tsquery('${language === 'ar' ? 'arabic' : 'english'}', $1)
          ) as rank
        FROM ingredients
        WHERE is_approved = true
        AND (
          to_tsvector('${language === 'ar' ? 'arabic' : 'english'}', 
                     COALESCE(name_${language}, name_en)) 
          @@ plainto_tsquery('${language === 'ar' ? 'arabic' : 'english'}', $1)
          OR name_en ILIKE $2
          OR name_ar ILIKE $2
        )
        ORDER BY rank DESC, name_${language} ASC
        LIMIT $3
      `;

      const result = await pool.query(searchQuery, [q, `%${q}%`, limit]);

      res.json({
        ingredients: result.rows,
        query: q,
        language,
        count: result.rows.length
      });
    } catch (error) {
      console.error('Error searching ingredients:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to search ingredients',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
}