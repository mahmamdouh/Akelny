import { pool } from '../config/database';
import { IngredientStatusService } from './ingredientStatusService';
// Define types locally to avoid path issues
export interface MealSuggestionFilters {
  mealType?: 'breakfast' | 'lunch' | 'dinner';
  kitchenIds?: string[];
  excludeRecent?: boolean;
  strictMode?: boolean;
  favoriteBoost?: boolean;
}

export interface SuggestionOptions extends MealSuggestionFilters {
  limit?: number;
  offset?: number;
  randomCount?: number;
}

export interface MealSuggestion {
  id: string;
  title_en: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  kitchen_id: string;
  kitchen_name_en: string;
  kitchen_name_ar?: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  servings: number;
  prep_time_min?: number;
  cook_time_min?: number;
  image_url?: string;
  is_favorite: boolean;
  availability_score: number;
  missing_mandatory_count: number;
  missing_recommended_count: number;
  total_ingredients: number;
  created_by_user_id?: string;
  created_at: string;
  suggestion_reason?: string;
  weight_score?: number;
}

export interface SuggestionResult {
  suggestions: MealSuggestion[];
  totalCount: number;
  appliedFilters: MealSuggestionFilters;
  metadata: {
    eligibleMealsCount: number;
    partialMatchesCount: number;
    excludedRecentCount: number;
    favoriteBoostApplied: boolean;
  };
}

export interface RandomPickerResult {
  meals: MealSuggestion[];
  selectionCriteria: {
    totalEligible: number;
    filtersApplied: MealSuggestionFilters;
    selectionMethod: 'weighted_random' | 'pure_random';
  };
}

export interface FilterSummary {
  mealType?: string;
  kitchens: Array<{
    id: string;
    name_en: string;
    name_ar?: string;
  }>;
  excludedRecent: boolean;
  strictMode: boolean;
  favoriteBoost: boolean;
}

export class SuggestionEngine {
  /**
   * Get meal suggestions based on user's pantry and preferences
   */
  static async getSuggestions(
    userId: string,
    options: SuggestionOptions = {}
  ): Promise<SuggestionResult> {
    const {
      mealType,
      kitchenIds,
      excludeRecent = true,
      strictMode = true,
      favoriteBoost = true,
      limit = 10,
      offset = 0
    } = options;

    // Get user's kitchen preferences if not specified
    const userKitchens = kitchenIds || await this.getUserKitchenPreferences(userId);
    
    // Get recent meals to exclude
    const recentMealIds = excludeRecent ? await this.getRecentMeals(userId, 1) : [];
    
    // Build base query for eligible meals
    const { query, params } = this.buildMealQuery({
      mealType,
      kitchenIds: userKitchens,
      excludeMealIds: recentMealIds,
      strictMode
    });

    const mealsResult = await pool.query(query, params);
    const baseMeals = mealsResult.rows;

    // Check eligibility and calculate scores for each meal
    const suggestionPromises = baseMeals.map(async (meal) => {
      const eligibility = await IngredientStatusService.checkMealEligibility(meal.id, userId);
      const isFavorite = await this.isMealFavorite(meal.id, userId);
      
      // Calculate weight score for ranking
      let weightScore = eligibility.availability_score;
      
      // Boost favorites
      if (favoriteBoost && isFavorite) {
        weightScore += 20;
      }
      
      // Boost meals with fewer missing ingredients
      if (eligibility.missing_mandatory_count === 0) {
        weightScore += 10;
      }
      
      // Slight boost for meals with fewer recommended missing ingredients
      weightScore -= eligibility.missing_recommended_count * 2;

      const suggestion: MealSuggestion = {
        id: meal.id,
        title_en: meal.title_en,
        title_ar: meal.title_ar,
        description_en: meal.description_en,
        description_ar: meal.description_ar,
        kitchen_id: meal.kitchen_id,
        kitchen_name_en: meal.kitchen_name_en,
        kitchen_name_ar: meal.kitchen_name_ar,
        meal_type: meal.meal_type,
        servings: meal.servings,
        prep_time_min: meal.prep_time_min,
        cook_time_min: meal.cook_time_min,
        image_url: meal.image_url,
        is_favorite: isFavorite,
        availability_score: eligibility.availability_score,
        missing_mandatory_count: eligibility.missing_mandatory_count,
        missing_recommended_count: eligibility.missing_recommended_count,
        total_ingredients: eligibility.total_ingredients,
        created_by_user_id: meal.created_by_user_id,
        created_at: meal.created_at,
        weight_score: weightScore,
        suggestion_reason: this.getSuggestionReason(eligibility, isFavorite)
      };

      return suggestion;
    });

    const allSuggestions = await Promise.all(suggestionPromises);
    
    // Filter based on strict mode
    const eligibleSuggestions = strictMode 
      ? allSuggestions.filter(s => s.missing_mandatory_count === 0)
      : allSuggestions;
    
    // Sort by weight score (highest first)
    const sortedSuggestions = eligibleSuggestions
      .sort((a, b) => (b.weight_score || 0) - (a.weight_score || 0));
    
    // Apply pagination
    const paginatedSuggestions = sortedSuggestions.slice(offset, offset + limit);
    
    // Get filter summary
    const filterSummary = await this.getFilterSummary(userKitchens, {
      mealType,
      kitchenIds: userKitchens,
      excludeRecent,
      strictMode,
      favoriteBoost
    });

    return {
      suggestions: paginatedSuggestions,
      totalCount: eligibleSuggestions.length,
      appliedFilters: {
        mealType,
        kitchenIds: userKitchens,
        excludeRecent,
        strictMode,
        favoriteBoost
      },
      metadata: {
        eligibleMealsCount: eligibleSuggestions.length,
        partialMatchesCount: allSuggestions.length - eligibleSuggestions.length,
        excludedRecentCount: recentMealIds.length,
        favoriteBoostApplied: favoriteBoost
      }
    };
  }

