#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Akelny development environment...\n');

// Function to run commands
const runCommand = (command, cwd = process.cwd()) => {
  try {
    console.log(`📦 Running: ${command}`);
    execSync(command, { stdio: 'inherit', cwd });
    console.log('✅ Success\n');
  } catch (error) {
    console.error(`❌ Failed to run: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
};

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 18) {
  console.error('❌ Node.js version 18 or higher is required');
  console.error(`Current version: ${nodeVersion}`);
  process.exit(1);
}

console.log(`✅ Node.js version: ${nodeVersion}\n`);

// Install root dependencies
console.log('📦 Installing root dependencies...');
runCommand('npm install');

// Install mobile dependencies
console.log('📱 Installing mobile app dependencies...');
runCommand('npm install', path.join(process.cwd(), 'mobile'));

// Install backend dependencies
console.log('🔧 Installing backend dependencies...');
runCommand('npm install', path.join(process.cwd(), 'backend'));

// Install shared dependencies
console.log('📚 Installing shared package dependencies...');
runCommand('npm install', path.join(process.cwd(), 'shared'));

// Build shared package
console.log('🔨 Building shared package...');
runCommand('npm run build', path.join(process.cwd(), 'shared'));

// Create .env file if it doesn't exist
const envPath = path.join(process.cwd(), 'backend', '.env');
const envExamplePath = path.join(process.cwd(), 'backend', '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log('📝 Creating .env file from example...');
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ .env file created. Please update it with your configuration.\n');
}

console.log('🎉 Setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Update backend/.env with your database and Redis configuration');
console.log('2. Make sure PostgreSQL and Redis are running');
console.log('3. Run database migrations: cd backend && npm run migrate');
console.log('4. Start development servers: npm run dev');
console.log('\n🔗 Useful commands:');
console.log('- npm run dev          # Start both mobile and backend');
console.log('- npm run dev:mobile   # Start mobile app only');
console.log('- npm run dev:backend  # Start backend only');
console.log('- npm test             # Run all tests');
console.log('- npm run lint         # Run linting');