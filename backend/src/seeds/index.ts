import { pool } from '../config/database';
import { seedKitchens } from './kitchens';
import { seedIngredients } from './ingredients';

async function runSeeds() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Test database connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection established');

    // Run seeds in order (kitchens first, then ingredients)
    await seedKitchens();
    await seedIngredients();

    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seeds if this file is executed directly
if (require.main === module) {
  runSeeds();
}

export { runSeeds };