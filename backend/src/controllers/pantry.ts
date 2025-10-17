import { Request, Response } from 'express';
import { pool } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

export class PantryController {
  // Get user's pantry with ingredient details
  static async getUserPantry(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { language = 'en' } = req.query;

      const result = await pool.query(`
        SELECT 
          i.id,
          i.name_en,
          i.name_ar,
          i.category,
          i.default_unit,
          i.calories_per_100g,
          i.protein_per_100g,
          i.carbs_per_100g,
          i.fat_per_100g,
          i.minerals,
          up.added_at
        FROM user_pantry up
        JOIN ingredients i ON up.ingredient_id = i.id
        WHERE up.user_id = $1 AND i.is_approved = true
        ORDER BY i.name_${language === 'ar' ? 'ar' : 'en'} ASC
      `, [userId]);

      res.json({
        pantry: result.rows,
        count: result.rows.length,
        userId
      });
    } catch (error) {
      console.error('Error fetching user pantry:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to fetch pantry',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  // Add ingredient to user's pantry
  static async addToPantry(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { ingredientId } = req.body;

      if (!ingredientId) {
        res.status(400).json({
          error: {
            code: 'VAL_001',
            message: 'ingredientId is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      // Check if ingredient exists and is approved
      const ingredientCheck = await pool.query(`
        SELECT id FROM ingredients WHERE id = $1 AND is_approved = true
      `, [ingredientId]);

      if (ingredientCheck.rows.length === 0) {
        res.status(404).json({
          error: {
            code: 'BIZ_001',
            message: 'Ingredient not found or not approved',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      // Check if already in pantry
      const existingEntry = await pool.query(`
        SELECT ingredient_id FROM user_pantry WHERE user_id = $1 AND ingredient_id = $2
      `, [userId, ingredientId]);

      if (existingEntry.rows.length > 0) {
        res.status(409).json({
          error: {
            code: 'BIZ_002',
            message: 'Ingredient already in pantry',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      // Add to pantry
      await pool.query(`
        INSERT INTO user_pantry (user_id, ingredient_id)
        VALUES ($1, $2)
      `, [userId, ingredientId]);

      // Get the added ingredient details
      const addedIngredient = await pool.query(`
        SELECT 
          i.id,
          i.name_en,
          i.name_ar,
          i.category,
          i.default_unit,
          up.added_at
        FROM user_pantry up
        JOIN ingredients i ON up.ingredient_id = i.id
        WHERE up.user_id = $1 AND up.ingredient_id = $2
      `, [userId, ingredientId]);

      res.status(201).json({
        message: 'Ingredient added to pantry successfully',
        ingredient: addedIngredient.rows[0]
      });
    } catch (error) {
      console.error('Error adding to pantry:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to add ingredient to pantry',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  // Remove ingredient from user's pantry
  static async removeFromPantry(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { ingredientId } = req.params;

      if (!ingredientId) {
        res.status(400).json({
          error: {
            code: 'VAL_001',
            message: 'ingredientId is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      // Check if ingredient is in pantry
      const existingEntry = await pool.query(`
        SELECT ingredient_id FROM user_pantry WHERE user_id = $1 AND ingredient_id = $2
      `, [userId, ingredientId]);

      if (existingEntry.rows.length === 0) {
        res.status(404).json({
          error: {
            code: 'BIZ_001',
            message: 'Ingredient not found in pantry',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      // Remove from pantry
      await pool.query(`
        DELETE FROM user_pantry WHERE user_id = $1 AND ingredient_id = $2
      `, [userId, ingredientId]);

      res.json({
        message: 'Ingredient removed from pantry successfully',
        ingredientId
      });
    } catch (error) {
      console.error('Error removing from pantry:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to remove ingredient from pantry',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  // Update entire pantry (bulk operation)
  static async updatePantry(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { ingredientIds } = req.body;

      if (!Array.isArray(ingredientIds)) {
        res.status(400).json({
          error: {
            code: 'VAL_002',
            message: 'ingredientIds must be an array',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        // Clear existing pantry
        await client.query('DELETE FROM user_pantry WHERE user_id = $1', [userId]);

        // Add new ingredients if any provided
        if (ingredientIds.length > 0) {
          // Validate all ingredients exist and are approved
          const ingredientCheck = await client.query(`
            SELECT id FROM ingredients 
            WHERE id = ANY($1) AND is_approved = true
          `, [ingredientIds]);

          if (ingredientCheck.rows.length !== ingredientIds.length) {
            await client.query('ROLLBACK');
            res.status(400).json({
              error: {
                code: 'VAL_003',
                message: 'One or more ingredients are invalid or not approved',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || 'unknown'
              }
            });
            return;
          }

          // Insert new pantry items
          const insertValues = ingredientIds.map((id: string) => `('${userId}', '${id}')`).join(',');
          await client.query(`
            INSERT INTO user_pantry (user_id, ingredient_id)
            VALUES ${insertValues}
          `);
        }

        await client.query('COMMIT');

        // Get updated pantry
        const updatedPantry = await client.query(`
          SELECT 
            i.id,
            i.name_en,
            i.name_ar,
            i.category,
            i.default_unit,
            up.added_at
          FROM user_pantry up
          JOIN ingredients i ON up.ingredient_id = i.id
          WHERE up.user_id = $1 AND i.is_approved = true
          ORDER BY i.name_en ASC
        `, [userId]);

        res.json({
          message: 'Pantry updated successfully',
          pantry: updatedPantry.rows,
          count: updatedPantry.rows.length
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error updating pantry:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to update pantry',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  // Get pantry statistics
  static async getPantryStats(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const result = await pool.query(`
        SELECT 
          i.category,
          COUNT(*) as count
        FROM user_pantry up
        JOIN ingredients i ON up.ingredient_id = i.id
        WHERE up.user_id = $1 AND i.is_approved = true
        GROUP BY i.category
        ORDER BY count DESC
      `, [userId]);

      const totalCount = await pool.query(`
        SELECT COUNT(*) as total
        FROM user_pantry up
        JOIN ingredients i ON up.ingredient_id = i.id
        WHERE up.user_id = $1 AND i.is_approved = true
      `, [userId]);

      res.json({
        totalIngredients: parseInt(totalCount.rows[0].total),
        categoryCounts: result.rows,
        userId
      });
    } catch (error) {
      console.error('Error fetching pantry stats:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to fetch pantry statistics',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
}