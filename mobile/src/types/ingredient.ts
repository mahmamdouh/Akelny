export interface Ingredient {
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
  user_created_by?: string;
  is_approved: boolean;
  created_at: string;
}

export interface IngredientCategory {
  category: string;
  count: number;
}

export interface PantryIngredient extends Ingredient {
  added_at: string;
}

export interface IngredientStatus {
  status: 'mandatory' | 'recommended' | 'optional';
  label_en: string;
  label_ar: string;
  color: string;
  backgroundColor: string;
  icon: string;
  description_en: string;
  description_ar: string;
}

export interface MealIngredient {
  id: string;
  ingredient_id: string;
  name_en: string;
  name_ar?: string;
  category: string;
  quantity: number;
  unit: string;
  status: 'mandatory' | 'recommended' | 'optional';
  status_info: IngredientStatus;
  calories_contribution?: number;
  nutrition_contribution?: Record<string, any>;
  nutrition_per_100g?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    minerals?: Record<string, number>;
  };
  default_unit: string;
}

export interface IngredientSearchResult {
  ingredients: Ingredient[];
  query: string;
  language: string;
  count: number;
}

export interface PantryStats {
  totalIngredients: number;
  categoryCounts: IngredientCategory[];
  userId: string;
}

export interface CreateIngredientRequest {
  name_en: string;
  name_ar?: string;
  category: string;
  default_unit: string;
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  minerals?: Record<string, number>;
}

export interface IngredientFilters {
  category?: string;
  search?: string;
  language?: 'en' | 'ar';
  limit?: number;
  offset?: number;
}

export interface IngredientsResponse {
  ingredients: Ingredient[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface PantryResponse {
  pantry: PantryIngredient[];
  count: number;
  userId: string;
}