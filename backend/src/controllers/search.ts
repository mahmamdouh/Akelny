import { Request, Response } from 'express';
import { pool } from '../config/database';

interface SearchFilters {
  query?: string;
  language?: 'en' | 'ar';
  limit?: number;
  offset?: number;
}

interface IngredientSearchFilters extends SearchFilters {
  category?: string;
}

interface MealSearchFilters extends SearchFilters {
  kitchen_ids?: string[] | string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner';
  is_public?: boolean | string;
}

export class SearchController {
  // Search ingredients with bilingual text matching
  static async searchIngredients(req: Request, res: Response): Promise<void> {
    try {
      const {
        query,
        language = 'en',
        category,
        limit = 20,
        offset = 0
      } = req.query as IngredientSearchFilters;

      if (!query || typeof query !== 'string') {
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

      let searchQuery = `
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
      `;

      const queryParams: any[] = [query, `%${query}%`];
      let paramIndex = 3;

      // Add category filter if provided
      if (category) {
        searchQuery += ` AND category = $${paramIndex}`;
        queryParams.push(category);
        paramIndex++;
      }

      searchQuery += ` ORDER BY rank DESC, name_${language} ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);

      const result = await pool.query(searchQuery, queryParams);

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM ingredients
        WHERE is_approved = true
        AND (
          to_tsvector('${language === 'ar' ? 'arabic' : 'english'}', 
                     COALESCE(name_${language}, name_en)) 
          @@ plainto_tsquery('${language === 'ar' ? 'arabic' : 'english'}', $1)
          OR name_en ILIKE $2
          OR name_ar ILIKE $2
        )
      `;

      const countParams = [query, `%${query}%`];
      if (category) {
        countQuery += ` AND category = $3`;
        countParams.push(category);
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      res.json({
        ingredients: result.rows,
        pagination: {
          total,
          limit: parseInt(limit.toString()),
          offset: parseInt(offset.toString()),
          hasMore: parseInt(offset.toString()) + parseInt(limit.toString()) < total
        },
        query,
        language,
        filters: {
          category
        }
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

  // Search meals with multiple criteria support
  static async searchMeals(req: Request, res: Response): Promise<void> {
    try {
      const {
        query,
        language = 'en',
        kitchen_ids,
        meal_type,
        is_public,
        limit = 20,
        offset = 0
      } = req.query as MealSearchFilters;

      if (!query || typeof query !== 'string') {
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

      let searchQuery = `
        SELECT 
          m.id,
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
          m.created_by_user_id,
          m.is_public,
          m.is_approved,
          m.created_at,
          m.updated_at,
          k.name_en as kitchen_name_en,
          k.name_ar as kitchen_name_ar,
          k.icon_url as kitchen_icon_url,
          u.name as creator_name,
          ts_rank(
            to_tsvector('${language === 'ar' ? 'arabic' : 'english'}', 
                       COALESCE(m.title_${language}, m.title_en) || ' ' || 
                       COALESCE(m.description_${language}, m.description_en, '')), 
            plainto_tsquery('${language === 'ar' ? 'arabic' : 'english'}', $1)
          ) as rank
        FROM meals m
        LEFT JOIN kitchens k ON m.kitchen_id = k.id
        LEFT JOIN users u ON m.created_by_user_id = u.id
        WHERE m.is_approved = true
        AND (
          to_tsvector('${language === 'ar' ? 'arabic' : 'english'}', 
                     COALESCE(m.title_${language}, m.title_en) || ' ' || 
                     COALESCE(m.description_${language}, m.description_en, '')) 
          @@ plainto_tsquery('${language === 'ar' ? 'arabic' : 'english'}', $1)
          OR m.title_en ILIKE $2
          OR m.title_ar ILIKE $2
          OR m.description_en ILIKE $2
          OR m.description_ar ILIKE $2
        )
      `;

      const queryParams: any[] = [query, `%${query}%`];
      let paramIndex = 3;

      // Add kitchen filter if provided
      if (kitchen_ids) {
        let kitchenArray: string[];
        if (Array.isArray(kitchen_ids)) {
          kitchenArray = kitchen_ids;
        } else if (typeof kitchen_ids === 'string') {
          kitchenArray = kitchen_ids.split(',');
        } else {
          kitchenArray = [];
        }
        
        if (kitchenArray.length > 0) {
          searchQuery += ` AND m.kitchen_id = ANY($${paramIndex}::uuid[])`;
          queryParams.push(kitchenArray);
          paramIndex++;
        }
      }

      // Add meal type filter if provided
      if (meal_type) {
        searchQuery += ` AND m.meal_type = $${paramIndex}`;
        queryParams.push(meal_type);
        paramIndex++;
      }

      // Add public filter if provided
      if (is_public !== undefined) {
        let isPublicBool: boolean;
        if (typeof is_public === 'string') {
          isPublicBool = is_public === 'true';
        } else {
          isPublicBool = Boolean(is_public);
        }
        searchQuery += ` AND m.is_public = $${paramIndex}`;
        queryParams.push(isPublicBool);
        paramIndex++;
      }

      searchQuery += ` ORDER BY rank DESC, m.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);

      const result = await pool.query(searchQuery, queryParams);

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM meals m
        WHERE m.is_approved = true
        AND (
          to_tsvector('${language === 'ar' ? 'arabic' : 'english'}', 
                     COALESCE(m.title_${language}, m.title_en) || ' ' || 
                     COALESCE(m.description_${language}, m.description_en, '')) 
          @@ plainto_tsquery('${language === 'ar' ? 'arabic' : 'english'}', $1)
          OR m.title_en ILIKE $2
          OR m.title_ar ILIKE $2
          OR m.description_en ILIKE $2
          OR m.description_ar ILIKE $2
        )
      `;

      const countParams: any[] = [query, `%${query}%`];
      let countParamIndex = 3;

      if (kitchen_ids) {
        let kitchenArray: string[];
        if (Array.isArray(kitchen_ids)) {
          kitchenArray = kitchen_ids;
        } else if (typeof kitchen_ids === 'string') {
          kitchenArray = kitchen_ids.split(',');
        } else {
          kitchenArray = [];
        }
        
        if (kitchenArray.length > 0) {
          countQuery += ` AND m.kitchen_id = ANY($${countParamIndex}::uuid[])`;
          countParams.push(kitchenArray);
          countParamIndex++;
        }
      }

      if (meal_type) {
        countQuery += ` AND m.meal_type = $${countParamIndex}`;
        countParams.push(meal_type);
        countParamIndex++;
      }

      if (is_public !== undefined) {
        let isPublicBool: boolean;
        if (typeof is_public === 'string') {
          isPublicBool = is_public === 'true';
        } else {
          isPublicBool = Boolean(is_public);
        }
        countQuery += ` AND m.is_public = $${countParamIndex}`;
        countParams.push(isPublicBool);
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      // Format meals response
      const meals = result.rows.map(row => ({
        id: row.id,
        title_en: row.title_en,
        title_ar: row.title_ar,
        description_en: row.description_en,
        description_ar: row.description_ar,
        kitchen_id: row.kitchen_id,
        meal_type: row.meal_type,
        servings: row.servings,
        prep_time_min: row.prep_time_min,
        cook_time_min: row.cook_time_min,
        nutrition_totals: row.nutrition_totals ? JSON.parse(row.nutrition_totals) : undefined,
        image_url: row.image_url,
        created_by_user_id: row.created_by_user_id,
        is_public: row.is_public,
        is_approved: row.is_approved,
        created_at: row.created_at,
        updated_at: row.updated_at,
        kitchen: row.kitchen_name_en ? {
          id: row.kitchen_id,
          name_en: row.kitchen_name_en,
          name_ar: row.kitchen_name_ar,
          icon_url: row.kitchen_icon_url
        } : undefined,
        creator: row.creator_name ? {
          name: row.creator_name
        } : undefined,
        rank: parseFloat(row.rank)
      }));

      res.json({
        meals,
        pagination: {
          total,
          limit: parseInt(limit.toString()),
          offset: parseInt(offset.toString()),
          hasMore: parseInt(offset.toString()) + parseInt(limit.toString()) < total
        },
        query,
        language,
        filters: {
          kitchen_ids,
          meal_type,
          is_public
        }
      });
    } catch (error) {
      console.error('Error searching meals:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to search meals',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  // Browse meals by kitchen with filtering
  static async browseMealsByKitchen(req: Request, res: Response): Promise<void> {
    try {
      const {
        kitchen_id,
        meal_type,
        limit = 20,
        offset = 0
      } = req.query as any;

      if (!kitchen_id) {
        res.status(400).json({
          error: {
            code: 'VAL_001',
            message: 'Kitchen ID is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      // First, verify the kitchen exists
      const kitchenResult = await pool.query(
        'SELECT * FROM kitchens WHERE id = $1 AND is_active = true',
        [kitchen_id]
      );

      if (kitchenResult.rows.length === 0) {
        res.status(404).json({
          error: {
            code: 'BIZ_001',
            message: 'Kitchen not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const kitchen = kitchenResult.rows[0];

      let mealsQuery = `
        SELECT 
          m.id,
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
          m.created_by_user_id,
          m.is_public,
          m.is_approved,
          m.created_at,
          m.updated_at,
          u.name as creator_name
        FROM meals m
        LEFT JOIN users u ON m.created_by_user_id = u.id
        WHERE m.kitchen_id = $1 AND m.is_approved = true
      `;

      const queryParams: any[] = [kitchen_id];
      let paramIndex = 2;

      // Add meal type filter if provided
      if (meal_type) {
        mealsQuery += ` AND m.meal_type = $${paramIndex}`;
        queryParams.push(meal_type);
        paramIndex++;
      }

      mealsQuery += ` ORDER BY m.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);

      const mealsResult = await pool.query(mealsQuery, queryParams);

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM meals m
        WHERE m.kitchen_id = $1 AND m.is_approved = true
      `;

      const countParams: any[] = [kitchen_id];
      if (meal_type) {
        countQuery += ` AND m.meal_type = $2`;
        countParams.push(meal_type);
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      // Format meals response
      const meals = mealsResult.rows.map(row => ({
        id: row.id,
        title_en: row.title_en,
        title_ar: row.title_ar,
        description_en: row.description_en,
        description_ar: row.description_ar,
        kitchen_id: row.kitchen_id,
        meal_type: row.meal_type,
        servings: row.servings,
        prep_time_min: row.prep_time_min,
        cook_time_min: row.cook_time_min,
        nutrition_totals: row.nutrition_totals ? JSON.parse(row.nutrition_totals) : undefined,
        image_url: row.image_url,
        created_by_user_id: row.created_by_user_id,
        is_public: row.is_public,
        is_approved: row.is_approved,
        created_at: row.created_at,
        updated_at: row.updated_at,
        creator: row.creator_name ? {
          name: row.creator_name
        } : undefined
      }));

      res.json({
        kitchen: {
          id: kitchen.id,
          name_en: kitchen.name_en,
          name_ar: kitchen.name_ar,
          description_en: kitchen.description_en,
          description_ar: kitchen.description_ar,
          icon_url: kitchen.icon_url
        },
        meals,
        pagination: {
          total,
          limit: parseInt(limit.toString()),
          offset: parseInt(offset.toString()),
          hasMore: parseInt(offset.toString()) + parseInt(limit.toString()) < total
        },
        filters: {
          kitchen_id,
          meal_type
        }
      });
    } catch (error) {
      console.error('Error browsing meals by kitchen:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to browse meals by kitchen',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  // Get all available kitchens for browsing
  static async getKitchensForBrowsing(req: Request, res: Response): Promise<void> {
    try {
      const result = await pool.query(`
        SELECT 
          k.id,
          k.name_en,
          k.name_ar,
          k.description_en,
          k.description_ar,
          k.icon_url,
          COUNT(m.id) as meal_count
        FROM kitchens k
        LEFT JOIN meals m ON k.id = m.kitchen_id AND m.is_approved = true
        WHERE k.is_active = true
        GROUP BY k.id, k.name_en, k.name_ar, k.description_en, k.description_ar, k.icon_url
        HAVING COUNT(m.id) > 0
        ORDER BY k.name_en ASC
      `);

      res.json({
        kitchens: result.rows.map(row => ({
          id: row.id,
          name_en: row.name_en,
          name_ar: row.name_ar,
          description_en: row.description_en,
          description_ar: row.description_ar,
          icon_url: row.icon_url,
          meal_count: parseInt(row.meal_count)
        }))
      });
    } catch (error) {
      console.error('Error fetching kitchens for browsing:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to fetch kitchens',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  // Combined search endpoint for both ingredients and meals
  static async searchAll(req: Request, res: Response): Promise<void> {
    try {
      const {
        query,
        language = 'en',
        types = 'ingredients,meals',
        limit = 10
      } = req.query;

      if (!query || typeof query !== 'string') {
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

      const searchTypes = (types as string).split(',');
      const results: any = {};

      // Search ingredients if requested
      if (searchTypes.includes('ingredients')) {
        const ingredientsQuery = `
          SELECT 
            id,
            name_en,
            name_ar,
            category,
            'ingredient' as type
          FROM ingredients
          WHERE is_approved = true
          AND (name_en ILIKE $1 OR name_ar ILIKE $1)
          ORDER BY name_${language} ASC
          LIMIT $2
        `;

        const ingredientsResult = await pool.query(ingredientsQuery, [`%${query}%`, limit]);
        results.ingredients = ingredientsResult.rows;
      }

      // Search meals if requested
      if (searchTypes.includes('meals')) {
        const mealsQuery = `
          SELECT 
            m.id,
            m.title_en,
            m.title_ar,
            m.meal_type,
            m.image_url,
            k.name_en as kitchen_name_en,
            k.name_ar as kitchen_name_ar,
            'meal' as type
          FROM meals m
          LEFT JOIN kitchens k ON m.kitchen_id = k.id
          WHERE m.is_approved = true
          AND (m.title_en ILIKE $1 OR m.title_ar ILIKE $1 OR m.description_en ILIKE $1 OR m.description_ar ILIKE $1)
          ORDER BY m.title_${language} ASC
          LIMIT $2
        `;

        const mealsResult = await pool.query(mealsQuery, [`%${query}%`, limit]);
        results.meals = mealsResult.rows.map(row => ({
          ...row,
          kitchen: row.kitchen_name_en ? {
            name_en: row.kitchen_name_en,
            name_ar: row.kitchen_name_ar
          } : undefined
        }));
      }

      res.json({
        query,
        language,
        results
      });
    } catch (error) {
      console.error('Error in combined search:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to perform search',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
}