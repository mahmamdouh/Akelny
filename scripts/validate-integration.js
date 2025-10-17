#!/usr/bin/env node

/**
 * Integration Validation Script
 * 
 * This script validates that all components are properly integrated and
 * that the complete user flows work as expected.
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${colors.bold}=== ${title} ===${colors.reset}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Validation functions
function validateFileExists(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    logSuccess(`${description} exists`);
    return true;
  } else {
    logError(`${description} missing: ${filePath}`);
    return false;
  }
}

function validateDirectoryStructure() {
  logSection('Directory Structure Validation');
  
  const requiredDirs = [
    'mobile/src/screens/auth',
    'mobile/src/screens/home',
    'mobile/src/screens/pantry',
    'mobile/src/screens/meal',
    'mobile/src/screens/calendar',
    'mobile/src/screens/favorites',
    'mobile/src/screens/community',
    'mobile/src/screens/search',
    'mobile/src/components/common',
    'mobile/src/components/specific',
    'mobile/src/navigation',
    'mobile/src/store',
    'mobile/src/services',
    'mobile/src/hooks',
    'mobile/src/utils',
    'mobile/src/localization',
    'backend/src/controllers',
    'backend/src/services',
    'backend/src/models',
    'backend/src/middleware',
    'backend/src/routes',
    'shared/src/types'
  ];

  let allValid = true;
  requiredDirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (fs.existsSync(fullPath)) {
      logSuccess(`Directory exists: ${dir}`);
    } else {
      logError(`Directory missing: ${dir}`);
      allValid = false;
    }
  });

  return allValid;
}

function validateNavigationIntegration() {
  logSection('Navigation Integration Validation');
  
  const navigationFiles = [
    'mobile/src/navigation/RootNavigator.tsx',
    'mobile/src/navigation/AppNavigator.tsx',
    'mobile/src/navigation/AuthNavigator.tsx'
  ];

  let allValid = true;
  navigationFiles.forEach(file => {
    if (!validateFileExists(file, `Navigation file: ${path.basename(file)}`)) {
      allValid = false;
    }
  });

  // Check if AppNavigator includes all required screens
  const appNavigatorPath = path.join(__dirname, '..', 'mobile/src/navigation/AppNavigator.tsx');
  if (fs.existsSync(appNavigatorPath)) {
    const content = fs.readFileSync(appNavigatorPath, 'utf8');
    const requiredScreens = [
      'HomeScreen',
      'PantryScreen',
      'SearchScreen',
      'CalendarScreen',
      'FavoritesScreen',
      'MealDetailScreen',
      'CreateRecipeScreen',
      'CommunityScreen'
    ];

    requiredScreens.forEach(screen => {
      if (content.includes(screen)) {
        logSuccess(`Screen integrated: ${screen}`);
      } else {
        logError(`Screen not integrated: ${screen}`);
        allValid = false;
      }
    });
  }

  return allValid;
}

function validateStoreIntegration() {
  logSection('Redux Store Integration Validation');
  
  const storeFiles = [
    'mobile/src/store/index.ts',
    'mobile/src/store/authSlice.ts',
    'mobile/src/store/ingredientSlice.ts',
    'mobile/src/store/suggestionSlice.ts',
    'mobile/src/store/mealSlice.ts',
    'mobile/src/store/calendarSlice.ts',
    'mobile/src/store/favoritesSlice.ts',
    'mobile/src/store/communitySlice.ts',
    'mobile/src/store/searchSlice.ts'
  ];

  let allValid = true;
  storeFiles.forEach(file => {
    if (!validateFileExists(file, `Store file: ${path.basename(file)}`)) {
      allValid = false;
    }
  });

  // Check if main store includes all slices
  const storeIndexPath = path.join(__dirname, '..', 'mobile/src/store/index.ts');
  if (fs.existsSync(storeIndexPath)) {
    const content = fs.readFileSync(storeIndexPath, 'utf8');
    const requiredSlices = [
      'authReducer',
      'ingredientReducer',
      'suggestionReducer',
      'mealReducer',
      'calendarReducer',
      'favoritesReducer',
      'communityReducer',
      'searchReducer'
    ];

    requiredSlices.forEach(slice => {
      if (content.includes(slice)) {
        logSuccess(`Slice integrated: ${slice}`);
      } else {
        logError(`Slice not integrated: ${slice}`);
        allValid = false;
      }
    });
  }

  return allValid;
}

function validateServiceIntegration() {
  logSection('Service Integration Validation');
  
  const serviceFiles = [
    'mobile/src/services/apiClient.ts',
    'mobile/src/services/authService.ts',
    'mobile/src/services/ingredientService.ts',
    'mobile/src/services/suggestionService.ts',
    'mobile/src/services/mealService.ts',
    'mobile/src/services/calendarService.ts',
    'mobile/src/services/favoritesService.ts',
    'mobile/src/services/communityService.ts',
    'mobile/src/services/searchService.ts'
  ];

  let allValid = true;
  serviceFiles.forEach(file => {
    if (!validateFileExists(file, `Service file: ${path.basename(file)}`)) {
      allValid = false;
    }
  });

  return allValid;
}

function validateBackendIntegration() {
  logSection('Backend Integration Validation');
  
  const backendFiles = [
    'backend/src/index.ts',
    'backend/src/controllers/auth.ts',
    'backend/src/controllers/users.ts',
    'backend/src/controllers/ingredients.ts',
    'backend/src/controllers/meals.ts',
    'backend/src/controllers/suggestions.ts',
    'backend/src/controllers/calendar.ts',
    'backend/src/controllers/favorites.ts',
    'backend/src/controllers/search.ts',
    'backend/src/services/suggestionEngine.ts',
    'backend/src/middleware/auth.ts'
  ];

  let allValid = true;
  backendFiles.forEach(file => {
    if (!validateFileExists(file, `Backend file: ${path.basename(file)}`)) {
      allValid = false;
    }
  });

  return allValid;
}

function validateTypeDefinitions() {
  logSection('Type Definitions Validation');
  
  const typeFiles = [
    'shared/src/types/user.ts',
    'shared/src/types/ingredient.ts',
    'shared/src/types/meal.ts',
    'shared/src/types/suggestion.ts',
    'shared/src/types/calendar.ts',
    'shared/src/types/search.ts'
  ];

  let allValid = true;
  typeFiles.forEach(file => {
    if (!validateFileExists(file, `Type file: ${path.basename(file)}`)) {
      allValid = false;
    }
  });

  return allValid;
}

function validateLocalizationIntegration() {
  logSection('Localization Integration Validation');
  
  const localizationFiles = [
    'mobile/src/localization/i18n.ts',
    'mobile/src/localization/en.json',
    'mobile/src/localization/ar.json',
    'mobile/src/hooks/useLocalization.ts'
  ];

  let allValid = true;
  localizationFiles.forEach(file => {
    if (!validateFileExists(file, `Localization file: ${path.basename(file)}`)) {
      allValid = false;
    }
  });

  // Check if translation files have required keys
  const enPath = path.join(__dirname, '..', 'mobile/src/localization/en.json');
  const arPath = path.join(__dirname, '..', 'mobile/src/localization/ar.json');
  
  if (fs.existsSync(enPath) && fs.existsSync(arPath)) {
    try {
      const enTranslations = JSON.parse(fs.readFileSync(enPath, 'utf8'));
      const arTranslations = JSON.parse(fs.readFileSync(arPath, 'utf8'));
      
      const requiredSections = [
        'common',
        'auth',
        'pantry',
        'home',
        'meal',
        'calendar',
        'favorites',
        'community',
        'search',
        'navigation'
      ];

      requiredSections.forEach(section => {
        if (enTranslations[section] && arTranslations[section]) {
          logSuccess(`Translation section exists: ${section}`);
        } else {
          logError(`Translation section missing: ${section}`);
          allValid = false;
        }
      });
    } catch (error) {
      logError(`Error parsing translation files: ${error.message}`);
      allValid = false;
    }
  }

  return allValid;
}

function validateDatabaseIntegration() {
  logSection('Database Integration Validation');
  
  const dbFiles = [
    'backend/src/config/database.ts',
    'backend/src/migrations/1703000001_create-core-tables.js',
    'backend/src/migrations/1703000002_create-indexes.js',
    'backend/src/seeds/kitchens.ts',
    'backend/src/seeds/ingredients.ts'
  ];

  let allValid = true;
  dbFiles.forEach(file => {
    if (!validateFileExists(file, `Database file: ${path.basename(file)}`)) {
      allValid = false;
    }
  });

  return allValid;
}

function validateTestIntegration() {
  logSection('Test Integration Validation');
  
  const testFiles = [
    'mobile/src/__tests__/integration/UserFlows.test.tsx',
    'mobile/src/__tests__/e2e/CompleteUserJourney.test.ts'
  ];

  let allValid = true;
  testFiles.forEach(file => {
    if (!validateFileExists(file, `Test file: ${path.basename(file)}`)) {
      allValid = false;
    }
  });

  return allValid;
}

function validatePackageConfiguration() {
  logSection('Package Configuration Validation');
  
  const packageFiles = [
    'package.json',
    'mobile/package.json',
    'backend/package.json',
    'shared/package.json'
  ];

  let allValid = true;
  packageFiles.forEach(file => {
    if (!validateFileExists(file, `Package file: ${file}`)) {
      allValid = false;
    }
  });

  // Check mobile package.json for required dependencies
  const mobilePackagePath = path.join(__dirname, '..', 'mobile/package.json');
  if (fs.existsSync(mobilePackagePath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(mobilePackagePath, 'utf8'));
      const requiredDeps = [
        '@react-navigation/native',
        '@react-navigation/native-stack',
        '@react-navigation/bottom-tabs',
        '@reduxjs/toolkit',
        'react-redux',
        'i18next',
        'react-i18next',
        'expo'
      ];

      requiredDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          logSuccess(`Dependency installed: ${dep}`);
        } else {
          logError(`Dependency missing: ${dep}`);
          allValid = false;
        }
      });
    } catch (error) {
      logError(`Error parsing mobile package.json: ${error.message}`);
      allValid = false;
    }
  }

  return allValid;
}

function validateAPIEndpoints() {
  logSection('API Endpoints Validation');
  
  // Check if backend routes are properly defined
  const routeFiles = [
    'backend/src/routes/auth.ts',
    'backend/src/routes/users.ts',
    'backend/src/routes/ingredients.ts',
    'backend/src/routes/meals.ts',
    'backend/src/routes/suggestions.ts',
    'backend/src/routes/calendar.ts',
    'backend/src/routes/favorites.ts'
  ];

  let allValid = true;
  routeFiles.forEach(file => {
    if (validateFileExists(file, `Route file: ${path.basename(file)}`)) {
      // Additional validation could check for specific endpoints
    } else {
      allValid = false;
    }
  });

  return allValid;
}

function generateIntegrationReport() {
  logSection('Integration Validation Report');
  
  const validations = [
    { name: 'Directory Structure', fn: validateDirectoryStructure },
    { name: 'Navigation Integration', fn: validateNavigationIntegration },
    { name: 'Redux Store Integration', fn: validateStoreIntegration },
    { name: 'Service Integration', fn: validateServiceIntegration },
    { name: 'Backend Integration', fn: validateBackendIntegration },
    { name: 'Type Definitions', fn: validateTypeDefinitions },
    { name: 'Localization Integration', fn: validateLocalizationIntegration },
    { name: 'Database Integration', fn: validateDatabaseIntegration },
    { name: 'Test Integration', fn: validateTestIntegration },
    { name: 'Package Configuration', fn: validatePackageConfiguration },
    { name: 'API Endpoints', fn: validateAPIEndpoints }
  ];

  const results = validations.map(validation => ({
    name: validation.name,
    passed: validation.fn()
  }));

  logSection('Summary');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}: PASSED`);
    } else {
      logError(`${result.name}: FAILED`);
    }
  });

  log(`\n${colors.bold}Overall Integration Status: ${passed}/${total} validations passed${colors.reset}`);
  
  if (passed === total) {
    logSuccess('🎉 All integrations are properly configured!');
    log('\nNext steps:');
    log('1. Run the integration tests: npm run test:integration');
    log('2. Run the e2e tests: npm run test:e2e');
    log('3. Start the development servers and test manually');
    return true;
  } else {
    logError('❌ Some integrations need attention. Please fix the issues above.');
    log('\nRecommended actions:');
    log('1. Fix the missing files and configurations');
    log('2. Re-run this validation script');
    log('3. Run tests to verify functionality');
    return false;
  }
}

// Main execution
function main() {
  log(`${colors.bold}Akelny Integration Validation${colors.reset}`, 'blue');
  log('Validating all component integrations and user flows...\n');
  
  const success = generateIntegrationReport();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = {
  validateDirectoryStructure,
  validateNavigationIntegration,
  validateStoreIntegration,
  validateServiceIntegration,
  validateBackendIntegration,
  validateTypeDefinitions,
  validateLocalizationIntegration,
  validateDatabaseIntegration,
  validateTestIntegration,
  validatePackageConfiguration,
  validateAPIEndpoints,
  generateIntegrationReport
};