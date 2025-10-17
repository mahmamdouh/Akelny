import { pool } from '../config/database';

interface Ingredient {
  name_en: string;
  name_ar: string;
  category: string;
  default_unit: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  minerals: {
    calcium?: number;
    iron?: number;
    magnesium?: number;
    phosphorus?: number;
    potassium?: number;
    sodium?: number;
    zinc?: number;
    vitamin_c?: number;
    vitamin_a?: number;
    folate?: number;
  };
}

const ingredientsData: Ingredient[] = [
  // Grains and Cereals
  {
    name_en: 'Rice',
    name_ar: 'أرز',
    category: 'grains',
    default_unit: 'cup',
    calories_per_100g: 130,
    protein_per_100g: 2.7,
    carbs_per_100g: 28,
    fat_per_100g: 0.3,
    minerals: {
      magnesium: 25,
      phosphorus: 68,
      potassium: 55,
      sodium: 1
    }
  },
  {
    name_en: 'Wheat Flour',
    name_ar: 'دقيق القمح',
    category: 'grains',
    default_unit: 'cup',
    calories_per_100g: 364,
    protein_per_100g: 10.3,
    carbs_per_100g: 76,
    fat_per_100g: 1,
    minerals: {
      iron: 1.2,
      magnesium: 22,
      phosphorus: 108,
      potassium: 107
    }
  },
  {
    name_en: 'Bulgur',
    name_ar: 'برغل',
    category: 'grains',
    default_unit: 'cup',
    calories_per_100g: 342,
    protein_per_100g: 12.3,
    carbs_per_100g: 76,
    fat_per_100g: 1.3,
    minerals: {
      iron: 2.5,
      magnesium: 164,
      phosphorus: 300,
      potassium: 410
    }
  },

  // Proteins - Meat
  {
    name_en: 'Chicken Breast',
    name_ar: 'صدر دجاج',
    category: 'protein',
    default_unit: 'piece',
    calories_per_100g: 165,
    protein_per_100g: 31,
    carbs_per_100g: 0,
    fat_per_100g: 3.6,
    minerals: {
      phosphorus: 196,
      potassium: 256,
      sodium: 74
    }
  },
  {
    name_en: 'Ground Beef',
    name_ar: 'لحم بقري مفروم',
    category: 'protein',
    default_unit: 'gram',
    calories_per_100g: 250,
    protein_per_100g: 26,
    carbs_per_100g: 0,
    fat_per_100g: 15,
    minerals: {
      iron: 2.6,
      zinc: 6.3,
      phosphorus: 198,
      potassium: 318
    }
  },
  {
    name_en: 'Lamb',
    name_ar: 'لحم خروف',
    category: 'protein',
    default_unit: 'gram',
    calories_per_100g: 294,
    protein_per_100g: 25,
    carbs_per_100g: 0,
    fat_per_100g: 21,
    minerals: {
      iron: 1.9,
      zinc: 4.5,
      phosphorus: 188,
      potassium: 310
    }
  },

  // Proteins - Seafood
  {
    name_en: 'Salmon',
    name_ar: 'سلمون',
    category: 'protein',
    default_unit: 'piece',
    calories_per_100g: 208,
    protein_per_100g: 25,
    carbs_per_100g: 0,
    fat_per_100g: 12,
    minerals: {
      phosphorus: 200,
      potassium: 363,
      sodium: 59
    }
  },
  {
    name_en: 'Shrimp',
    name_ar: 'جمبري',
    category: 'protein',
    default_unit: 'piece',
    calories_per_100g: 99,
    protein_per_100g: 24,
    carbs_per_100g: 0.2,
    fat_per_100g: 0.3,
    minerals: {
      calcium: 70,
      iron: 0.5,
      phosphorus: 237,
      potassium: 259
    }
  },

  // Proteins - Legumes
  {
    name_en: 'Lentils',
    name_ar: 'عدس',
    category: 'legumes',
    default_unit: 'cup',
    calories_per_100g: 116,
    protein_per_100g: 9,
    carbs_per_100g: 20,
    fat_per_100g: 0.4,
    minerals: {
      iron: 3.3,
      magnesium: 36,
      phosphorus: 180,
      potassium: 369,
      folate: 181
    }
  },
  {
    name_en: 'Chickpeas',
    name_ar: 'حمص',
    category: 'legumes',
    default_unit: 'cup',
    calories_per_100g: 164,
    protein_per_100g: 8.9,
    carbs_per_100g: 27,
    fat_per_100g: 2.6,
    minerals: {
      iron: 2.9,
      magnesium: 48,
      phosphorus: 168,
      potassium: 291,
      folate: 172
    }
  },
  {
    name_en: 'Black Beans',
    name_ar: 'فاصوليا سوداء',
    category: 'legumes',
    default_unit: 'cup',
    calories_per_100g: 132,
    protein_per_100g: 8.9,
    carbs_per_100g: 23,
    fat_per_100g: 0.5,
    minerals: {
      iron: 2.1,
      magnesium: 70,
      phosphorus: 140,
      potassium: 355,
      folate: 149
    }
  },

  // Vegetables - Leafy Greens
  {
    name_en: 'Spinach',
    name_ar: 'سبانخ',
    category: 'vegetables',
    default_unit: 'cup',
    calories_per_100g: 23,
    protein_per_100g: 2.9,
    carbs_per_100g: 3.6,
    fat_per_100g: 0.4,
    minerals: {
      calcium: 99,
      iron: 2.7,
      magnesium: 79,
      potassium: 558,
      vitamin_c: 28,
      vitamin_a: 469,
      folate: 194
    }
  },
  {
    name_en: 'Lettuce',
    name_ar: 'خس',
    category: 'vegetables',
    default_unit: 'cup',
    calories_per_100g: 15,
    protein_per_100g: 1.4,
    carbs_per_100g: 2.9,
    fat_per_100g: 0.2,
    minerals: {
      calcium: 36,
      iron: 0.9,
      potassium: 194,
      vitamin_c: 9,
      vitamin_a: 166,
      folate: 38
    }
  },

  // Vegetables - Root Vegetables
  {
    name_en: 'Onion',
    name_ar: 'بصل',
    category: 'vegetables',
    default_unit: 'piece',
    calories_per_100g: 40,
    protein_per_100g: 1.1,
    carbs_per_100g: 9.3,
    fat_per_100g: 0.1,
    minerals: {
      calcium: 23,
      phosphorus: 29,
      potassium: 146,
      vitamin_c: 7
    }
  },
  {
    name_en: 'Garlic',
    name_ar: 'ثوم',
    category: 'vegetables',
    default_unit: 'clove',
    calories_per_100g: 149,
    protein_per_100g: 6.4,
    carbs_per_100g: 33,
    fat_per_100g: 0.5,
    minerals: {
      calcium: 181,
      iron: 1.7,
      magnesium: 25,
      phosphorus: 153,
      potassium: 401,
      vitamin_c: 31
    }
  },
  {
    name_en: 'Carrot',
    name_ar: 'جزر',
    category: 'vegetables',
    default_unit: 'piece',
    calories_per_100g: 41,
    protein_per_100g: 0.9,
    carbs_per_100g: 10,
    fat_per_100g: 0.2,
    minerals: {
      calcium: 33,
      iron: 0.3,
      magnesium: 12,
      potassium: 320,
      vitamin_c: 6,
      vitamin_a: 835
    }
  },
  {
    name_en: 'Potato',
    name_ar: 'بطاطس',
    category: 'vegetables',
    default_unit: 'piece',
    calories_per_100g: 77,
    protein_per_100g: 2,
    carbs_per_100g: 17,
    fat_per_100g: 0.1,
    minerals: {
      calcium: 12,
      iron: 0.8,
      magnesium: 23,
      phosphorus: 57,
      potassium: 425,
      vitamin_c: 20
    }
  },

  // Vegetables - Other
  {
    name_en: 'Tomato',
    name_ar: 'طماطم',
    category: 'vegetables',
    default_unit: 'piece',
    calories_per_100g: 18,
    protein_per_100g: 0.9,
    carbs_per_100g: 3.9,
    fat_per_100g: 0.2,
    minerals: {
      calcium: 10,
      iron: 0.3,
      magnesium: 11,
      phosphorus: 24,
      potassium: 237,
      vitamin_c: 14,
      vitamin_a: 42,
      folate: 15
    }
  },
  {
    name_en: 'Bell Pepper',
    name_ar: 'فلفل حلو',
    category: 'vegetables',
    default_unit: 'piece',
    calories_per_100g: 31,
    protein_per_100g: 1,
    carbs_per_100g: 7,
    fat_per_100g: 0.3,
    minerals: {
      calcium: 7,
      iron: 0.4,
      magnesium: 12,
      phosphorus: 26,
      potassium: 211,
      vitamin_c: 128,
      vitamin_a: 157
    }
  },
  {
    name_en: 'Cucumber',
    name_ar: 'خيار',
    category: 'vegetables',
    default_unit: 'piece',
    calories_per_100g: 16,
    protein_per_100g: 0.7,
    carbs_per_100g: 4,
    fat_per_100g: 0.1,
    minerals: {
      calcium: 16,
      iron: 0.3,
      magnesium: 13,
      phosphorus: 24,
      potassium: 147,
      vitamin_c: 3
    }
  },

  // Fruits
  {
    name_en: 'Lemon',
    name_ar: 'ليمون',
    category: 'fruits',
    default_unit: 'piece',
    calories_per_100g: 29,
    protein_per_100g: 1.1,
    carbs_per_100g: 9,
    fat_per_100g: 0.3,
    minerals: {
      calcium: 26,
      iron: 0.6,
      magnesium: 8,
      phosphorus: 16,
      potassium: 138,
      vitamin_c: 53
    }
  },
  {
    name_en: 'Apple',
    name_ar: 'تفاح',
    category: 'fruits',
    default_unit: 'piece',
    calories_per_100g: 52,
    protein_per_100g: 0.3,
    carbs_per_100g: 14,
    fat_per_100g: 0.2,
    minerals: {
      calcium: 6,
      iron: 0.1,
      magnesium: 5,
      phosphorus: 11,
      potassium: 107,
      vitamin_c: 5
    }
  },

  // Dairy
  {
    name_en: 'Milk',
    name_ar: 'حليب',
    category: 'dairy',
    default_unit: 'cup',
    calories_per_100g: 42,
    protein_per_100g: 3.4,
    carbs_per_100g: 5,
    fat_per_100g: 1,
    minerals: {
      calcium: 113,
      magnesium: 10,
      phosphorus: 84,
      potassium: 132,
      sodium: 40
    }
  },
  {
    name_en: 'Yogurt',
    name_ar: 'زبادي',
    category: 'dairy',
    default_unit: 'cup',
    calories_per_100g: 59,
    protein_per_100g: 10,
    carbs_per_100g: 3.6,
    fat_per_100g: 0.4,
    minerals: {
      calcium: 110,
      magnesium: 11,
      phosphorus: 135,
      potassium: 141,
      sodium: 36
    }
  },
  {
    name_en: 'Cheese',
    name_ar: 'جبن',
    category: 'dairy',
    default_unit: 'slice',
    calories_per_100g: 113,
    protein_per_100g: 25,
    carbs_per_100g: 4,
    fat_per_100g: 0.3,
    minerals: {
      calcium: 83,
      magnesium: 8,
      phosphorus: 135,
      potassium: 104,
      sodium: 373
    }
  },

  // Oils and Fats
  {
    name_en: 'Olive Oil',
    name_ar: 'زيت زيتون',
    category: 'oils',
    default_unit: 'tablespoon',
    calories_per_100g: 884,
    protein_per_100g: 0,
    carbs_per_100g: 0,
    fat_per_100g: 100,
    minerals: {
      vitamin_a: 60
    }
  },
  {
    name_en: 'Butter',
    name_ar: 'زبدة',
    category: 'oils',
    default_unit: 'tablespoon',
    calories_per_100g: 717,
    protein_per_100g: 0.9,
    carbs_per_100g: 0.1,
    fat_per_100g: 81,
    minerals: {
      calcium: 24,
      phosphorus: 24,
      potassium: 24,
      sodium: 11,
      vitamin_a: 684
    }
  },

  // Spices and Herbs
  {
    name_en: 'Salt',
    name_ar: 'ملح',
    category: 'spices',
    default_unit: 'teaspoon',
    calories_per_100g: 0,
    protein_per_100g: 0,
    carbs_per_100g: 0,
    fat_per_100g: 0,
    minerals: {
      sodium: 38758
    }
  },
  {
    name_en: 'Black Pepper',
    name_ar: 'فلفل أسود',
    category: 'spices',
    default_unit: 'teaspoon',
    calories_per_100g: 251,
    protein_per_100g: 10.4,
    carbs_per_100g: 64,
    fat_per_100g: 3.3,
    minerals: {
      calcium: 443,
      iron: 9.7,
      magnesium: 171,
      phosphorus: 158,
      potassium: 1329
    }
  },
  {
    name_en: 'Cumin',
    name_ar: 'كمون',
    category: 'spices',
    default_unit: 'teaspoon',
    calories_per_100g: 375,
    protein_per_100g: 18,
    carbs_per_100g: 44,
    fat_per_100g: 22,
    minerals: {
      calcium: 931,
      iron: 66,
      magnesium: 366,
      phosphorus: 499,
      potassium: 1788
    }
  },
  {
    name_en: 'Coriander',
    name_ar: 'كزبرة',
    category: 'spices',
    default_unit: 'teaspoon',
    calories_per_100g: 298,
    protein_per_100g: 12,
    carbs_per_100g: 55,
    fat_per_100g: 17,
    minerals: {
      calcium: 709,
      iron: 16,
      magnesium: 330,
      phosphorus: 409,
      potassium: 1267,
      vitamin_c: 21
    }
  },
  {
    name_en: 'Parsley',
    name_ar: 'بقدونس',
    category: 'herbs',
    default_unit: 'cup',
    calories_per_100g: 36,
    protein_per_100g: 3,
    carbs_per_100g: 6,
    fat_per_100g: 0.8,
    minerals: {
      calcium: 138,
      iron: 6.2,
      magnesium: 50,
      phosphorus: 58,
      potassium: 554,
      vitamin_c: 133,
      vitamin_a: 421,
      folate: 152
    }
  }
];

export async function seedIngredients(): Promise<void> {
  const client = await pool.connect();
  
  try {
    console.log('🥕 Seeding ingredients...');
    
    // Check if ingredients already exist
    const existingIngredients = await client.query('SELECT COUNT(*) FROM ingredients');
    const count = parseInt(existingIngredients.rows[0].count);
    
    if (count > 0) {
      console.log(`ℹ️  Found ${count} existing ingredients, skipping ingredient seeding`);
      return;
    }

    // Insert ingredients
    for (const ingredient of ingredientsData) {
      await client.query(`
        INSERT INTO ingredients (
          name_en, name_ar, category, default_unit,
          calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
          minerals, is_approved
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
      `, [
        ingredient.name_en,
        ingredient.name_ar,
        ingredient.category,
        ingredient.default_unit,
        ingredient.calories_per_100g,
        ingredient.protein_per_100g,
        ingredient.carbs_per_100g,
        ingredient.fat_per_100g,
        JSON.stringify(ingredient.minerals)
      ]);
    }

    console.log(`✅ Successfully seeded ${ingredientsData.length} ingredients`);
  } catch (error) {
    console.error('❌ Error seeding ingredients:', error);
    throw error;
  } finally {
    client.release();
  }
}