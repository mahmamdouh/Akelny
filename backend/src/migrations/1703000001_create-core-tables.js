/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Enable UUID extension
  pgm.createExtension('uuid-ossp', { ifNotExists: true });

  // Create kitchens table first (referenced by users and meals)
  pgm.createTable('kitchens', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name_en: {
      type: 'varchar(255)',
      notNull: true,
    },
    name_ar: {
      type: 'varchar(255)',
    },
    description_en: {
      type: 'text',
    },
    description_ar: {
      type: 'text',
    },
    icon_url: {
      type: 'varchar(500)',
    },
    is_active: {
      type: 'boolean',
      default: true,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  // Create users table
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: 'varchar(255)',
      notNull: true,
    },
    country: {
      type: 'varchar(2)',
      notNull: true,
    },
    primary_kitchen_id: {
      type: 'uuid',
      references: 'kitchens(id)',
    },
    language: {
      type: 'varchar(2)',
      default: 'en',
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  // Create ingredients table
  pgm.createTable('ingredients', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name_en: {
      type: 'varchar(255)',
      notNull: true,
    },
    name_ar: {
      type: 'varchar(255)',
    },
    category: {
      type: 'varchar(100)',
    },
    default_unit: {
      type: 'varchar(50)',
    },
    calories_per_100g: {
      type: 'decimal(8,2)',
    },
    protein_per_100g: {
      type: 'decimal(8,2)',
    },
    carbs_per_100g: {
      type: 'decimal(8,2)',
    },
    fat_per_100g: {
      type: 'decimal(8,2)',
    },
    minerals: {
      type: 'jsonb',
    },
    user_created_by: {
      type: 'uuid',
      references: 'users(id)',
    },
    is_approved: {
      type: 'boolean',
      default: false,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  // Create meals table
  pgm.createTable('meals', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    title_en: {
      type: 'varchar(255)',
      notNull: true,
    },
    title_ar: {
      type: 'varchar(255)',
    },
    description_en: {
      type: 'text',
    },
    description_ar: {
      type: 'text',
    },
    kitchen_id: {
      type: 'uuid',
      references: 'kitchens(id)',
    },
    meal_type: {
      type: 'varchar(20)',
      notNull: true,
    },
    servings: {
      type: 'integer',
      default: 1,
    },
    prep_time_min: {
      type: 'integer',
    },
    cook_time_min: {
      type: 'integer',
    },
    steps_en: {
      type: 'jsonb',
    },
    steps_ar: {
      type: 'jsonb',
    },
    nutrition_totals: {
      type: 'jsonb',
    },
    image_url: {
      type: 'varchar(500)',
    },
    created_by_user_id: {
      type: 'uuid',
      references: 'users(id)',
    },
    is_public: {
      type: 'boolean',
      default: false,
    },
    is_approved: {
      type: 'boolean',
      default: false,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  // Create meal_ingredients relationship table
  pgm.createTable('meal_ingredients', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    meal_id: {
      type: 'uuid',
      references: 'meals(id)',
      onDelete: 'CASCADE',
      notNull: true,
    },
    ingredient_id: {
      type: 'uuid',
      references: 'ingredients(id)',
      notNull: true,
    },
    quantity: {
      type: 'decimal(10,3)',
      notNull: true,
    },
    unit: {
      type: 'varchar(50)',
      notNull: true,
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
    },
    calories_contribution: {
      type: 'decimal(8,2)',
    },
    nutrition_contribution: {
      type: 'jsonb',
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  // Create user_pantry relationship table
  pgm.createTable('user_pantry', {
    user_id: {
      type: 'uuid',
      references: 'users(id)',
      onDelete: 'CASCADE',
      notNull: true,
    },
    ingredient_id: {
      type: 'uuid',
      references: 'ingredients(id)',
      notNull: true,
    },
    added_at: {
      type: 'timestamp',
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  // Create user_favorites relationship table
  pgm.createTable('user_favorites', {
    user_id: {
      type: 'uuid',
      references: 'users(id)',
      onDelete: 'CASCADE',
      notNull: true,
    },
    meal_id: {
      type: 'uuid',
      references: 'meals(id)',
      onDelete: 'CASCADE',
      notNull: true,
    },
    added_at: {
      type: 'timestamp',
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  // Create user_kitchen_preferences relationship table
  pgm.createTable('user_kitchen_preferences', {
    user_id: {
      type: 'uuid',
      references: 'users(id)',
      onDelete: 'CASCADE',
      notNull: true,
    },
    kitchen_id: {
      type: 'uuid',
      references: 'kitchens(id)',
      notNull: true,
    },
    added_at: {
      type: 'timestamp',
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  // Create calendar_entries table
  pgm.createTable('calendar_entries', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      references: 'users(id)',
      onDelete: 'CASCADE',
      notNull: true,
    },
    meal_id: {
      type: 'uuid',
      references: 'meals(id)',
      notNull: true,
    },
    scheduled_date: {
      type: 'date',
      notNull: true,
    },
    notes: {
      type: 'text',
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  // Add constraints
  pgm.addConstraint('users', 'users_language_check', {
    check: "language IN ('en', 'ar')",
  });

  pgm.addConstraint('meals', 'meals_meal_type_check', {
    check: "meal_type IN ('breakfast', 'lunch', 'dinner')",
  });

  pgm.addConstraint('meal_ingredients', 'meal_ingredients_status_check', {
    check: "status IN ('mandatory', 'recommended', 'optional')",
  });

  // Add primary key constraints for relationship tables
  pgm.addConstraint('user_pantry', 'user_pantry_pkey', {
    primaryKey: ['user_id', 'ingredient_id'],
  });

  pgm.addConstraint('user_favorites', 'user_favorites_pkey', {
    primaryKey: ['user_id', 'meal_id'],
  });

  pgm.addConstraint('user_kitchen_preferences', 'user_kitchen_preferences_pkey', {
    primaryKey: ['user_id', 'kitchen_id'],
  });
};

exports.down = (pgm) => {
  // Drop tables in reverse order to handle foreign key dependencies
  pgm.dropTable('calendar_entries');
  pgm.dropTable('user_kitchen_preferences');
  pgm.dropTable('user_favorites');
  pgm.dropTable('user_pantry');
  pgm.dropTable('meal_ingredients');
  pgm.dropTable('meals');
  pgm.dropTable('ingredients');
  pgm.dropTable('users');
  pgm.dropTable('kitchens');
  
  // Drop extension
  pgm.dropExtension('uuid-ossp');
};