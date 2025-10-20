import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { pool } from '../config/database';
// Temporary inline types to fix Docker build
interface Meal {
  id: string;
  title_en: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  kitchen_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  servings: number;
  prep_time_min?: number;
  cook_time_min?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  image_url?: string;
  nutrition_totals?: any;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

interface CreateMealRequest {
  title_en: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  kitchen_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  servings: number;
  prep_time_min?: number;
  cook_time_min?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: any[];
  instructions_en: string[];
  instructions_ar?: string[];
}

interface UpdateMealRequest {
  title_en?: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  kitchen_id?: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner';
  servings?: number;
  prep_time_min?: number;
  cook_time_min?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  ingredients?: any[];
  instructions_en?: string[];
  instructions_ar?: string[];
}

interface MealFilters {
  kitchen_id?: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner';
  difficulty?: 'easy' | 'medium' | 'hard';
  max_prep_time?: number;
  max_cook_time?: number;
  search?: string;
}

interface MealListResponse {
  meals: Meal[];
  total: number;
  page: number;
  limit: number;
}

interface MealIngredient {
  id: string;
  meal_id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  status: 'mandatory' | 'recommended' | 'optional';
  nutrition_contribution?: any;
}
import { NutritionService } from '../services/nutritionService';

export class MealsController {
  // Create a new meal
  static async createMeal(req: AuthenticatedRequest, res: Response): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const mealData: CreateMealRequest = req.body;
      
      // Validate required fields
      if (!mealData.title_en || !mealData.kitchen_id || !mealData.meal_type) {
        res.status(400).json({ error: 'Missing required fields: title_en, kitchen_id, meal_type' });
        return;
      }

      if (!mealData.ingredients || mealData.ingredients.length === 0) {
        res.status(400).json({ error: 'At least one ingredient is required' });
        return;
      }

      // Calculate nutrition totals
      const nutritionTotals = await NutritionService.calculateSimpleMealNutrition(mealData.ingredients);

      // Insert meal
      const mealResult = await client.query(`
        INSERT INTO meals (
          title_en, title_ar, description_en, description_ar, kitchen_id, 
          meal_type, servings, prep_time_min, cook_time_min, steps_en, steps_ar,
          nutrition_totals, image_url, created_by_user_id, is_public, is_approved
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `, [
        mealData.title_en,
        mealData.title_ar || null,
        mealData.description_en || null,
        mealData.description_ar || null,
        mealData.kitchen_id,
        mealData.meal_type,
        mealData.servings || 1,
        mealData.prep_time_min || null,
        mealData.cook_time_min || null,
        mealData.steps_en ? JSON.stringify(mealData.steps_en) : null,
        mealData.steps_ar ? JSON.stringify(mealData.steps_ar) : null,
        JSON.stringify(nutritionTotals),
        mealData.image_url || null,
        userId,
        mealData.is_public || false,
        false // User-created meals need approval
      ]);

      const meal = mealResult.rows[0];

