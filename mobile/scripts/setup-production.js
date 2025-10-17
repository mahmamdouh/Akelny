#!/usr/bin/env node

/**
 * Setup script for Akelny Mobile App Production Configuration
 * This script updates the mobile app configuration for production deployment
 */

const fs = require('fs');
const path = require('path');

const PRODUCTION_API_URL = 'https://akelny.nabd-co.com/api';
const DEV_API_URL = 'http://localhost:3000/api';

console.log('🔧 Setting up Akelny Mobile App for Production...');

// Update API client configuration
const updateApiClient = () => {
  const apiClientPath = path.join(__dirname, '../src/services/apiClient.ts');
  
  if (!fs.existsSync(apiClientPath)) {
    console.error('❌ API client file not found:', apiClientPath);
    return false;
  }

  let content = fs.readFileSync(apiClientPath, 'utf8');
  
  // Update the API base URL configuration
  const oldPattern = /const API_BASE_URL = __DEV__\s*\?\s*['"`][^'"`]*['"`]\s*:\s*['"`][^'"`]*['"`];?/;
  const newConfig = `const API_BASE_URL = __DEV__ 
  ? '${DEV_API_URL}'
  : '${PRODUCTION_API_URL}';`;

  if (oldPattern.test(content)) {
    content = content.replace(oldPattern, newConfig);
    fs.writeFileSync(apiClientPath, content);
    console.log('✅ Updated API client configuration');
    return true;
  } else {
    console.log('⚠️  API client configuration pattern not found, manual update required');
    console.log(`   Please update API_BASE_URL to: ${PRODUCTION_API_URL}`);
    return false;
  }
};

// Update app.json for production build
const updateAppConfig = () => {
  const appConfigPath = path.join(__dirname, '../app.json');
  
  if (!fs.existsSync(appConfigPath)) {
    console.error('❌ app.json file not found:', appConfigPath);
    return false;
  }

  try {
    const appConfig = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));
    
    // Update expo configuration for production
    if (appConfig.expo) {
      // Ensure proper app identifiers
      if (!appConfig.expo.slug) {
        appConfig.expo.slug = 'akelny';
      }
      
      if (!appConfig.expo.name) {
        appConfig.expo.name = 'Akelny';
      }

      // Update bundle identifiers
      if (!appConfig.expo.ios) {
        appConfig.expo.ios = {};
      }
      if (!appConfig.expo.ios.bundleIdentifier) {
        appConfig.expo.ios.bundleIdentifier = 'com.nabdco.akelny';
      }

      if (!appConfig.expo.android) {
        appConfig.expo.android = {};
      }
      if (!appConfig.expo.android.package) {
        appConfig.expo.android.package = 'com.nabdco.akelny';
      }

      // Add production-specific configurations
      appConfig.expo.extra = {
        ...appConfig.expo.extra,
        apiUrl: PRODUCTION_API_URL,
        environment: 'production'
      };

      fs.writeFileSync(appConfigPath, JSON.stringify(appConfig, null, 2));
      console.log('✅ Updated app.json configuration');
      return true;
    }
  } catch (error) {
    console.error('❌ Error updating app.json:', error.message);
    return false;
  }
  
  return false;
};

// Create production environment file
const createEnvFile = () => {
  const envPath = path.join(__dirname, '../.env.production');
  
  const envContent = `# Akelny Mobile App Production Environment
API_BASE_URL=${PRODUCTION_API_URL}
ENVIRONMENT=production
APP_VERSION=1.0.0
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.production file');
  return true;
};

// Validate package.json scripts
const validatePackageScripts = () => {
  const packagePath = path.join(__dirname, '../package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.error('❌ package.json file not found');
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const requiredScripts = {
      'start': 'expo start',
      'android': 'expo run:android',
      'ios': 'expo run:ios',
      'web': 'expo start --web',
      'test': 'jest',
      'lint': 'eslint . --ext .js,.jsx,.ts,.tsx'
    };

    let updated = false;
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    for (const [script, command] of Object.entries(requiredScripts)) {
      if (!packageJson.scripts[script]) {
        packageJson.scripts[script] = command;
        updated = true;
      }
    }

    if (updated) {
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Updated package.json scripts');
    } else {
      console.log('✅ Package.json scripts are up to date');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error validating package.json:', error.message);
    return false;
  }
};

// Main setup function
const main = () => {
  console.log('🚀 Starting production setup...\n');

  const tasks = [
    { name: 'Update API Client', fn: updateApiClient },
    { name: 'Update App Configuration', fn: updateAppConfig },
    { name: 'Create Environment File', fn: createEnvFile },
    { name: 'Validate Package Scripts', fn: validatePackageScripts }
  ];

  let successCount = 0;
  
  for (const task of tasks) {
    console.log(`📋 ${task.name}...`);
    if (task.fn()) {
      successCount++;
    }
    console.log('');
  }

  console.log('📊 Setup Summary:');
  console.log(`   ✅ Completed: ${successCount}/${tasks.length} tasks`);
  
  if (successCount === tasks.length) {
    console.log('\n🎉 Production setup completed successfully!');
    console.log('\n📱 Next Steps:');
    console.log('   1. Run: npm install');
    console.log('   2. Run: npx expo start');
    console.log('   3. Test on iOS: Press "i"');
    console.log('   4. Test on Android: Press "a"');
    console.log('   5. Build for production: npx expo build');
    console.log('\n🔗 Production API: ' + PRODUCTION_API_URL);
  } else {
    console.log('\n⚠️  Some tasks failed. Please check the errors above.');
    process.exit(1);
  }
};

// Run the setup
main();