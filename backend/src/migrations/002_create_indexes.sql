-- Create database indexes for optimal performance
-- This file creates all necessary indexes for the Akelny application

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
CREATE INDEX IF NOT EXISTS idx_users_primary_kitchen_id ON users(primary_kitchen_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);

-- Indexes for kitchens table
CREATE INDEX IF NOT EXISTS idx_kitchens_name_en ON kitchens(name_en);
CREATE INDEX IF NOT EXISTS idx_kitchens_name_ar ON kitchens(name_ar);

-- Indexes for ingredients table
CREATE INDEX IF NOT EXISTS idx_ingredients_is_approved ON ingredients(is_approved);
CREATE INDEX IF NOT EXISTS idx_ingredients_user_created_by ON ingredients(user_created_by);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);
CREATE INDEX IF NOT EXISTS idx_ingredients_name_en ON ingredients(name_en);
CREATE INDEX IF NOT EXISTS idx_ingredients_name_ar ON ingredients(name_ar);

-- Full-text search indexes for ingredients
CREATE INDEX IF NOT EXISTS idx_ingredients_name_en_gin ON ingredients USING gin(to_tsvector('english', name_en));
CREATE INDEX IF NOT EXISTS idx_ingredients_name_ar_gin ON ingredients USING gin(to_tsvector('arabic', name_ar));

-- Indexes for meals table
CREATE INDEX IF NOT EXISTS idx_meals_meal_type ON meals(meal_type);
CREATE INDEX IF NOT EXISTS idx_meals_created_by_user_id ON meals(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_meals_public_approved ON meals(is_public, is_approved);
CREATE INDEX IF NOT EXISTS idx_meals_created_at ON meals(created_at);
CREATE INDEX IF NOT EXISTS idx_meals_kitchen_id ON meals(kitchen_id);
CREATE INDEX IF NOT EXISTS idx_meals_difficulty_level ON meals(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_meals_prep_time ON meals(prep_time_min);
CREATE INDEX IF NOT EXISTS idx_meals_cook_time ON meals(cook_time_min);

-- Full-text search indexes for meals
CREATE INDEX IF NOT EXISTS idx_meals_title_en_gin ON meals USING gin(to_tsvector('english', title_en));
CREATE INDEX IF NOT EXISTS idx_meals_title_ar_gin ON meals USING gin(to_tsvector('arabic', title_ar));

-- Indexes for meal_ingredients table
CREATE INDEX IF NOT EXISTS idx_meal_ingredients_ingredient_id ON meal_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_meal_ingredients_status ON meal_ingredients(status);
CREATE INDEX IF NOT EXISTS idx_meal_ingredients_meal_status ON meal_ingredients(meal_id, status);

-- Indexes for user_pantry table
CREATE INDEX IF NOT EXISTS idx_user_pantry_ingredient_id ON user_pantry(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_user_pantry_added_at ON user_pantry(added_at);
CREATE INDEX IF NOT EXISTS idx_user_pantry_expiry_date ON user_pantry(expiry_date);

-- Indexes for user_favorites table
CREATE INDEX IF NOT EXISTS idx_user_favorites_meal_id ON user_favorites(meal_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_added_at ON user_favorites(added_at);

-- Indexes for user_kitchen_preferences table
CREATE INDEX IF NOT EXISTS idx_user_kitchen_preferences_kitchen_id ON user_kitchen_preferences(kitchen_id);

-- Indexes for calendar_entries table
CREATE INDEX IF NOT EXISTS idx_calendar_entries_meal_id ON calendar_entries(meal_id);
CREATE INDEX IF NOT EXISTS idx_calendar_entries_scheduled_date ON calendar_entries(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_calendar_entries_user_date ON calendar_entries(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_calendar_entries_meal_type ON calendar_entries(meal_type);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_meals_kitchen_public_approved ON meals(kitchen_id, is_public, is_approved);
CREATE INDEX IF NOT EXISTS idx_meals_type_kitchen ON meals(meal_type, kitchen_id);
CREATE INDEX IF NOT EXISTS idx_meal_ingredients_meal_mandatory ON meal_ingredients(meal_id) WHERE status = 'mandatory';

-- Performance optimization indexes
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_ingredients_created_at ON ingredients(created_at);
CREATE INDEX IF NOT EXISTS idx_calendar_entries_created_at ON calendar_entries(created_at);