      // Insert meal ingredients with nutrition calculations
      for (const ingredientData of mealData.ingredients) {
        const nutritionContribution = await NutritionService.calculateIngredientNutrition(
          ingredientData.ingredient_id,
          ingredientData.quantity,
          ingredientData.unit
        );

        await client.query(`
          INSERT INTO meal_ingredients (
            meal_id, ingredient_id, quantity, unit, status, 
            calories_contribution, nutrition_contribution
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          meal.id,
          ingredientData.ingredient_id,
          ingredientData.quantity,
          ingredientData.unit,
          ingredientData.status,
          nutritionContribution.calories,
          JSON.stringify(nutritionContribution)
        ]);
      }

      await client.query('COMMIT');

      // Fetch the complete meal with relationships
      const completeMeal = await MealsController.getMealById(meal.id);
      
      res.status(201).json(completeMeal);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating meal:', error);
      res.status(500).json({ error: 'Failed to create meal' });
    } finally {
      client.release();
    }
  }

  // Get meal by ID with all relationships
  static async getMeal(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const meal = await MealsController.getMealById(id);
      
      if (!meal) {
        res.status(404).json({ error: 'Meal not found' });
        return;
      }

      res.json(meal);
    } catch (error) {
      console.error('Error fetching meal:', error);
      res.status(500).json({ error: 'Failed to fetch meal' });
    }
  }

  // Get meals with filtering and pagination
  static async getMeals(req: Request, res: Response): Promise<void> {
    try {
      const filters: MealFilters = {
        kitchen_ids: req.query.kitchen_ids ? (req.query.kitchen_ids as string).split(',') : undefined,
        meal_type: req.query.meal_type as 'breakfast' | 'lunch' | 'dinner' | undefined,
        is_public: req.query.is_public ? req.query.is_public === 'true' : undefined,
        created_by_user_id: req.query.created_by_user_id as string | undefined,
        search: req.query.search as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const result = await MealsController.getMealsWithFilters(filters);
      res.json(result);
    } catch (error) {
      console.error('Error fetching meals:', error);
      res.status(500).json({ error: 'Failed to fetch meals' });
    }
  }

  // Update meal
  static async updateMeal(req: AuthenticatedRequest, res: Response): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { id } = req.params;
      const userId = req.user?.id;
      const updateData: UpdateMealRequest = req.body;

      // Check if meal exists and user has permission
      const existingMeal = await client.query(
        'SELECT * FROM meals WHERE id = $1',
        [id]
      );

      if (existingMeal.rows.length === 0) {
        res.status(404).json({ error: 'Meal not found' });
        return;
      }

      const meal = existingMeal.rows[0];
      if (meal.created_by_user_id !== userId) {
        res.status(403).json({ error: 'Not authorized to update this meal' });
        return;
      }

      // Build update query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCount = 1;

      if (updateData.title_en !== undefined) {
        updateFields.push(`title_en = $${paramCount++}`);
        updateValues.push(updateData.title_en);
      }
      if (updateData.title_ar !== undefined) {
        updateFields.push(`title_ar = $${paramCount++}`);
        updateValues.push(updateData.title_ar);
      }
      if (updateData.description_en !== undefined) {
        updateFields.push(`description_en = $${paramCount++}`);
        updateValues.push(updateData.description_en);
      }
      if (updateData.description_ar !== undefined) {
        updateFields.push(`description_ar = $${paramCount++}`);
        updateValues.push(updateData.description_ar);
      }
      if (updateData.kitchen_id !== undefined) {
        updateFields.push(`kitchen_id = $${paramCount++}`);
        updateValues.push(updateData.kitchen_id);
      }
      if (updateData.meal_type !== undefined) {
        updateFields.push(`meal_type = $${paramCount++}`);
        updateValues.push(updateData.meal_type);
      }
      if (updateData.servings !== undefined) {
        updateFields.push(`servings = $${paramCount++}`);
        updateValues.push(updateData.servings);
      }
      if (updateData.prep_time_min !== undefined) {
        updateFields.push(`prep_time_min = $${paramCount++}`);
        updateValues.push(updateData.prep_time_min);
      }
      if (updateData.cook_time_min !== undefined) {
        updateFields.push(`cook_time_min = $${paramCount++}`);
        updateValues.push(updateData.cook_time_min);
      }
      if (updateData.steps_en !== undefined) {
        updateFields.push(`steps_en = $${paramCount++}`);
        updateValues.push(updateData.steps_en ? JSON.stringify(updateData.steps_en) : null);
      }
      if (updateData.steps_ar !== undefined) {
        updateFields.push(`steps_ar = $${paramCount++}`);
        updateValues.push(updateData.steps_ar ? JSON.stringify(updateData.steps_ar) : null);
      }
      if (updateData.image_url !== undefined) {
        updateFields.push(`image_url = $${paramCount++}`);
        updateValues.push(updateData.image_url);
      }
      if (updateData.is_public !== undefined) {
        updateFields.push(`is_public = $${paramCount++}`);
        updateValues.push(updateData.is_public);
      }

      // Always update the updated_at timestamp
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      // Update ingredients if provided
      if (updateData.ingredients) {
        // Delete existing ingredients
        await client.query('DELETE FROM meal_ingredients WHERE meal_id = $1', [id]);

        // Insert new ingredients
        for (const ingredientData of updateData.ingredients) {
          const nutritionContribution = await NutritionService.calculateIngredientNutrition(
            ingredientData.ingredient_id,
            ingredientData.quantity,
            ingredientData.unit
          );

          await client.query(`
            INSERT INTO meal_ingredients (
              meal_id, ingredient_id, quantity, unit, status, 
              calories_contribution, nutrition_contribution
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            id,
            ingredientData.ingredient_id,
            ingredientData.quantity,
            ingredientData.unit,
            ingredientData.status,
            nutritionContribution.calories,
            JSON.stringify(nutritionContribution)
          ]);
        }

