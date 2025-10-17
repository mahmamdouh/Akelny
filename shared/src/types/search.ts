export interface SearchPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface IngredientSearchResult {
  id: string;
  name_en: string;
  name_ar?: string;
  category: string;
  default_unit: string;
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  minerals?: Record<string, number>;
  rank?: number;
}

export interface IngredientSearchResponse {
  ingredients: IngredientSearchResult[];
  pagination: SearchPagination;
  query: string;
  language: 'en' | 'ar';
  filters: {
    category?: string;
  };
}

export interface MealSearchResult {
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
  nutrition_totals?: any;
  image_url?: string;
  created_by_user_id: string;
  is_public: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  kitchen?: {
    id: string;
    name_en: string;
    name_ar?: string;
    icon_url?: string;
  };
  creator?: {
    name: string;
  };
  rank?: number;
}

export interface MealSearchResponse {
  meals: MealSearchResult[];
  pagination: SearchPagination;
  query: string;
  language: 'en' | 'ar';
  filters: {
    kitchen_ids?: string[];
    meal_type?: 'breakfast' | 'lunch' | 'dinner';
    is_public?: boolean;
  };
}

export interface KitchenBrowseResult {
  id: string;
  name_en: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  icon_url?: string;
  meal_count: number;
}

export interface KitchenBrowseResponse {
  kitchen: {
    id: string;
    name_en: string;
    name_ar?: string;
    description_en?: string;
    description_ar?: string;
    icon_url?: string;
  };
  meals: MealSearchResult[];
  pagination: SearchPagination;
  filters: {
    kitchen_id: string;
    meal_type?: 'breakfast' | 'lunch' | 'dinner';
  };
}

export interface KitchensListResponse {
  kitchens: KitchenBrowseResult[];
}

export interface CombinedSearchResult {
  ingredients?: Array<{
    id: string;
    name_en: string;
    name_ar?: string;
    category: string;
    type: 'ingredient';
  }>;
  meals?: Array<{
    id: string;
    title_en: string;
    title_ar?: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner';
    image_url?: string;
    kitchen?: {
      name_en: string;
      name_ar?: string;
    };
    type: 'meal';
  }>;
}

export interface CombinedSearchResponse {
  query: string;
  language: 'en' | 'ar';
  results: CombinedSearchResult;
}

export interface SearchFilters {
  query?: string;
  language?: 'en' | 'ar';
  limit?: number;
  offset?: number;
}

export interface IngredientSearchFilters extends SearchFilters {
  category?: string;
}

export interface MealSearchFilters extends SearchFilters {
  kitchen_ids?: string[];
  meal_type?: 'breakfast' | 'lunch' | 'dinner';
  is_public?: boolean;
}

export interface KitchenBrowseFilters {
  kitchen_id: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner';
  limit?: number;
  offset?: number;
}