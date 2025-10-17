export interface Ingredient {
  id: string;
  name_en: string;
  name_ar?: string;
  category: string;
  default_unit?: string;
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  minerals?: Record<string, number>;
  user_created_by?: string;
  is_approved?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IngredientCategory {
  id: string;
  name_en: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  icon?: string;
  sort_order?: number;
}

export interface MealIngredient {
  id: string;
  meal_id: string;
  ingredient_id: string;
  ingredient?: Ingredient;
  quantity: number;
  unit: string;
  status: 'mandatory' | 'recommended' | 'optional';
  calories_contribution?: number;
  nutrition_contribution?: {
    protein: number;
    carbs: number;
    fat: number;
    minerals?: Record<string, number>;
  };
  created_at?: string;
}

export interface UserPantry {
  user_id: string;
  ingredient_id: string;
  ingredient?: Ingredient;
  added_at: string;
}

export interface IngredientListRequest {
  category?: string;
  search?: string;
  user_created?: boolean;
  is_approved?: boolean;
  limit?: number;
  offset?: number;
}

export interface IngredientListResponse {
  ingredients: Ingredient[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateIngredientRequest {
  name_en: string;
  name_ar?: string;
  category: string;
  default_unit?: string;
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  minerals?: Record<string, number>;
}

export interface UpdateIngredientRequest extends Partial<CreateIngredientRequest> {
  id: string;
}

export interface UserPantryRequest {
  ingredient_ids: string[];
}

export interface UserPantryResponse {
  success: boolean;
  pantry: string[];
  message?: string;
}

export interface IngredientSearchRequest {
  query: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface IngredientSearchResponse {
  ingredients: Ingredient[];
  total: number;
  query: string;
  limit: number;
  offset: number;
}

export interface IngredientNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  minerals?: Record<string, number>;
}

export interface IngredientContribution extends IngredientNutrition {
  ingredient_id: string;
  quantity: number;
  unit: string;
  percentage_of_meal: number;
}

export interface IngredientStatus {
  status: 'mandatory' | 'recommended' | 'optional';
  description_en: string;
  description_ar?: string;
  color: string;
  icon?: string;
}

export const INGREDIENT_STATUSES: Record<string, IngredientStatus> = {
  mandatory: {
    status: 'mandatory',
    description_en: 'Essential ingredient that cannot be omitted',
    description_ar: 'مكون أساسي لا يمكن حذفه',
    color: '#28a745',
    icon: 'checkmark-circle'
  },
  recommended: {
    status: 'recommended',
    description_en: 'Important ingredient that enhances the dish',
    description_ar: 'مكون مهم يحسن الطبق',
    color: '#fd7e14',
    icon: 'star'
  },
  optional: {
    status: 'optional',
    description_en: 'Nice-to-have ingredient that can be substituted',
    description_ar: 'مكون اختياري يمكن استبداله',
    color: '#6c757d',
    icon: 'ellipse'
  }
};

export const INGREDIENT_CATEGORIES = [
  'grains',
  'protein',
  'legumes',
  'vegetables',
  'fruits',
  'dairy',
  'oils',
  'spices',
  'herbs'
] as const;

export type IngredientCategoryType = typeof INGREDIENT_CATEGORIES[number];