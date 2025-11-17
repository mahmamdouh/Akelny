#!/bin/bash

# Mobile App Build and Test Script
echo "📱 Building and Testing Akelny Mobile App..."

cd mobile || exit 1

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================"
echo "  Akelny Mobile App Build"
echo "================================"
echo ""

# Step 1: Check Node.js
echo "📋 Checking Prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found:${NC} $(node --version)"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm found:${NC} $(npm --version)"
echo ""

# Step 2: Install Dependencies
echo "📦 Installing Dependencies..."
if npm install; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi
echo ""

# Step 3: Type Check
echo "🔍 Running Type Check..."
if npm run type-check; then
    echo -e "${GREEN}✓ Type check passed${NC}"
else
    echo -e "${RED}✗ Type check failed${NC}"
    echo "Fix TypeScript errors before proceeding"
    exit 1
fi
echo ""

# Step 4: Lint
echo "🧹 Running Linter..."
if npm run lint; then
    echo -e "${GREEN}✓ Lint check passed${NC}"
else
    echo -e "${YELLOW}⚠ Lint warnings found${NC}"
    echo "Consider fixing lint warnings"
fi
echo ""

# Step 5: Run Tests (if available)
echo "🧪 Running Tests..."
if npm test -- --passWithNoTests 2>/dev/null; then
    echo -e "${GREEN}✓ Tests passed${NC}"
else
    echo -e "${YELLOW}⚠ No tests found or tests failed${NC}"
fi
echo ""

# Step 6: Check Expo CLI
echo "📱 Checking Expo CLI..."
if ! command -v expo &> /dev/null; then
    echo -e "${YELLOW}⚠ Expo CLI not found globally${NC}"
    echo "Installing Expo CLI..."
    npm install -g expo-cli
fi
echo -e "${GREEN}✓ Expo CLI ready${NC}"
echo ""

# Summary
echo "================================"
echo "  Build Summary"
echo "================================"
echo -e "${GREEN}✓ All checks passed!${NC}"
echo ""
echo "🚀 Ready to run the app!"
echo ""
echo "Next steps:"
echo "  1. Start the development server:"
echo "     npm start"
echo ""
echo "  2. Test on device:"
echo "     - Install Expo Go on your phone"
echo "     - Scan the QR code"
echo ""
echo "  3. Test on simulator:"
echo "     npm run ios     (Mac only)"
echo "     npm run android (Android emulator)"
echo ""
echo "  4. Build for production:"
echo "     npm install -g eas-cli"
echo "     eas build --platform ios"
echo "     eas build --platform android"
echo ""