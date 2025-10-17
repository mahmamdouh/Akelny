import { Request, Response } from 'express';
import { pool } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { NutritionService } from '../services/nutritionService';
import { IngredientStatusService } from '../services/ingredientStatusService';

export class MealIngredientsController {
  // Get ingredients for a specific meal with nutrition and status info
  static async getMealIngredients(req: Request, res: Response): Promise<void> {
    try {
      const { mealId } = req.params;
      const { language = 'en', includeNutrition = 'true' } = req.query;

      const query = `
        SELECT 
          mi.id,
          mi.ingredient_id,
          i.name_en,
          i.name_ar,
          i.category,
          mi.quantity,
          mi.unit,
          mi.status,
          mi.calories_contribution,
          mi.nutrition_contribution,
          i.calories_per_100g,
          i.protein_per_100g,
          i.carbs_per_100g,
          i.fat_per_100g,
          i.minerals,
          i.default_unit
        FROM meal_ingredients mi
        JOIN ingredients i ON mi.ingredient_id = i.id
        WHERE mi.meal_id = $1 AND i.is_approved = true
        ORDER BY 
          CASE mi.status 
            WHEN 'mandatory' THEN 3 
            WHEN 'recommended' THEN 2 
            WHEN 'optional' THEN 1 
          END DESC,
          i.name_${language === 'ar' ? 'ar' : 'en'} ASC
      `;

      const result = await pool.query(query, [mealId]);

      if (result.rows.length === 0) {
        res.status(404).json({
          error: {
            code: 'BIZ_001',
            message: 'Meal not found or has no ingredients',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      // Format ingredients with status display info
      const ingredients = result.rows.map(row => {
        const statusInfo = IngredientStatusService.getStatusDisplayInfo(
          IngredientStatusService.validateStatus(row.status)
        );

        return {
          id: row.id,
          ingredient_id: row.ingredient_id,
          name_en: row.name_en,
          name_ar: row.name_ar,
          category: row.category,
          quantity: parseFloat(row.quantity),
          unit: row.unit,
          status: row.status,
          status_info: statusInfo,
          calories_contribution: row.calories_contribution ? parseFloat(row.calories_contribution) : null,
          nutrition_contribution: row.nutrition_contribution,
          nutrition_per_100g: includeNutrition === 'true' ? {
            calories: row.calories_per_100g ? parseFloat(row.calories_per_100g) : null,
            protein: row.protein_per_100g ? parseFloat(row.protein_per_100g) : null,
            carbs: row.carbs_per_100g ? parseFloat(row.carbs_per_100g) : null,
            fat: row.fat_per_100g ? parseFloat(row.fat_per_100g) : null,
            minerals: row.minerals
          } : undefined,
          default_unit: row.default_unit
        };
      });

      // Get meal info and calculate total nutrition if requested
      let mealNutrition = null;
      if (includeNutrition === 'true') {
        const mealQuery = await pool.query(
          'SELECT servings, nutrition_totals FROM meals WHERE id = $1',
          [mealId]
        );
        
        if (mealQuery.rows.length > 0) {
          const meal = mealQuery.rows[0];
          const servings = meal.servings || 1;
          
          // Calculate fresh nutrition data
          const ingredientContributions = result.rows.map(row => ({
            ingredient_id: row.ingredient_id,
            quantity: parseFloat(row.quantity),
            unit: row.unit,
            status: IngredientStatusService.validateStatus(row.status),
            nutrition_data: {
              calories_per_100g: row.calories_per_100g ? parseFloat(row.calories_per_100g) : 0,
              protein_per_100g: row.protein_per_100g ? parseFloat(row.protein_per_100g) : 0,
              carbs_per_100g: row.carbs_per_100g ? parseFloat(row.carbs_per_100g) : 0,
              fat_per_100g: row.fat_per_100g ? parseFloat(row.fat_per_100g) : 0,
              minerals: row.minerals || {}
            }
          }));

          const ingredientNames = Object.fromEntries(
            result.rows.map(row => [row.ingredient_id, row.name_en])
          );

          const nutritionCalculation = NutritionService.calculateMealNutrition(
            ingredientContributions,
            servings,
            ingredientNames
          );

          mealNutrition = {
            servings,
            totals: nutritionCalculation.totals,
            daily_value_percentages: NutritionService.calculateDailyValuePercentages(
              nutritionCalculation.totals,
              servings
            ),
            ingredient_contributions: nutritionCalculation.contributions
          };
        }
      }

      // Get ingredient status statistics
      const statusStats = await IngredientStatusService.getMealIngredientStats(mealId);

      res.json({
        meal_id: mealId,
        ingredients,
        nutrition: mealNutrition,
        status_statistics: statusStats,
        total_ingredients: ingredients.length
      });
    } catch (error) {
      console.error('Error fetching meal ingredients:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to fetch meal ingredients',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  // Check meal eligibility based on user's pantry
  static async checkMealEligibility(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { mealId } = req.params;

      const eligibility = await IngredientStatusService.checkMealEligibility(mealId, userId);
      const availability = await IngredientStatusService.checkIngredientAvailability(mealId, userId);

      res.json({
        meal_id: mealId,
        eligibility,
        ingredient_availability: availability,
        user_id: userId
      });
    } catch (error) {
      console.error('Error checking meal eligibility:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to check meal eligibility',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  // Get eligible meals based on user's pantry
  static async getEligibleMeals(req: AuthenticatedRequest, res: Response): Promise<void> {
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
        strictMode = 'true',
        limit = '20',
        offset = '0'
      } = req.query;

      const options = {
        mealType: mealType as string,
        kitchenIds: kitchenIds ? (kitchenIds as string).split(',') : undefined,
        strictMode: strictMode === 'true',
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };

      const results = await IngredientStatusService.getEligibleMeals(userId, options);

      res.json({
        eligible_meals: results.eligible,
        partial_matches: results.partialMatches,
        total_count: results.totalCount,
        filters: options,
        user_id: userId
      });
    } catch (error) {
      console.error('Error getting eligible meals:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to get eligible meals',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  // Calculate nutrition for custom ingredient list
  static async calculateNutrition(req: Request, res: Response): Promise<void> {
    try {
      const { ingredients, servings = 1 } = req.body;

      if (!Array.isArray(ingredients) || ingredients.length === 0) {
        res.status(400).json({
          error: {
            code: 'VAL_002',
            message: 'ingredients array is required and must not be empty',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      // Validate ingredient format
      for (const ingredient of ingredients) {
        if (!ingredient.ingredient_id || !ingredient.quantity || !ingredient.unit) {
          res.status(400).json({
            error: {
              code: 'VAL_002',
              message: 'Each ingredient must have ingredient_id, quantity, and unit',
              timestamp: new Date().toISOString(),
              requestId: req.headers['x-request-id'] || 'unknown'
            }
          });
          return;
        }
      }

      // Get ingredient nutrition data
      const ingredientIds = ingredients.map(ing => ing.ingredient_id);
      const nutritionQuery = await pool.query(`
        SELECT 
          id,
          name_en,
          calories_per_100g,
          protein_per_100g,
          carbs_per_100g,
          fat_per_100g,
          minerals
        FROM ingredients
        WHERE id = ANY($1) AND is_approved = true
      `, [ingredientIds]);

      const nutritionData = Object.fromEntries(
        nutritionQuery.rows.map(row => [row.id, row])
      );

      // Build ingredient contributions
      const ingredientContributions = ingredients.map(ingredient => {
        const nutritionInfo = nutritionData[ingredient.ingredient_id];
        if (!nutritionInfo) {
          throw new Error(`Ingredient ${ingredient.ingredient_id} not found or not approved`);
        }

        return {
          ingredient_id: ingredient.ingredient_id,
          quantity: parseFloat(ingredient.quantity),
          unit: ingredient.unit,
          status: IngredientStatusService.validateStatus(ingredient.status || 'optional'),
          nutrition_data: {
            calories_per_100g: nutritionInfo.calories_per_100g ? parseFloat(nutritionInfo.calories_per_100g) : 0,
            protein_per_100g: nutritionInfo.protein_per_100g ? parseFloat(nutritionInfo.protein_per_100g) : 0,
            carbs_per_100g: nutritionInfo.carbs_per_100g ? parseFloat(nutritionInfo.carbs_per_100g) : 0,
            fat_per_100g: nutritionInfo.fat_per_100g ? parseFloat(nutritionInfo.fat_per_100g) : 0,
            minerals: nutritionInfo.minerals || {}
          }
        };
      });

      const ingredientNames = Object.fromEntries(
        nutritionQuery.rows.map(row => [row.id, row.name_en])
      );

      const nutritionCalculation = NutritionService.calculateMealNutrition(
        ingredientContributions,
        servings,
        ingredientNames
      );

      res.json({
        servings,
        totals: nutritionCalculation.totals,
        daily_value_percentages: NutritionService.calculateDailyValuePercentages(
          nutritionCalculation.totals,
          servings
        ),
        ingredient_contributions: nutritionCalculation.contributions,
        calculation_timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error calculating nutrition:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to calculate nutrition',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  // Update ingredient status in a meal (for meal creators)
  static async updateIngredientStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { mealId, ingredientId } = req.params;
      const { status } = req.body;

      if (!status) {
        res.status(400).json({
          error: {
            code: 'VAL_001',
            message: 'status is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const validatedStatus = IngredientStatusService.validateStatus(status);

      try {
        await IngredientStatusService.updateIngredientStatus(
          mealId,
          ingredientId,
          validatedStatus,
          userId
        );

        res.json({
          message: 'Ingredient status updated successfully',
          meal_id: mealId,
          ingredient_id: ingredientId,
          new_status: validatedStatus
        });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Meal not found') {
            res.status(404).json({
              error: {
                code: 'BIZ_001',
                message: 'Meal not found',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || 'unknown'
              }
            });
            return;
          }
          if (error.message === 'Insufficient permissions') {
            res.status(403).json({
              error: {
                code: 'AUTH_003',
                message: 'You can only modify meals you created',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || 'unknown'
              }
            });
            return;
          }
          if (error.message === 'Ingredient not found in meal') {
            res.status(404).json({
              error: {
                code: 'BIZ_001',
                message: 'Ingredient not found in this meal',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || 'unknown'
              }
            });
            return;
          }
        }
        throw error;
      }
    } catch (error) {
      console.error('Error updating ingredient status:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to update ingredient status',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
}