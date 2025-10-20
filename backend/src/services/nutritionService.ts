interface NutritionData {
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  minerals?: Record<string, number>;
}

interface IngredientContribution {
  ingredient_id: string;
  quantity: number;
  unit: string;
  nutrition_data: NutritionData;
  status: 'mandatory' | 'recommended' | 'optional';
}

interface NutritionTotals {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_minerals: Record<string, number>;
  per_serving: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    minerals: Record<string, number>;
  };
}

interface IngredientNutritionContribution {
  ingredient_id: string;
  name_en: string;
  name_ar?: string;
  quantity: number;
  unit: string;
  status: 'mandatory' | 'recommended' | 'optional';
  calories_contribution: number;
  protein_contribution: number;
  carbs_contribution: number;
  fat_contribution: number;
  minerals_contribution: Record<string, number>;
  percentage_of_total_calories: number;
}

export class NutritionService {
  /**
   * Calculate nutrition for a meal ingredient (simplified interface for meal controller)
   */
  static async calculateIngredientNutrition(
    ingredientId: string,
    quantity: number,
    unit: string
  ): Promise<{ calories: number; protein: number; carbs: number; fat: number; minerals?: Record<string, number> }> {
    try {
      const { pool } = require('../config/database');
      
      // Get ingredient nutrition data
      const result = await pool.query(
        'SELECT calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, minerals, name_en FROM ingredients WHERE id = $1',
        [ingredientId]
      );
      
      if (result.rows.length === 0) {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      
      const ingredient = result.rows[0];
      const gramsUsed = this.convertToGrams(quantity, unit, ingredient.name_en);
      const factor = gramsUsed / 100; // nutrition data is per 100g
      
      return {
        calories: Math.round((ingredient.calories_per_100g || 0) * factor * 100) / 100,
        protein: Math.round((ingredient.protein_per_100g || 0) * factor * 100) / 100,
        carbs: Math.round((ingredient.carbs_per_100g || 0) * factor * 100) / 100,
        fat: Math.round((ingredient.fat_per_100g || 0) * factor * 100) / 100,
        minerals: ingredient.minerals ? 
          Object.fromEntries(
            Object.entries(ingredient.minerals).map(([key, value]) => [
              key, 
              Math.round((value as number) * factor * 100) / 100
            ])
          ) : undefined
      };
    } catch (error) {
      console.error('Error calculating ingredient nutrition:', error);
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
  }

  /**
   * Calculate total nutrition for a meal (simplified interface for meal controller)
   */
  static async calculateSimpleMealNutrition(
    ingredients: Array<{ ingredient_id: string; quantity: number; unit: string }>
  ): Promise<{ calories: number; protein: number; carbs: number; fat: number; minerals?: Record<string, number> }> {
    try {
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      const totalMinerals: Record<string, number> = {};
      
      for (const ingredient of ingredients) {
        const nutrition = await this.calculateIngredientNutrition(
          ingredient.ingredient_id,
          ingredient.quantity,
          ingredient.unit
        );
        
        totalCalories += nutrition.calories;
        totalProtein += nutrition.protein;
        totalCarbs += nutrition.carbs;
        totalFat += nutrition.fat;
        
        if (nutrition.minerals) {
          Object.entries(nutrition.minerals).forEach(([mineral, value]) => {
            totalMinerals[mineral] = (totalMinerals[mineral] || 0) + value;
          });
        }
      }
      
      return {
        calories: Math.round(totalCalories * 100) / 100,
        protein: Math.round(totalProtein * 100) / 100,
        carbs: Math.round(totalCarbs * 100) / 100,
        fat: Math.round(totalFat * 100) / 100,
        minerals: Object.keys(totalMinerals).length > 0 ? totalMinerals : undefined
      };
    } catch (error) {
      console.error('Error calculating meal nutrition:', error);
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
  }
  // Unit conversion factors to grams
  private static readonly UNIT_CONVERSIONS: Record<string, number> = {
    // Weight units
    'gram': 1,
    'g': 1,
    'kilogram': 1000,
    'kg': 1000,
    'ounce': 28.35,
    'oz': 28.35,
    'pound': 453.59,
    'lb': 453.59,
    
    // Volume units (approximate conversions for common ingredients)
    'cup': 240, // ml, varies by ingredient
    'tablespoon': 15,
    'tbsp': 15,
    'teaspoon': 5,
    'tsp': 5,
    'liter': 1000,
    'l': 1000,
    'milliliter': 1,
    'ml': 1,
    
    // Piece-based units (approximate)
    'piece': 100, // default assumption
    'slice': 30,
    'clove': 3, // for garlic
    'medium': 150, // medium-sized items
    'large': 200,
    'small': 75
  };

  // Ingredient-specific unit conversions (more accurate)
  private static readonly INGREDIENT_UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
    'rice': {
      'cup': 185, // cooked rice
      'cup_raw': 195 // raw rice
    },
    'flour': {
      'cup': 120
    },
    'milk': {
      'cup': 240
    },
    'oil': {
      'tablespoon': 14,
      'cup': 218
    },
    'onion': {
      'piece': 150,
      'medium': 150,
      'large': 200,
      'small': 100
    },
    'garlic': {
      'clove': 3,
      'piece': 3
    },
    'potato': {
      'piece': 150,
      'medium': 150,
      'large': 200,
      'small': 100
    }
  };

  /**
   * Convert ingredient quantity to grams for nutrition calculation
   */
  static convertToGrams(quantity: number, unit: string, ingredientName?: string): number {
    const normalizedUnit = unit.toLowerCase().trim();
    
    // Check for ingredient-specific conversions first
    if (ingredientName) {
      const ingredientKey = ingredientName.toLowerCase().replace(/\s+/g, '_');
      const ingredientConversions = this.INGREDIENT_UNIT_CONVERSIONS[ingredientKey];
      if (ingredientConversions && ingredientConversions[normalizedUnit]) {
        return quantity * ingredientConversions[normalizedUnit];
      }
    }
    
    // Use general conversions
    const conversionFactor = this.UNIT_CONVERSIONS[normalizedUnit];
    if (conversionFactor) {
      return quantity * conversionFactor;
    }
    
    // Default assumption if unit not found
    console.warn(`Unknown unit: ${unit}, assuming 1:1 gram conversion`);
    return quantity;
  }

  /**
   * Calculate nutrition contribution for a single ingredient
   */
  static calculateIngredientContribution(
    ingredient: IngredientContribution,
    ingredientName?: string
  ): IngredientNutritionContribution {
    const gramsUsed = this.convertToGrams(
      ingredient.quantity, 
      ingredient.unit, 
      ingredientName
    );
    
    const factor = gramsUsed / 100; // nutrition data is per 100g
    
    const caloriesContribution = (ingredient.nutrition_data.calories_per_100g || 0) * factor;
    const proteinContribution = (ingredient.nutrition_data.protein_per_100g || 0) * factor;
    const carbsContribution = (ingredient.nutrition_data.carbs_per_100g || 0) * factor;
    const fatContribution = (ingredient.nutrition_data.fat_per_100g || 0) * factor;
    
    // Calculate mineral contributions
    const mineralsContribution: Record<string, number> = {};
    if (ingredient.nutrition_data.minerals) {
      Object.entries(ingredient.nutrition_data.minerals).forEach(([mineral, value]) => {
        mineralsContribution[mineral] = value * factor;
      });
    }
    
    return {
      ingredient_id: ingredient.ingredient_id,
      name_en: ingredientName || '',
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      status: ingredient.status,
      calories_contribution: Math.round(caloriesContribution * 100) / 100,
      protein_contribution: Math.round(proteinContribution * 100) / 100,
      carbs_contribution: Math.round(carbsContribution * 100) / 100,
      fat_contribution: Math.round(fatContribution * 100) / 100,
      minerals_contribution: mineralsContribution,
      percentage_of_total_calories: 0 // Will be calculated later
    };
  }

  /**
   * Calculate total nutrition for a meal
   */
  static calculateMealNutrition(
    ingredients: IngredientContribution[],
    servings: number = 1,
    ingredientNames?: Record<string, string>
  ): {
    totals: NutritionTotals;
    contributions: IngredientNutritionContribution[];
  } {
    const contributions: IngredientNutritionContribution[] = [];
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    const totalMinerals: Record<string, number> = {};
    
    // Calculate individual contributions
    ingredients.forEach(ingredient => {
      const ingredientName = ingredientNames?.[ingredient.ingredient_id];
      const contribution = this.calculateIngredientContribution(ingredient, ingredientName);
      
      contributions.push(contribution);
      
      totalCalories += contribution.calories_contribution;
      totalProtein += contribution.protein_contribution;
      totalCarbs += contribution.carbs_contribution;
      totalFat += contribution.fat_contribution;
      
      // Aggregate minerals
      Object.entries(contribution.minerals_contribution).forEach(([mineral, value]) => {
        totalMinerals[mineral] = (totalMinerals[mineral] || 0) + value;
      });
    });
    
    // Calculate percentage of total calories for each ingredient
    contributions.forEach(contribution => {
      contribution.percentage_of_total_calories = totalCalories > 0 
        ? Math.round((contribution.calories_contribution / totalCalories) * 100 * 100) / 100
        : 0;
    });
    
    // Round totals
    totalCalories = Math.round(totalCalories * 100) / 100;
    totalProtein = Math.round(totalProtein * 100) / 100;
    totalCarbs = Math.round(totalCarbs * 100) / 100;
    totalFat = Math.round(totalFat * 100) / 100;
    
    // Round minerals
    Object.keys(totalMinerals).forEach(mineral => {
      totalMinerals[mineral] = Math.round(totalMinerals[mineral] * 100) / 100;
    });
    
    const totals: NutritionTotals = {
      total_calories: totalCalories,
      total_protein: totalProtein,
      total_carbs: totalCarbs,
      total_fat: totalFat,
      total_minerals: totalMinerals,
      per_serving: {
        calories: Math.round((totalCalories / servings) * 100) / 100,
        protein: Math.round((totalProtein / servings) * 100) / 100,
        carbs: Math.round((totalCarbs / servings) * 100) / 100,
        fat: Math.round((totalFat / servings) * 100) / 100,
        minerals: Object.fromEntries(
          Object.entries(totalMinerals).map(([mineral, value]) => [
            mineral,
            Math.round((value / servings) * 100) / 100
          ])
        )
      }
    };
    
    return { totals, contributions };
  }

  /**
   * Validate ingredient status based on meal requirements
   */
  static validateIngredientStatus(status: string): 'mandatory' | 'recommended' | 'optional' {
    const validStatuses = ['mandatory', 'recommended', 'optional'];
    if (validStatuses.includes(status.toLowerCase())) {
      return status.toLowerCase() as 'mandatory' | 'recommended' | 'optional';
    }
    return 'optional'; // default fallback
  }

  /**
   * Get ingredient status color code for UI
   */
  static getStatusColorCode(status: 'mandatory' | 'recommended' | 'optional'): {
    color: string;
    backgroundColor: string;
    description: string;
  } {
    switch (status) {
      case 'mandatory':
        return {
          color: '#ffffff',
          backgroundColor: '#22c55e', // green
          description: 'Required ingredient - meal cannot be made without this'
        };
      case 'recommended':
        return {
          color: '#ffffff',
          backgroundColor: '#f97316', // orange
          description: 'Recommended ingredient - enhances the meal significantly'
        };
      case 'optional':
        return {
          color: '#ffffff',
          backgroundColor: '#6b7280', // gray
          description: 'Optional ingredient - can be omitted or substituted'
        };
      default:
        return {
          color: '#ffffff',
          backgroundColor: '#6b7280',
          description: 'Optional ingredient'
        };
    }
  }

  /**
   * Calculate nutrition density score (nutrition per calorie)
   */
  static calculateNutritionDensity(nutrition: NutritionData): number {
    const calories = nutrition.calories_per_100g || 1;
    const protein = nutrition.protein_per_100g || 0;
    const minerals = nutrition.minerals || {};
    
    // Simple scoring: protein content + mineral diversity
    const proteinScore = protein / calories * 100;
    const mineralScore = Object.keys(minerals).length * 2;
    
    return Math.round((proteinScore + mineralScore) * 100) / 100;
  }

  /**
   * Get recommended daily values for nutrients (approximate)
   */
  static getRecommendedDailyValues(): Record<string, number> {
    return {
      calories: 2000,
      protein: 50, // grams
      carbs: 300, // grams
      fat: 65, // grams
      calcium: 1000, // mg
      iron: 18, // mg
      magnesium: 400, // mg
      phosphorus: 1000, // mg
      potassium: 3500, // mg
      sodium: 2300, // mg
      zinc: 11, // mg
      vitamin_c: 90, // mg
      vitamin_a: 900, // mcg
      folate: 400 // mcg
    };
  }

  /**
   * Calculate percentage of daily value for nutrients
   */
  static calculateDailyValuePercentages(
    nutrition: NutritionTotals,
    servings: number = 1
  ): Record<string, number> {
    const dailyValues = this.getRecommendedDailyValues();
    const perServing = nutrition.per_serving;
    const percentages: Record<string, number> = {};
    
    // Macronutrients
    percentages.calories = Math.round((perServing.calories / dailyValues.calories) * 100);
    percentages.protein = Math.round((perServing.protein / dailyValues.protein) * 100);
    percentages.carbs = Math.round((perServing.carbs / dailyValues.carbs) * 100);
    percentages.fat = Math.round((perServing.fat / dailyValues.fat) * 100);
    
    // Minerals
    Object.entries(perServing.minerals).forEach(([mineral, value]) => {
      const dailyValue = dailyValues[mineral];
      if (dailyValue) {
        percentages[mineral] = Math.round((value / dailyValue) * 100);
      }
    });
    
    return percentages;
  }
}

export const nutritionService = new NutritionService();