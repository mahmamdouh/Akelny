import { Meal } from './meal';
import { Ingredient } from './ingredient';

export interface MealSuggestion extends Meal {
  availability_score: number;
  missing_ingredients: MissingIngredient[];
  suggestion_reason: SuggestionReason;
  match_type: MatchType;
  pantry_coverage: number;
  favorite_boost?: boolean;
  recent_exclusion?: boolean;
  kitchen_preference_match?: boolean;
}

export interface MissingIngredient {
  ingredient_id: string;
  ingredient: Ingredient;
  quantity: number;
  unit: string;
  status: 'mandatory' | 'recommended' | 'optional';
  substitutes?: Ingredient[];
}

export type SuggestionReason = 
  | 'perfect_match'
  | 'good_match'
  | 'partial_match'
  | 'favorite_boost'
  | 'kitchen_preference'
  | 'random_selection'
  | 'new_recipe';

export type MatchType = 
  | 'perfect'
  | 'good'
  | 'partial'
  | 'poor';

export interface SuggestionFilters {
  meal_type?: 'breakfast' | 'lunch' | 'dinner';
  kitchen_ids?: string[];
  pantry_ingredient_ids?: string[];
  exclude_recent?: boolean;
  strict_mode?: boolean;
  favorite_boost?: boolean;
  max_missing_ingredients?: number;
  min_availability_score?: number;
  limit?: number;
  offset?: number;
}

export interface SuggestionRequest {
  filters?: SuggestionFilters;
  user_preferences?: UserPreferences;
}

export interface SuggestionResponse {
  meals: MealSuggestion[];
  total: number;
  filters_applied: SuggestionFilters;
  suggestion_metadata: SuggestionMetadata;
}

export interface SuggestionMetadata {
  pantry_size: number;
  total_eligible_meals: number;
  perfect_matches: number;
  good_matches: number;
  partial_matches: number;
  excluded_recent: number;
  favorite_boosted: number;
  processing_time_ms: number;
}

export interface UserPreferences {
  preferred_kitchens: string[];
  dietary_restrictions?: string[];
  allergens?: string[];
  preferred_meal_types?: ('breakfast' | 'lunch' | 'dinner')[];
  cooking_skill_level?: 'beginner' | 'intermediate' | 'advanced';
  max_prep_time?: number;
  max_cook_time?: number;
  preferred_servings?: number;
}

export interface RandomMealRequest {
  count?: number;
  filters?: SuggestionFilters;
}

export interface RandomMealResponse {
  meals: MealSuggestion[];
  selection_criteria: {
    total_eligible: number;
    filters_applied: SuggestionFilters;
    random_seed?: string;
  };
}

export interface PantryBasedSuggestionRequest {
  pantry_ingredient_ids: string[];
  strict_mode?: boolean;
  meal_type?: 'breakfast' | 'lunch' | 'dinner';
  kitchen_ids?: string[];
  limit?: number;
}

export interface PantryBasedSuggestionResponse {
  eligible_meals: MealSuggestion[];
  partial_matches: PartialMatch[];
  pantry_utilization: PantryUtilization;
  suggestions: {
    add_ingredients: Ingredient[];
    try_different_kitchens: string[];
    explore_meal_types: string[];
  };
}

export interface PartialMatch {
  meal: Meal;
  missing_mandatory: MissingIngredient[];
  missing_recommended: MissingIngredient[];
  availability_score: number;
  estimated_cost?: number;
  difficulty_increase?: 'low' | 'medium' | 'high';
}

export interface PantryUtilization {
  total_ingredients: number;
  used_ingredients: number;
  unused_ingredients: Ingredient[];
  utilization_percentage: number;
  suggestions_for_unused: {
    ingredient: Ingredient;
    possible_meals: Meal[];
  }[];
}

export interface SuggestionEngine {
  generateSuggestions(request: SuggestionRequest): Promise<SuggestionResponse>;
  getRandomMeals(request: RandomMealRequest): Promise<RandomMealResponse>;
  getPantryBasedSuggestions(request: PantryBasedSuggestionRequest): Promise<PantryBasedSuggestionResponse>;
  calculateAvailabilityScore(meal: Meal, pantryIngredients: string[]): number;
  determineSuggestionReason(meal: MealSuggestion, filters: SuggestionFilters): SuggestionReason;
  applyFavoriteBoost(meals: MealSuggestion[], favoriteIds: string[]): MealSuggestion[];
  excludeRecentMeals(meals: MealSuggestion[], recentMealIds: string[]): MealSuggestion[];
}

export interface SuggestionAlgorithmConfig {
  weights: {
    availability_score: number;
    favorite_boost: number;
    kitchen_preference: number;
    meal_type_match: number;
    recency_penalty: number;
  };
  thresholds: {
    perfect_match: number;
    good_match: number;
    minimum_viable: number;
  };
  limits: {
    max_suggestions: number;
    max_missing_ingredients: number;
    recent_exclusion_days: number;
  };
}

export const DEFAULT_SUGGESTION_CONFIG: SuggestionAlgorithmConfig = {
  weights: {
    availability_score: 0.4,
    favorite_boost: 0.2,
    kitchen_preference: 0.15,
    meal_type_match: 0.15,
    recency_penalty: 0.1
  },
  thresholds: {
    perfect_match: 95,
    good_match: 75,
    minimum_viable: 50
  },
  limits: {
    max_suggestions: 20,
    max_missing_ingredients: 3,
    recent_exclusion_days: 1
  }
};

export interface SuggestionHistory {
  id: string;
  user_id: string;
  meal_id: string;
  suggested_at: string;
  suggestion_reason: SuggestionReason;
  availability_score: number;
  was_selected: boolean;
  selected_at?: string;
  feedback_rating?: number;
  feedback_comment?: string;
}

export interface SuggestionFeedback {
  suggestion_id: string;
  rating: number; // 1-5 stars
  comment?: string;
  was_helpful: boolean;
  improvement_suggestions?: string[];
}

export interface SuggestionAnalytics {
  total_suggestions_generated: number;
  total_suggestions_selected: number;
  selection_rate: number;
  average_availability_score: number;
  most_common_reasons: { reason: SuggestionReason; count: number }[];
  user_satisfaction: {
    average_rating: number;
    total_feedback: number;
    positive_feedback_rate: number;
  };
  performance_metrics: {
    average_response_time_ms: number;
    cache_hit_rate: number;
    error_rate: number;
  };
}