  /**
   * Get random meal suggestions with weighted selection
   */
  static async getRandomSuggestions(
    userId: string,
    options: SuggestionOptions = {}
  ): Promise<RandomPickerResult> {
    const { randomCount = 3, ...suggestionOptions } = options;
    
    // Get all eligible suggestions
    const suggestionResult = await this.getSuggestions(userId, {
      ...suggestionOptions,
      limit: 100, // Get more meals for better randomization
      offset: 0
    });

    const eligibleMeals = suggestionResult.suggestions;
    
    if (eligibleMeals.length === 0) {
      return {
        meals: [],
        selectionCriteria: {
          totalEligible: 0,
          filtersApplied: suggestionResult.appliedFilters,
          selectionMethod: 'weighted_random'
        }
      };
    }

    // Weighted random selection
    const selectedMeals = this.weightedRandomSelection(eligibleMeals, randomCount);

    return {
      meals: selectedMeals,
      selectionCriteria: {
        totalEligible: eligibleMeals.length,
        filtersApplied: suggestionResult.appliedFilters,
        selectionMethod: 'weighted_random'
      }
    };
  }

  /**
   * Filter meals by pantry ingredients
   */
  static async filterByPantry(
    userId: string,
    options: { strictMode?: boolean; mealType?: 'breakfast' | 'lunch' | 'dinner'; kitchenIds?: string[] } = {}
  ): Promise<{
    eligibleMeals: MealSuggestion[];
    partialMatches: MealSuggestion[];
  }> {
    const suggestionResult = await this.getSuggestions(userId, {
      ...options,
      strictMode: false, // Get both eligible and partial matches
      limit: 50
    });

    const eligibleMeals = suggestionResult.suggestions.filter(s => s.missing_mandatory_count === 0);
    const partialMatches = suggestionResult.suggestions.filter(s => s.missing_mandatory_count > 0);

    return {
      eligibleMeals,
      partialMatches
    };
  }

