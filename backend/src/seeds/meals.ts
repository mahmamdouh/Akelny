import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

interface MealIngredient {
  name: string;
  quantity: string;
}

interface NutritionValue {
  value: number;
  unit: string;
}

interface MealNutrition {
  [key: string]: NutritionValue;
}

interface MealData {
  number: number;
  english_name: string;
  arabic_name: string;
  cuisine: string;
  meal_type: string;
  servings: string;
  prep_time: string;
  ingredients: MealIngredient[];
  nutrition: MealNutrition;
  recipe_steps: string[];
  dietary_tags: string[];
}

export const seedMeals = async (pool: Pool) => {
  console.log('🍽️ Starting meals seeding...');

  try {
    // Read the meals JSON file
    const mealsFilePath = path.join(__dirname, '../../uploads/meals/meals.json');
    const mealsData: MealData[] = JSON.parse(fs.readFileSync(mealsFilePath, 'utf8'));

    console.log(`📊 Found ${mealsData.length} meals to seed`);

    // Clear existing data
    await pool.query('DELETE FROM meal_ingredients');
    await pool.query('DELETE FROM meals');
    console.log('🧹 Cleared existing meals data');

    let processedCount = 0;
    const batchSize = 50;

    for (let i = 0; i < mealsData.length; i += batchSize) {
      const batch = mealsData.slice(i, i + batchSize);
      
      for (const meal of batch) {
        try {
          // Insert meal
          const mealResult = await pool.query(`
            INSERT INTO meals (
              title_en, title_ar, description_en, description_ar,
              cuisine, meal_type, servings, prep_time_minutes,
              instructions_en, instructions_ar,
              calories_per_serving, protein_per_serving, fat_per_serving, carbs_per_serving,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
            RETURNING id
          `, [
            meal.english_name,
            meal.arabic_name,
            `${meal.cuisine} ${meal.meal_type}`, // description_en
            `${meal.cuisine} ${meal.meal_type}`, // description_ar (simplified)
            meal.cuisine,
            meal.meal_type,
            parseInt(meal.servings) || 4,
            parseInt(meal.prep_time.replace(/\D/g, '')) || 30, // Extract minutes
            meal.recipe_steps.join('\n'),
            meal.recipe_steps.join('\n'), // Arabic instructions (simplified)
            meal.nutrition.Calories?.value || 0,
            meal.nutrition.Protein?.value || 0,
            meal.nutrition.Fat?.value || 0,
            meal.nutrition.Carbs?.value || 0
          ]);

          const mealId = mealResult.rows[0].id;

          // Insert ingredients
          for (const ingredient of meal.ingredients) {
            // First, try to find existing ingredient or create new one
            let ingredientResult = await pool.query(
              'SELECT id FROM ingredients WHERE name_en ILIKE $1',
              [ingredient.name]
            );

            let ingredientId;
            if (ingredientResult.rows.length === 0) {
              // Create new ingredient
              const newIngredientResult = await pool.query(`
                INSERT INTO ingredients (
                  name_en, name_ar, category, created_at, updated_at
                ) VALUES ($1, $2, $3, NOW(), NOW())
                RETURNING id
              `, [
                ingredient.name,
                ingredient.name, // Simplified - use English name for Arabic
                'general' // Default category
              ]);
              ingredientId = newIngredientResult.rows[0].id;
            } else {
              ingredientId = ingredientResult.rows[0].id;
            }

            // Insert meal-ingredient relationship
            await pool.query(`
              INSERT INTO meal_ingredients (
                meal_id, ingredient_id, quantity, unit, status, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            `, [
              mealId,
              ingredientId,
              ingredient.quantity.replace(/[^\d.]/g, '') || '1', // Extract numeric quantity
              ingredient.quantity.replace(/[\d.\s]/g, '') || 'piece', // Extract unit
              'mandatory' // Default status
            ]);
          }

          processedCount++;
          if (processedCount % 100 === 0) {
            console.log(`📈 Processed ${processedCount}/${mealsData.length} meals`);
          }

        } catch (error) {
          console.error(`❌ Error processing meal ${meal.english_name}:`, error);
          continue; // Skip this meal and continue with others
        }
      }
    }

    console.log(`✅ Successfully seeded ${processedCount} meals`);

    // Update sequences
    await pool.query(`
      SELECT setval('meals_id_seq', (SELECT MAX(id) FROM meals));
      SELECT setval('ingredients_id_seq', (SELECT MAX(id) FROM ingredients));
      SELECT setval('meal_ingredients_id_seq', (SELECT MAX(id) FROM meal_ingredients));
    `);

    console.log('🔄 Updated database sequences');

  } catch (error) {
    console.error('❌ Error seeding meals:', error);
    throw error;
  }
};

// Run seeding if called directly
if (require.main === module) {
  const { Pool } = require('pg');
  
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'akelny',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  });

  seedMeals(pool)
    .then(() => {
      console.log('🎉 Meals seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Meals seeding failed:', error);
      process.exit(1);
    });
}