export interface Meal {
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
  steps_en?: string[];
  steps_ar?: string[];
  nutrition_totals?: NutritionTotals;
  image_url?: string;
  created_by_user_id?: string;
  is_public: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  
  // Populated fields
  kitchen?: Kitchen;
  ingredients?: MealIngredient[];
  creator?: User;
}

export interface MealIngredient {
  id: string;
  meal_id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  status: 'mandatory' | 'recommended' | 'optional';
  calories_contribution?: number;
  nutrition_contribution?: NutritionData;
  created_at: string;
  
  // Populated fields
  ingredient?: Ingredient;
}

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  minerals?: Record<string, number>;
}

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  minerals?: Record<string, number>;
}

export interface CreateMealRequest {
  title_en: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  kitchen_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  servings?: number;
  prep_time_min?: number;
  cook_time_min?: number;
  steps_en?: string[];
  steps_ar?: string[];
  image_url?: string;
  is_public?: boolean;
  ingredients: CreateMealIngredientRequest[];
}

export interface CreateMealIngredientRequest {
  ingredient_id: string;
  quantity: number;
  unit: string;
  status: 'mandatory' | 'recommended' | 'optional';
}

export interface UpdateMealRequest {
  title_en?: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  kitchen_id?: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner';
  servings?: number;
  prep_time_min?: number;
  cook_time_min?: number;
  steps_en?: string[];
  steps_ar?: string[];
  image_url?: string;
  is_public?: boolean;
  ingredients?: CreateMealIngredientRequest[];
}

export interface MealFilters {
  kitchen_ids?: string[];
  meal_type?: 'breakfast' | 'lunch' | 'dinner';
  is_public?: boolean;
  created_by_user_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface MealListResponse {
  meals: Meal[];
  total: number;
  limit: number;
  offset: number;
}

// Re-export types that meals depend on
export interface Kitchen {
  id: string;
  name_en: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  icon_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Ingredient {
  id: string;
  name_en: string;
  name_ar?: string;
  category?: string;
  default_unit?: string;
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  minerals?: Record<string, number>;
  user_created_by?: string;
  is_approved: boolean;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  country: string;
  primary_kitchen_id?: string;
  language: 'en' | 'ar';
  created_at: string;
  updated_at: string;
}

// Community and moderation types
export interface CommunityMealFilters extends MealFilters {
  is_approved?: boolean;
  reported?: boolean;
}

export interface MealReport {
  id: string;
  meal_id: string;
  reported_by_user_id: string;
  reason: 'inappropriate_content' | 'spam' | 'copyright' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
  
  // Populated fields
  meal?: Meal;
  reporter?: User;
}

export interface CreateMealReportRequest {
  meal_id: string;
  reason: 'inappropriate_content' | 'spam' | 'copyright' | 'other';
  description?: string;
}

export interface ModerationAction {
  id: string;
  meal_id: string;
  moderator_user_id: string;
  action: 'approve' | 'reject' | 'hide';
  reason?: string;
  created_at: string;
  
  // Populated fields
  meal?: Meal;
  moderator?: User;
}

export interface PublishRecipeRequest {
  meal_id: string;
  is_public: boolean;
}

export interface CommunityMealListResponse extends MealListResponse {
  meals: (Meal & { 
    report_count?: number;
    is_reported_by_user?: boolean;
  })[];
}