        // Recalculate nutrition totals
        const nutritionTotals = await NutritionService.calculateSimpleMealNutrition(updateData.ingredients);
        updateFields.push(`nutrition_totals = $${paramCount++}`);
        updateValues.push(JSON.stringify(nutritionTotals));
      }

      if (updateFields.length > 1) { // More than just updated_at
        updateValues.push(id);
        const updateQuery = `
          UPDATE meals 
          SET ${updateFields.join(', ')} 
          WHERE id = $${paramCount}
          RETURNING *
        `;

        await client.query(updateQuery, updateValues);
      }

      await client.query('COMMIT');

      // Fetch updated meal
      const updatedMeal = await MealsController.getMealById(id);
      res.json(updatedMeal);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating meal:', error);
      res.status(500).json({ error: 'Failed to update meal' });
    } finally {
      client.release();
    }
  }

  // Delete meal
  static async deleteMeal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Check if meal exists and user has permission
      const existingMeal = await pool.query(
        'SELECT * FROM meals WHERE id = $1',
        [id]
      );

      if (existingMeal.rows.length === 0) {
        res.status(404).json({ error: 'Meal not found' });
        return;
      }

      const meal = existingMeal.rows[0];
      if (meal.created_by_user_id !== userId) {
        res.status(403).json({ error: 'Not authorized to delete this meal' });
        return;
      }

      // Delete meal (ingredients will be deleted by CASCADE)
      await pool.query('DELETE FROM meals WHERE id = $1', [id]);

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting meal:', error);
      res.status(500).json({ error: 'Failed to delete meal' });
    }
  }

  // Helper method to get meal by ID with all relationships
  private static async getMealById(id: string): Promise<Meal | null> {
    try {
      const mealResult = await pool.query(`
        SELECT 
          m.*,
          k.name_en as kitchen_name_en,
          k.name_ar as kitchen_name_ar,
          k.description_en as kitchen_description_en,
          k.description_ar as kitchen_description_ar,
          k.icon_url as kitchen_icon_url,
          k.is_active as kitchen_is_active,
          k.created_at as kitchen_created_at,
          u.name as creator_name,
          u.email as creator_email
        FROM meals m
        LEFT JOIN kitchens k ON m.kitchen_id = k.id
        LEFT JOIN users u ON m.created_by_user_id = u.id
        WHERE m.id = $1
      `, [id]);

      if (mealResult.rows.length === 0) {
        return null;
      }

      const row = mealResult.rows[0];

      // Get meal ingredients
      const ingredientsResult = await pool.query(`
        SELECT 
          mi.*,
          i.name_en as ingredient_name_en,
          i.name_ar as ingredient_name_ar,
          i.category as ingredient_category,
          i.default_unit as ingredient_default_unit,
          i.calories_per_100g as ingredient_calories_per_100g,
          i.protein_per_100g as ingredient_protein_per_100g,
          i.carbs_per_100g as ingredient_carbs_per_100g,
          i.fat_per_100g as ingredient_fat_per_100g,
          i.minerals as ingredient_minerals,
          i.is_approved as ingredient_is_approved,
          i.created_at as ingredient_created_at
        FROM meal_ingredients mi
        LEFT JOIN ingredients i ON mi.ingredient_id = i.id
        WHERE mi.meal_id = $1
        ORDER BY mi.created_at
      `, [id]);

      const meal: Meal = {
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
        steps_en: row.steps_en ? JSON.parse(row.steps_en) : undefined,
        steps_ar: row.steps_ar ? JSON.parse(row.steps_ar) : undefined,
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
          description_en: row.kitchen_description_en,
          description_ar: row.kitchen_description_ar,
          icon_url: row.kitchen_icon_url,
          is_active: row.kitchen_is_active,
          created_at: row.kitchen_created_at
        } : undefined,
        creator: row.creator_name ? {
          id: row.created_by_user_id,
          name: row.creator_name,
          email: row.creator_email,
          country: '', // Not fetched in this query
          language: 'en', // Not fetched in this query
          created_at: '', // Not fetched in this query
          updated_at: '' // Not fetched in this query
        } : undefined,
        ingredients: ingredientsResult.rows.map(ingredientRow => ({
          id: ingredientRow.id,
          meal_id: ingredientRow.meal_id,
          ingredient_id: ingredientRow.ingredient_id,
          quantity: parseFloat(ingredientRow.quantity),
          unit: ingredientRow.unit,
          status: ingredientRow.status,
          calories_contribution: ingredientRow.calories_contribution ? parseFloat(ingredientRow.calories_contribution) : undefined,
          nutrition_contribution: ingredientRow.nutrition_contribution ? JSON.parse(ingredientRow.nutrition_contribution) : undefined,
          created_at: ingredientRow.created_at,
          ingredient: ingredientRow.ingredient_name_en ? {
            id: ingredientRow.ingredient_id,
            name_en: ingredientRow.ingredient_name_en,
            name_ar: ingredientRow.ingredient_name_ar,
            category: ingredientRow.ingredient_category,
            default_unit: ingredientRow.ingredient_default_unit,
            calories_per_100g: ingredientRow.ingredient_calories_per_100g ? parseFloat(ingredientRow.ingredient_calories_per_100g) : undefined,
            protein_per_100g: ingredientRow.ingredient_protein_per_100g ? parseFloat(ingredientRow.ingredient_protein_per_100g) : undefined,
            carbs_per_100g: ingredientRow.ingredient_carbs_per_100g ? parseFloat(ingredientRow.ingredient_carbs_per_100g) : undefined,
            fat_per_100g: ingredientRow.ingredient_fat_per_100g ? parseFloat(ingredientRow.ingredient_fat_per_100g) : undefined,
            minerals: ingredientRow.ingredient_minerals ? JSON.parse(ingredientRow.ingredient_minerals) : undefined,
            is_approved: ingredientRow.ingredient_is_approved,
            created_at: ingredientRow.ingredient_created_at
          } : undefined
        }))
      };

      return meal;
    } catch (error) {
      console.error('Error fetching meal by ID:', error);
      return null;
    }
  }

  // Helper method to get meals with filters
  private static async getMealsWithFilters(filters: MealFilters): Promise<MealListResponse> {
    try {
      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramCount = 1;

      // Build WHERE conditions
      if (filters.kitchen_ids && filters.kitchen_ids.length > 0) {
        whereConditions.push(`m.kitchen_id = ANY($${paramCount++})`);
        queryParams.push(filters.kitchen_ids);
      }

      if (filters.meal_type) {
        whereConditions.push(`m.meal_type = $${paramCount++}`);
        queryParams.push(filters.meal_type);
      }

      if (filters.is_public !== undefined) {
        whereConditions.push(`m.is_public = $${paramCount++}`);
        queryParams.push(filters.is_public);
      }

      if (filters.created_by_user_id) {
        whereConditions.push(`m.created_by_user_id = $${paramCount++}`);
        queryParams.push(filters.created_by_user_id);
      }

      if (filters.search) {
        whereConditions.push(`(
          m.title_en ILIKE $${paramCount} OR 
          m.title_ar ILIKE $${paramCount} OR 
          m.description_en ILIKE $${paramCount} OR 
          m.description_ar ILIKE $${paramCount}
        )`);
        queryParams.push(`%${filters.search}%`);
        paramCount++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM meals m
        ${whereClause}
      `;
      const countResult = await pool.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Get meals with pagination
      const mealsQuery = `
        SELECT 
          m.*,
          k.name_en as kitchen_name_en,
          k.name_ar as kitchen_name_ar,
          k.icon_url as kitchen_icon_url
        FROM meals m
        LEFT JOIN kitchens k ON m.kitchen_id = k.id
        ${whereClause}
        ORDER BY m.created_at DESC
        LIMIT $${paramCount++} OFFSET $${paramCount++}
      `;
      
      queryParams.push(filters.limit || 20);
      queryParams.push(filters.offset || 0);

      const mealsResult = await pool.query(mealsQuery, queryParams);

      const meals: Meal[] = mealsResult.rows.map(row => ({
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
        steps_en: row.steps_en ? JSON.parse(row.steps_en) : undefined,
        steps_ar: row.steps_ar ? JSON.parse(row.steps_ar) : undefined,
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
          icon_url: row.kitchen_icon_url,
          is_active: true,
          created_at: ''
        } : undefined
      }));

      return {
        meals,
        total,
        limit: filters.limit || 20,
        offset: filters.offset || 0
      };
    } catch (error) {
      console.error('Error fetching meals with filters:', error);
      throw error;
    }
  }
}