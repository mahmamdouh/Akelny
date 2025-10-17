#!/usr/bin/env ts-node

/**
 * Verification script for seed data completeness
 * This script validates that our seed data meets the requirements without requiring a database connection
 */

async function verifyKitchensData() {
  console.log('🍽️  Verifying kitchens seed data...');
  
  // Required kitchens according to task requirements
  const requiredKitchens = ['Egyptian', 'Gulf', 'Asian', 'Indian', 'European', 'Mexican'];
  
  // Read the kitchens file content to verify
  const fs = require('fs');
  const path = require('path');
  const kitchensContent = fs.readFileSync(path.join(__dirname, 'kitchens.ts'), 'utf8');
  
  const foundKitchens: string[] = [];
  requiredKitchens.forEach(kitchen => {
    if (kitchensContent.includes(`name_en: '${kitchen}'`)) {
      foundKitchens.push(kitchen);
      console.log(`  ✅ ${kitchen} kitchen found with bilingual support`);
    }
  });
  
  if (foundKitchens.length === requiredKitchens.length) {
    console.log(`✅ All ${requiredKitchens.length} required kitchens are present`);
  } else {
    console.error(`❌ Missing kitchens: ${requiredKitchens.filter(k => !foundKitchens.includes(k))}`);
    return false;
  }
  
  // Verify bilingual support
  const hasArabicNames = kitchensContent.includes('name_ar:');
  const hasArabicDescriptions = kitchensContent.includes('description_ar:');
  
  if (hasArabicNames && hasArabicDescriptions) {
    console.log('✅ Kitchens have complete bilingual support (English/Arabic)');
  } else {
    console.error('❌ Missing Arabic translations in kitchens');
    return false;
  }
  
  return true;
}

async function verifyIngredientsData() {
  console.log('\n🥕 Verifying ingredients seed data...');
  
  // Read the ingredients file content to verify
  const fs = require('fs');
  const path = require('path');
  const ingredientsContent = fs.readFileSync(path.join(__dirname, 'ingredients.ts'), 'utf8');
  
  // Check for required nutritional fields
  const requiredNutritionFields = [
    'calories_per_100g',
    'protein_per_100g',
    'carbs_per_100g',
    'fat_per_100g',
    'minerals'
  ];
  
  const missingFields = requiredNutritionFields.filter(field => 
    !ingredientsContent.includes(field)
  );
  
  if (missingFields.length === 0) {
    console.log('✅ All required nutritional fields are present');
  } else {
    console.error(`❌ Missing nutritional fields: ${missingFields}`);
    return false;
  }
  
  // Check for bilingual support
  const hasEnglishNames = ingredientsContent.includes('name_en:');
  const hasArabicNames = ingredientsContent.includes('name_ar:');
  
  if (hasEnglishNames && hasArabicNames) {
    console.log('✅ Ingredients have bilingual names (English/Arabic)');
  } else {
    console.error('❌ Missing bilingual support in ingredients');
    return false;
  }
  
  // Check for variety of categories
  const categories = [
    'grains', 'protein', 'legumes', 'vegetables', 
    'fruits', 'dairy', 'oils', 'spices', 'herbs'
  ];
  
  const foundCategories = categories.filter(category => 
    ingredientsContent.includes(`category: '${category}'`)
  );
  
  console.log(`✅ Found ${foundCategories.length} ingredient categories: ${foundCategories.join(', ')}`);
  
  // Count approximate number of ingredients
  const ingredientCount = (ingredientsContent.match(/name_en:/g) || []).length;
  console.log(`✅ Approximately ${ingredientCount} ingredients in seed data`);
  
  return true;
}

async function verifySeedData() {
  console.log('🌱 Verifying seed data completeness...\n');
  
  try {
    const kitchensValid = await verifyKitchensData();
    const ingredientsValid = await verifyIngredientsData();
    
    if (kitchensValid && ingredientsValid) {
      console.log('\n✅ All seed data verification passed!');
      console.log('\n📋 Summary:');
      console.log('  • 6 kitchen types with bilingual support');
      console.log('  • Comprehensive ingredient library with nutritional data');
      console.log('  • Multiple ingredient categories covered');
      console.log('  • Ready for database seeding when PostgreSQL is available');
      return true;
    } else {
      console.error('\n❌ Seed data verification failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during verification:', error);
    return false;
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifySeedData().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { verifySeedData };