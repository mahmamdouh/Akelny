import { pool } from '../config/database';

export type IngredientStatus = 'mandatory' | 'recommended' | 'optional';

interface MealIngredient {
  ingredient_id: string;
  name_en: string;
  name_ar?: string;
  quantity: number;
  unit: string;
  status: IngredientStatus;
  calories_contribution?: number;
  nutrition_contribution?: Record<string, any>;
}

interface IngredientAvailability {
  ingredient_id: string;
  name_en: string;
  name_ar?: string;
  status: IngredientStatus;
  available_in_pantry: boolean;
  is_mandatory: boolean;
}

interface MealEligibility {
  meal_id: string;
  title_en: string;
  title_ar?: string;
  is_eligible: boolean;
  missing_mandatory_count: number;
  missing_recommended_count: number;
  total_ingredients: number;
  availability_score: number; // 0-100
  missing_mandatory_ingredients: string[];
  missing_recommended_ingredients: string[];
}

export class IngredientStatusService {
  /**
   * Validate and normalize ingredient status
   */
  static validateStatus(status: string): IngredientStatus {
    const normalizedStatus = status.toLowerCase().trim();
    const validStatuses: IngredientStatus[] = ['mandatory', 'recommended', 'optional'];
    
    if (validStatuses.includes(normalizedStatus as IngredientStatus)) {
      return normalizedStatus as IngredientStatus;
    }
    
    return 'optional'; // default fallback
  }

  /**
   * Get status priority for sorting (mandatory > recommended > optional)
   */
  static getStatusPriority(status: IngredientStatus): number {
    switch (status) {
      case 'mandatory': return 3;
      case 'recommended': return 2;
      case 'optional': return 1;
      default: return 0;
    }
  }

  /**
   * Get status display information
   */
  static getStatusDisplayInfo(status: IngredientStatus): {
    label_en: string;
    label_ar: string;
    color: string;
    backgroundColor: string;
    icon: string;
    description_en: string;
    description_ar: string;
  } {
    switch (status) {
      case 'mandatory':
        return {
          label_en: 'Required',
          label_ar: 'مطلوب',
          color: '#ffffff',
          backgroundColor: '#22c55e',
          icon: '●',
          description_en: 'This ingredient is essential for the recipe',
          description_ar: 'هذا المكون ضروري للوصفة'
        };
      case 'recommended':
        return {
          label_en: 'Recommended',
          label_ar: 'مُوصى به',
          color: '#ffffff',
          backgroundColor: '#f97316',
          icon: '●',
          description_en: 'This ingredient significantly enhances the dish',
          description_ar: 'هذا المكون يحسن الطبق بشكل كبير'
        };
      case 'optional':
        return {
          label_en: 'Optional',
          label_ar: 'اختياري',
          color: '#ffffff',
          backgroundColor: '#6b7280',
          icon: '●',
          description_en: 'This ingredient can be omitted or substituted',
          description_ar: 'يمكن حذف هذا المكون أو استبداله'
        };
      default:
        return {
          label_en: 'Optional',
          label_ar: 'اختياري',
          color: '#ffffff',
          backgroundColor: '#6b7280',
          icon: '●',
          description_en: 'Optional ingredient',
          description_ar: 'مكون اختياري'
        };
    }
  }

  /**
   * Check ingredient availability for a user's pantry
   */
  static async checkIngredientAvailability(
    mealId: string,
    userId: string
  ): Promise<IngredientAvailability[]> {
    const query = `
      SELECT 
        mi.ingredient_id,
        i.name_en,
        i.name_ar,
        mi.status,
        CASE WHEN up.ingredient_id IS NOT NULL THEN true ELSE false END as available_in_pantry,
        CASE WHEN mi.status = 'mandatory' THEN true ELSE false END as is_mandatory
      FROM meal_ingredients mi
      JOIN ingredients i ON mi.ingredient_id = i.id
      LEFT JOIN user_pantry up ON mi.ingredient_id = up.ingredient_id AND up.user_id = $2
      WHERE mi.meal_id = $1 AND i.is_approved = true
      ORDER BY 
        CASE mi.status 
          WHEN 'mandatory' THEN 3 
          WHEN 'recommended' THEN 2 
          WHEN 'optional' THEN 1 
        END DESC,
        i.name_en ASC
    `;

    const result = await pool.query(query, [mealId, userId]);
    return result.rows.map(row => ({
      ingredient_id: row.ingredient_id,
      name_en: row.name_en,
      name_ar: row.name_ar,
      status: this.validateStatus(row.status),
      available_in_pantry: row.available_in_pantry,
      is_mandatory: row.is_mandatory
    }));
  }

