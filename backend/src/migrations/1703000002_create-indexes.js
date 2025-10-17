/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Indexes for users table
  pgm.createIndex('users', 'email', { unique: true });
  pgm.createIndex('users', 'country');
  pgm.createIndex('users', 'primary_kitchen_id');

  // Indexes for kitchens table
  pgm.createIndex('kitchens', 'is_active');

  // Indexes for ingredients table
  pgm.createIndex('ingredients', 'category');
  pgm.createIndex('ingredients', 'is_approved');
  pgm.createIndex('ingredients', 'user_created_by');
  
  // Full-text search indexes for ingredients
  pgm.sql(`
    CREATE INDEX idx_ingredients_name_en_fts 
    ON ingredients USING gin(to_tsvector('english', name_en))
  `);
  
  pgm.sql(`
    CREATE INDEX idx_ingredients_name_ar_fts 
    ON ingredients USING gin(to_tsvector('arabic', name_ar))
  `);

  // Indexes for meals table
  pgm.createIndex('meals', 'kitchen_id');
  pgm.createIndex('meals', 'meal_type');
  pgm.createIndex('meals', 'created_by_user_id');
  pgm.createIndex('meals', ['is_public', 'is_approved']);
  pgm.createIndex('meals', 'created_at');

  // Full-text search indexes for meals
  pgm.sql(`
    CREATE INDEX idx_meals_title_en_fts 
    ON meals USING gin(to_tsvector('english', title_en))
  `);
  
  pgm.sql(`
    CREATE INDEX idx_meals_title_ar_fts 
    ON meals USING gin(to_tsvector('arabic', title_ar))
  `);

  // Indexes for meal_ingredients table
  pgm.createIndex('meal_ingredients', 'meal_id');
  pgm.createIndex('meal_ingredients', 'ingredient_id');
  pgm.createIndex('meal_ingredients', 'status');
  pgm.createIndex('meal_ingredients', ['meal_id', 'status']);

  // Indexes for user_pantry table
  pgm.createIndex('user_pantry', 'user_id');
  pgm.createIndex('user_pantry', 'ingredient_id');
  pgm.createIndex('user_pantry', 'added_at');

  // Indexes for user_favorites table
  pgm.createIndex('user_favorites', 'user_id');
  pgm.createIndex('user_favorites', 'meal_id');
  pgm.createIndex('user_favorites', 'added_at');

  // Indexes for user_kitchen_preferences table
  pgm.createIndex('user_kitchen_preferences', 'user_id');
  pgm.createIndex('user_kitchen_preferences', 'kitchen_id');

  // Indexes for calendar_entries table
  pgm.createIndex('calendar_entries', 'user_id');
  pgm.createIndex('calendar_entries', 'meal_id');
  pgm.createIndex('calendar_entries', 'scheduled_date');
  pgm.createIndex('calendar_entries', ['user_id', 'scheduled_date']);
};

exports.down = (pgm) => {
  // Drop all indexes (PostgreSQL will automatically drop them when tables are dropped,
  // but we'll be explicit for clarity)
  
  // Calendar entries indexes
  pgm.dropIndex('calendar_entries', ['user_id', 'scheduled_date']);
  pgm.dropIndex('calendar_entries', 'scheduled_date');
  pgm.dropIndex('calendar_entries', 'meal_id');
  pgm.dropIndex('calendar_entries', 'user_id');

  // User kitchen preferences indexes
  pgm.dropIndex('user_kitchen_preferences', 'kitchen_id');
  pgm.dropIndex('user_kitchen_preferences', 'user_id');

  // User favorites indexes
  pgm.dropIndex('user_favorites', 'added_at');
  pgm.dropIndex('user_favorites', 'meal_id');
  pgm.dropIndex('user_favorites', 'user_id');

  // User pantry indexes
  pgm.dropIndex('user_pantry', 'added_at');
  pgm.dropIndex('user_pantry', 'ingredient_id');
  pgm.dropIndex('user_pantry', 'user_id');

  // Meal ingredients indexes
  pgm.dropIndex('meal_ingredients', ['meal_id', 'status']);
  pgm.dropIndex('meal_ingredients', 'status');
  pgm.dropIndex('meal_ingredients', 'ingredient_id');
  pgm.dropIndex('meal_ingredients', 'meal_id');

  // Meals indexes
  pgm.dropIndex('meals', 'idx_meals_title_ar_fts');
  pgm.dropIndex('meals', 'idx_meals_title_en_fts');
  pgm.dropIndex('meals', 'created_at');
  pgm.dropIndex('meals', ['is_public', 'is_approved']);
  pgm.dropIndex('meals', 'created_by_user_id');
  pgm.dropIndex('meals', 'meal_type');
  pgm.dropIndex('meals', 'kitchen_id');

  // Ingredients indexes
  pgm.dropIndex('ingredients', 'idx_ingredients_name_ar_fts');
  pgm.dropIndex('ingredients', 'idx_ingredients_name_en_fts');
  pgm.dropIndex('ingredients', 'user_created_by');
  pgm.dropIndex('ingredients', 'is_approved');
  pgm.dropIndex('ingredients', 'category');

  // Kitchens indexes
  pgm.dropIndex('kitchens', 'is_active');

  // Users indexes
  pgm.dropIndex('users', 'primary_kitchen_id');
  pgm.dropIndex('users', 'country');
  pgm.dropIndex('users', 'email');
};