import { Request, Response } from 'express';
import Joi from 'joi';
import { pool } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

// Local type definitions
interface UpdateUserProfileRequest {
  name?: string;
  country?: string;
  language?: 'en' | 'ar';
  primaryKitchenId?: string;
}

interface UserPreferences {
  selectedKitchens: string[];
  pantryIngredients: string[];
  favoriteRecipes: string[];
}

// Validation schemas
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  country: Joi.string().length(2).uppercase().optional(),
  language: Joi.string().valid('en', 'ar').optional(),
  primaryKitchenId: Joi.string().uuid().optional(),
});

const updateKitchenPreferencesSchema = Joi.object({
  selectedKitchens: Joi.array().items(Joi.string().uuid()).required(),
});

const updatePantrySchema = Joi.object({
  pantryIngredients: Joi.array().items(Joi.string().uuid()).required(),
});

export class UsersController {
  /**
   * Get current user profile with preferences
   */
  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
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

      // Get user profile
      const userQuery = `
        SELECT u.id, u.name, u.email, u.country, u.primary_kitchen_id, u.language, 
               u.created_at, u.updated_at,
               k.name_en as primary_kitchen_name_en, k.name_ar as primary_kitchen_name_ar
        FROM users u
        LEFT JOIN kitchens k ON u.primary_kitchen_id = k.id
        WHERE u.id = $1
      `;
      const userResult = await pool.query(userQuery, [userId]);

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: {
            code: 'BIZ_001',
            message: 'User not found',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const user = userResult.rows[0];

      // Get user's selected kitchens
      const kitchensQuery = `
        SELECT k.id, k.name_en, k.name_ar, k.description_en, k.description_ar
        FROM user_kitchen_preferences ukp
        JOIN kitchens k ON ukp.kitchen_id = k.id
        WHERE ukp.user_id = $1
      `;
      const kitchensResult = await pool.query(kitchensQuery, [userId]);

      // Get user's pantry ingredients
      const pantryQuery = `
        SELECT i.id, i.name_en, i.name_ar, i.category
        FROM user_pantry up
        JOIN ingredients i ON up.ingredient_id = i.id
        WHERE up.user_id = $1
      `;
      const pantryResult = await pool.query(pantryQuery, [userId]);

      // Get user's favorite recipes
      const favoritesQuery = `
        SELECT m.id, m.title_en, m.title_ar, m.description_en, m.description_ar,
               k.name_en as kitchen_name_en, k.name_ar as kitchen_name_ar
        FROM user_favorites uf
        JOIN meals m ON uf.meal_id = m.id
        LEFT JOIN kitchens k ON m.kitchen_id = k.id
        WHERE uf.user_id = $1
      `;
      const favoritesResult = await pool.query(favoritesQuery, [userId]);

      const preferences: UserPreferences = {
        selectedKitchens: kitchensResult.rows,
        pantryIngredients: pantryResult.rows,
        favoriteRecipes: favoritesResult.rows,
      };

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            country: user.country,
            primaryKitchenId: user.primary_kitchen_id,
            primaryKitchen: {
              id: user.primary_kitchen_id,
              nameEn: user.primary_kitchen_name_en,
              nameAr: user.primary_kitchen_name_ar,
            },
            language: user.language,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
          },
          preferences,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
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

  /**
   * Update user profile
   */
  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
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

      // Validate request body
      const { error, value } = updateProfileSchema.validate(req.body);
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

      const updateData: UpdateUserProfileRequest = value;

      // If country is being updated, update primary kitchen automatically
      if (updateData.country) {
        const primaryKitchenId = await UsersController.getPrimaryKitchenByCountry(updateData.country);
        updateData.primaryKitchenId = primaryKitchenId;
      }

      // Build dynamic update query
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (updateData.name) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(updateData.name);
      }

      if (updateData.country) {
        updateFields.push(`country = $${paramIndex++}`);
        updateValues.push(updateData.country);
      }

      if (updateData.language) {
        updateFields.push(`language = $${paramIndex++}`);
        updateValues.push(updateData.language);
      }

      if (updateData.primaryKitchenId) {
        updateFields.push(`primary_kitchen_id = $${paramIndex++}`);
        updateValues.push(updateData.primaryKitchenId);
      }

      if (updateFields.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'No valid fields to update',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Add updated_at field
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(userId);

      const updateQuery = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, name, email, country, primary_kitchen_id, language, created_at, updated_at
      `;

      const result = await pool.query(updateQuery, updateValues);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: {
            code: 'BIZ_001',
            message: 'User not found',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const updatedUser = result.rows[0];

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            country: updatedUser.country,
            primaryKitchenId: updatedUser.primary_kitchen_id,
            language: updatedUser.language,
            createdAt: updatedUser.created_at,
            updatedAt: updatedUser.updated_at,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Update profile error:', error);

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
   * Update user's kitchen preferences
   */
  static async updateKitchenPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
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

      // Validate request body
      const { error, value } = updateKitchenPreferencesSchema.validate(req.body);
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

      const { selectedKitchens } = value;

      // Start transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Delete existing preferences
        await client.query('DELETE FROM user_kitchen_preferences WHERE user_id = $1', [userId]);

        // Insert new preferences
        if (selectedKitchens.length > 0) {
          const insertValues = selectedKitchens.map((kitchenId: string, index: number) => 
            `($1, $${index + 2})`
          ).join(', ');

          const insertQuery = `
            INSERT INTO user_kitchen_preferences (user_id, kitchen_id)
            VALUES ${insertValues}
          `;

          await client.query(insertQuery, [userId, ...selectedKitchens]);
        }

        await client.query('COMMIT');

        res.status(200).json({
          success: true,
          data: {
            message: 'Kitchen preferences updated successfully',
            selectedKitchens,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (transactionError) {
        await client.query('ROLLBACK');
        throw transactionError;
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Update kitchen preferences error:', error);

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
   * Update user's pantry ingredients
   */
  static async updatePantry(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
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

      // Validate request body
      const { error, value } = updatePantrySchema.validate(req.body);
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

      const { pantryIngredients } = value;

      // Start transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Delete existing pantry items
        await client.query('DELETE FROM user_pantry WHERE user_id = $1', [userId]);

        // Insert new pantry items
        if (pantryIngredients.length > 0) {
          const insertValues = pantryIngredients.map((ingredientId: string, index: number) => 
            `($1, $${index + 2})`
          ).join(', ');

          const insertQuery = `
            INSERT INTO user_pantry (user_id, ingredient_id)
            VALUES ${insertValues}
          `;

          await client.query(insertQuery, [userId, ...pantryIngredients]);
        }

        await client.query('COMMIT');

        res.status(200).json({
          success: true,
          data: {
            message: 'Pantry updated successfully',
            pantryIngredients,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (transactionError) {
        await client.query('ROLLBACK');
        throw transactionError;
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Update pantry error:', error);

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
   * Get available kitchens
   */
  static async getAvailableKitchens(req: Request, res: Response): Promise<void> {
    try {
      const kitchensQuery = `
        SELECT id, name_en, name_ar, description_en, description_ar, icon_url
        FROM kitchens
        WHERE is_active = true
        ORDER BY name_en
      `;

      const result = await pool.query(kitchensQuery);

      res.status(200).json({
        success: true,
        data: {
          kitchens: result.rows,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Get kitchens error:', error);

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
   * Get primary kitchen based on country (helper method)
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