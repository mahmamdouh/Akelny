-- Create core database tables for Akelny application
-- This file creates all the necessary tables and relationships

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create kitchens table first (referenced by users and meals)
CREATE TABLE IF NOT EXISTS kitchens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    country VARCHAR(2) NOT NULL, -- ISO country code
    primary_kitchen_id UUID REFERENCES kitchens(id),
    dietary_restrictions TEXT[],
    allergies TEXT[],
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(200) NOT NULL,
    name_ar VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    calories_per_100g INTEGER,
    protein_per_100g DECIMAL(5,2),
    carbs_per_100g DECIMAL(5,2),
    fat_per_100g DECIMAL(5,2),
    fiber_per_100g DECIMAL(5,2),
    sugar_per_100g DECIMAL(5,2),
    sodium_per_100g DECIMAL(5,2),
    is_approved BOOLEAN DEFAULT FALSE,
    user_created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create meals table
CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_en VARCHAR(200) NOT NULL,
    title_ar VARCHAR(200) NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    instructions_en TEXT NOT NULL,
    instructions_ar TEXT NOT NULL,
    meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    prep_time_min INTEGER,
    cook_time_min INTEGER,
    servings INTEGER DEFAULT 1,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    kitchen_id UUID NOT NULL REFERENCES kitchens(id),
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    image_url VARCHAR(500),
    is_public BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create meal_ingredients relationship table
CREATE TABLE IF NOT EXISTS meal_ingredients (
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id),
    quantity DECIMAL(10,2),
    unit VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'mandatory' CHECK (status IN ('mandatory', 'recommended', 'optional')),
    notes TEXT,
    PRIMARY KEY (meal_id, ingredient_id)
);

-- Create user_pantry relationship table
CREATE TABLE IF NOT EXISTS user_pantry (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id),
    quantity DECIMAL(10,2),
    unit VARCHAR(50),
    expiry_date DATE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, ingredient_id)
);

-- Create user_favorites relationship table
CREATE TABLE IF NOT EXISTS user_favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, meal_id)
);

-- Create user_kitchen_preferences relationship table
CREATE TABLE IF NOT EXISTS user_kitchen_preferences (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kitchen_id UUID NOT NULL REFERENCES kitchens(id),
    preference_level INTEGER DEFAULT 1 CHECK (preference_level BETWEEN 1 AND 5),
    PRIMARY KEY (user_id, kitchen_id)
);

-- Create calendar_entries table
CREATE TABLE IF NOT EXISTS calendar_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meal_id UUID NOT NULL REFERENCES meals(id),
    scheduled_date DATE NOT NULL,
    meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    servings INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default kitchens
INSERT INTO kitchens (name_en, name_ar, description_en, description_ar) VALUES
('Egyptian', 'مصري', 'Traditional Egyptian cuisine', 'المطبخ المصري التقليدي'),
('Gulf', 'خليجي', 'Gulf region cuisine', 'مطبخ دول الخليج'),
('Asian', 'آسيوي', 'Asian cuisine including Chinese, Japanese, Thai', 'المطبخ الآسيوي بما في ذلك الصيني والياباني والتايلاندي'),
('Indian', 'هندي', 'Indian and South Asian cuisine', 'المطبخ الهندي وجنوب آسيا'),
('European', 'أوروبي', 'European cuisine including Italian, French, Mediterranean', 'المطبخ الأوروبي بما في ذلك الإيطالي والفرنسي والمتوسطي'),
('Mexican', 'مكسيكي', 'Mexican and Latin American cuisine', 'المطبخ المكسيكي وأمريكا اللاتينية')
ON CONFLICT DO NOTHING;