  /**
   * Check if a meal is eligible based on user's pantry
   */
  static async checkMealEligibility(
    mealId: string,
    userId: string
  ): Promise<MealEligibility> {
    const availability = await this.checkIngredientAvailability(mealId, userId);
    
    const mandatoryIngredients = availability.filter(ing => ing.status === 'mandatory');
    const recommendedIngredients = availability.filter(ing => ing.status === 'recommended');
    const totalIngredients = availability.length;
    
    const missingMandatory = mandatoryIngredients.filter(ing => !ing.available_in_pantry);
    const missingRecommended = recommendedIngredients.filter(ing => !ing.available_in_pantry);
    const availableIngredients = availability.filter(ing => ing.available_in_pantry);
    
    const isEligible = missingMandatory.length === 0;
    
    // Calculate availability score (0-100)
    // Mandatory ingredients are weighted more heavily
    const mandatoryWeight = 0.7;
    const recommendedWeight = 0.2;
    const optionalWeight = 0.1;
    
    const mandatoryScore = mandatoryIngredients.length > 0 
      ? (mandatoryIngredients.length - missingMandatory.length) / mandatoryIngredients.length * 100
      : 100;
    
    const recommendedScore = recommendedIngredients.length > 0
      ? (recommendedIngredients.length - missingRecommended.length) / recommendedIngredients.length * 100
      : 100;
    
    const optionalIngredients = availability.filter(ing => ing.status === 'optional');
    const missingOptional = optionalIngredients.filter(ing => !ing.available_in_pantry);
    const optionalScore = optionalIngredients.length > 0
      ? (optionalIngredients.length - missingOptional.length) / optionalIngredients.length * 100
      : 100;
    
    const availabilityScore = Math.round(
      (mandatoryScore * mandatoryWeight) + 
      (recommendedScore * recommendedWeight) + 
      (optionalScore * optionalWeight)
    );

    // Get meal title
    const mealQuery = await pool.query(
      'SELECT title_en, title_ar FROM meals WHERE id = $1',
      [mealId]
    );
    const meal = mealQuery.rows[0];

    return {
      meal_id: mealId,
      title_en: meal?.title_en || '',
      title_ar: meal?.title_ar,
      is_eligible: isEligible,
      missing_mandatory_count: missingMandatory.length,
      missing_recommended_count: missingRecommended.length,
      total_ingredients: totalIngredients,
      availability_score: availabilityScore,
      missing_mandatory_ingredients: missingMandatory.map(ing => ing.name_en),
      missing_recommended_ingredients: missingRecommended.map(ing => ing.name_en)
    };
  }

  /**
   * Get eligible meals for a user based on their pantry
   */
  static async getEligibleMeals(
    userId: string,
    options: {
      mealType?: string;
      kitchenIds?: string[];
      strictMode?: boolean; // if true, only return meals with all mandatory ingredients
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    eligible: MealEligibility[];
    partialMatches: MealEligibility[];
    totalCount: number;
  }> {
    const { mealType, kitchenIds, strictMode = true, limit = 20, offset = 0 } = options;

    // Build base query for meals
    let mealQuery = `
      SELECT DISTINCT m.id, m.title_en, m.title_ar
      FROM meals m
      WHERE m.is_approved = true AND m.is_public = true
    `;
    
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (mealType) {
      mealQuery += ` AND m.meal_type = $${paramIndex}`;
      queryParams.push(mealType);
      paramIndex++;
    }

    if (kitchenIds && kitchenIds.length > 0) {
      mealQuery += ` AND m.kitchen_id = ANY($${paramIndex})`;
      queryParams.push(kitchenIds);
      paramIndex++;
    }

    mealQuery += ` ORDER BY m.title_en LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit * 2, offset); // Get more meals to filter

    const mealsResult = await pool.query(mealQuery, queryParams);
    const meals = mealsResult.rows;

    // Check eligibility for each meal
    const eligibilityPromises = meals.map(meal => 
      this.checkMealEligibility(meal.id, userId)
    );
    
    const eligibilityResults = await Promise.all(eligibilityPromises);

    // Separate eligible and partial matches
    const eligible = eligibilityResults
      .filter(result => result.is_eligible)
      .sort((a, b) => b.availability_score - a.availability_score)
      .slice(0, limit);

    const partialMatches = strictMode ? [] : eligibilityResults
      .filter(result => !result.is_eligible && result.missing_mandatory_count <= 2)
      .sort((a, b) => {
        // Sort by fewest missing mandatory ingredients, then by availability score
        if (a.missing_mandatory_count !== b.missing_mandatory_count) {
          return a.missing_mandatory_count - b.missing_mandatory_count;
        }
        return b.availability_score - a.availability_score;
      })
      .slice(0, limit);

    return {
      eligible,
      partialMatches,
      totalCount: eligible.length + partialMatches.length
    };
  }

  /**
   * Update ingredient status for a meal (admin/creator only)
   */
  static async updateIngredientStatus(
    mealId: string,
    ingredientId: string,
    newStatus: IngredientStatus,
    userId: string
  ): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if user has permission to modify this meal
      const mealCheck = await client.query(`
        SELECT created_by_user_id FROM meals WHERE id = $1
      `, [mealId]);

      if (mealCheck.rows.length === 0) {
        throw new Error('Meal not found');
      }

      const mealCreator = mealCheck.rows[0].created_by_user_id;
      if (mealCreator !== userId) {
        throw new Error('Insufficient permissions');
      }

      // Update the ingredient status
      const updateResult = await client.query(`
        UPDATE meal_ingredients 
        SET status = $1
        WHERE meal_id = $2 AND ingredient_id = $3
      `, [newStatus, mealId, ingredientId]);

      if (updateResult.rowCount === 0) {
        throw new Error('Ingredient not found in meal');
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get ingredient status statistics for a meal
   */
  static async getMealIngredientStats(mealId: string): Promise<{
    mandatory_count: number;
    recommended_count: number;
    optional_count: number;
    total_count: number;
    status_distribution: Record<IngredientStatus, number>;
  }> {
    const result = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM meal_ingredients mi
      JOIN ingredients i ON mi.ingredient_id = i.id
      WHERE mi.meal_id = $1 AND i.is_approved = true
      GROUP BY status
    `, [mealId]);

    const stats = {
      mandatory_count: 0,
      recommended_count: 0,
      optional_count: 0,
      total_count: 0,
      status_distribution: {} as Record<IngredientStatus, number>
    };

    result.rows.forEach(row => {
      const status = this.validateStatus(row.status);
      const count = parseInt(row.count);
      
      stats.status_distribution[status] = count;
      stats.total_count += count;
      
      switch (status) {
        case 'mandatory':
          stats.mandatory_count = count;
          break;
        case 'recommended':
          stats.recommended_count = count;
          break;
        case 'optional':
          stats.optional_count = count;
          break;
      }
    });

    return stats;
  }
}