  /**
   * Get user's kitchen preferences
   */
  private static async getUserKitchenPreferences(userId: string): Promise<string[]> {
    const query = `
      SELECT DISTINCT kitchen_id 
      FROM user_kitchen_preferences ukp
      WHERE ukp.user_id = $1
      UNION
      SELECT primary_kitchen_id 
      FROM users 
      WHERE id = $1 AND primary_kitchen_id IS NOT NULL
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => row.kitchen_id || row.primary_kitchen_id).filter(Boolean);
  }

  /**
   * Get recent meals to exclude from suggestions
   */
  private static async getRecentMeals(userId: string, days: number = 1): Promise<string[]> {
    const query = `
      SELECT DISTINCT meal_id
      FROM calendar_entries
      WHERE user_id = $1 
        AND scheduled_date >= CURRENT_DATE - INTERVAL '${days} days'
        AND scheduled_date <= CURRENT_DATE
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => row.meal_id);
  }

  /**
   * Check if a meal is in user's favorites
   */
  private static async isMealFavorite(mealId: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM user_favorites WHERE user_id = $1 AND meal_id = $2',
      [userId, mealId]
    );
    return result.rows.length > 0;
  }

  /**
   * Build SQL query for meal selection
   */
  private static buildMealQuery(options: {
    mealType?: string;
    kitchenIds?: string[];
    excludeMealIds?: string[];
    strictMode?: boolean;
  }): { query: string; params: any[] } {
    let query = `
      SELECT DISTINCT 
        m.id,
        m.title_en,
        m.title_ar,
        m.description_en,
        m.description_ar,
        m.kitchen_id,
        k.name_en as kitchen_name_en,
        k.name_ar as kitchen_name_ar,
        m.meal_type,
        m.servings,
        m.prep_time_min,
        m.cook_time_min,
        m.image_url,
        m.created_by_user_id,
        m.created_at
      FROM meals m
      JOIN kitchens k ON m.kitchen_id = k.id
      WHERE m.is_approved = true 
        AND m.is_public = true
        AND k.is_active = true
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (options.mealType) {
      query += ` AND m.meal_type = $${paramIndex}`;
      params.push(options.mealType);
      paramIndex++;
    }

    if (options.kitchenIds && options.kitchenIds.length > 0) {
      query += ` AND m.kitchen_id = ANY($${paramIndex})`;
      params.push(options.kitchenIds);
      paramIndex++;
    }

    if (options.excludeMealIds && options.excludeMealIds.length > 0) {
      query += ` AND m.id != ALL($${paramIndex})`;
      params.push(options.excludeMealIds);
      paramIndex++;
    }

    query += ` ORDER BY m.created_at DESC`;

    return { query, params };
  }

  /**
   * Perform weighted random selection
   */
  private static weightedRandomSelection(meals: MealSuggestion[], count: number): MealSuggestion[] {
    if (meals.length <= count) {
      return [...meals];
    }

    const selected: MealSuggestion[] = [];
    const remaining = [...meals];

    for (let i = 0; i < count && remaining.length > 0; i++) {
      // Calculate total weight
      const totalWeight = remaining.reduce((sum, meal) => sum + (meal.weight_score || 1), 0);
      
      // Generate random number
      let random = Math.random() * totalWeight;
      
      // Select meal based on weight
      let selectedIndex = 0;
      for (let j = 0; j < remaining.length; j++) {
        random -= (remaining[j].weight_score || 1);
        if (random <= 0) {
          selectedIndex = j;
          break;
        }
      }

      selected.push(remaining[selectedIndex]);
      remaining.splice(selectedIndex, 1);
    }

    return selected;
  }

  /**
   * Generate suggestion reason text
   */
  private static getSuggestionReason(
    eligibility: { is_eligible: boolean; missing_mandatory_count: number; availability_score: number },
    isFavorite: boolean
  ): string {
    if (isFavorite && eligibility.is_eligible) {
      return 'Perfect match from your favorites';
    }
    if (eligibility.is_eligible) {
      return 'All required ingredients available';
    }
    if (eligibility.missing_mandatory_count === 1) {
      return 'Missing 1 required ingredient';
    }
    if (eligibility.missing_mandatory_count <= 3) {
      return `Missing ${eligibility.missing_mandatory_count} required ingredients`;
    }
    return 'Partial ingredient match';
  }

  /**
   * Get filter summary for response metadata
   */
  private static async getFilterSummary(
    kitchenIds: string[],
    filters: MealSuggestionFilters
  ): Promise<FilterSummary> {
    const kitchensQuery = `
      SELECT id, name_en, name_ar 
      FROM kitchens 
      WHERE id = ANY($1) AND is_active = true
    `;
    
    const kitchensResult = await pool.query(kitchensQuery, [kitchenIds]);
    
    return {
      mealType: filters.mealType,
      kitchens: kitchensResult.rows.map(row => ({
        id: row.id,
        name_en: row.name_en,
        name_ar: row.name_ar
      })),
      excludedRecent: filters.excludeRecent || false,
      strictMode: filters.strictMode || false,
      favoriteBoost: filters.favoriteBoost || false
    };
  }
}