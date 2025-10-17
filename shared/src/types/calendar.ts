export interface CalendarEntry {
  id: string;
  user_id: string;
  meal_id: string;
  scheduled_date: string; // ISO date string (YYYY-MM-DD)
  notes?: string;
  created_at: string;
  
  // Populated fields
  meal?: Meal;
}

export interface CreateCalendarEntryRequest {
  meal_id: string;
  scheduled_date: string; // ISO date string (YYYY-MM-DD)
  notes?: string;
}

export interface UpdateCalendarEntryRequest {
  scheduled_date?: string;
  notes?: string;
}

export interface CalendarFilters {
  start_date?: string; // ISO date string
  end_date?: string; // ISO date string
  meal_type?: 'breakfast' | 'lunch' | 'dinner';
  limit?: number;
  offset?: number;
}

export interface CalendarListResponse {
  entries: CalendarEntry[];
  total: number;
  limit: number;
  offset: number;
}

// Re-export Meal type for calendar entries
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
}

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  minerals?: Record<string, number>;
}