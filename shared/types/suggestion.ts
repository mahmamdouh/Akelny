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