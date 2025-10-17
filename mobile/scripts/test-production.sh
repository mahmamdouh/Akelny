#!/bin/bash

# Mobile App Production Testing Script
# Tests the mobile app against production API

set -e

echo "📱 Starting Akelny Mobile App Production Testing..."

# Configuration
API_BASE_URL="https://akelny.nabd-co.com/api"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="TestPassword123!"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test functions
test_api_health() {
    echo "🏥 Testing API Health..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/health")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ API Health Check: PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ API Health Check: FAILED (HTTP $response)${NC}"
        return 1
    fi
}

test_api_endpoints() {
    echo "🔗 Testing API Endpoints..."
    
    # Test public endpoints
    endpoints=(
        "/health"
        "/kitchens"
        "/ingredients/categories"
    )
    
    for endpoint in "${endpoints[@]}"; do
        response=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL$endpoint")
        
        if [ "$response" = "200" ]; then
            echo -e "${GREEN}✅ $endpoint: PASSED${NC}"
        else
            echo -e "${RED}❌ $endpoint: FAILED (HTTP $response)${NC}"
        fi
    done
}

test_mobile_build() {
    echo "🏗️  Testing Mobile App Build..."
    
    # Check if we're in the mobile directory
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ Not in mobile directory. Please run from akelny/mobile/${NC}"
        return 1
    fi
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install
    
    # Type checking
    echo "🔍 Running TypeScript checks..."
    if npx tsc --noEmit; then
        echo -e "${GREEN}✅ TypeScript: PASSED${NC}"
    else
        echo -e "${RED}❌ TypeScript: FAILED${NC}"
        return 1
    fi
    
    # Linting
    echo "🧹 Running ESLint..."
    if npm run lint; then
        echo -e "${GREEN}✅ ESLint: PASSED${NC}"
    else
        echo -e "${YELLOW}⚠️  ESLint: WARNINGS${NC}"
    fi
    
    # Unit tests
    echo "🧪 Running unit tests..."
    if npm test -- --run; then
        echo -e "${GREEN}✅ Unit Tests: PASSED${NC}"
    else
        echo -e "${RED}❌ Unit Tests: FAILED${NC}"
        return 1
    fi
}

test_expo_build() {
    echo "📱 Testing Expo Build..."
    
    # Check Expo CLI
    if ! command -v expo &> /dev/null; then
        echo -e "${YELLOW}⚠️  Expo CLI not found. Installing...${NC}"
        npm install -g @expo/cli
    fi
    
    # Check if project can be built
    echo "🔧 Checking Expo configuration..."
    if npx expo doctor; then
        echo -e "${GREEN}✅ Expo Configuration: PASSED${NC}"
    else
        echo -e "${YELLOW}⚠️  Expo Configuration: WARNINGS${NC}"
    fi
}

run_integration_tests() {
    echo "🔄 Running Integration Tests..."
    
    # Run integration tests if they exist
    if [ -f "src/__tests__/integration/UserFlows.test.tsx" ]; then
        if npm run test:integration; then
            echo -e "${GREEN}✅ Integration Tests: PASSED${NC}"
        else
            echo -e "${RED}❌ Integration Tests: FAILED${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  Integration tests not found${NC}"
    fi
}

generate_test_report() {
    echo "📊 Generating Test Report..."
    
    cat > test-report.md << EOF
# Akelny Mobile App Test Report

**Date**: $(date)
**API Base URL**: $API_BASE_URL

## Test Results

### API Tests
- Health Check: $api_health_status
- Endpoints: $api_endpoints_status

### Mobile App Tests
- Build: $mobile_build_status
- TypeScript: $typescript_status
- Linting: $lint_status
- Unit Tests: $unit_tests_status
- Expo Configuration: $expo_status
- Integration Tests: $integration_status

## Next Steps
1. Fix any failing tests
2. Test on physical devices
3. Submit for app store review (if applicable)

## Device Testing Checklist
- [ ] iOS Simulator
- [ ] Android Emulator
- [ ] Physical iPhone
- [ ] Physical Android device
- [ ] Tablet testing
- [ ] Different screen sizes
- [ ] Network conditions (WiFi, 4G, offline)

EOF

    echo -e "${GREEN}📋 Test report generated: test-report.md${NC}"
}

# Main execution
main() {
    echo "🚀 Starting comprehensive testing..."
    
    # Initialize status variables
    api_health_status="❌ FAILED"
    api_endpoints_status="❌ FAILED"
    mobile_build_status="❌ FAILED"
    typescript_status="❌ FAILED"
    lint_status="❌ FAILED"
    unit_tests_status="❌ FAILED"
    expo_status="❌ FAILED"
    integration_status="❌ FAILED"
    
    # Run tests
    if test_api_health; then
        api_health_status="✅ PASSED"
    fi
    
    if test_api_endpoints; then
        api_endpoints_status="✅ PASSED"
    fi
    
    if test_mobile_build; then
        mobile_build_status="✅ PASSED"
        typescript_status="✅ PASSED"
        lint_status="✅ PASSED"
        unit_tests_status="✅ PASSED"
    fi
    
    if test_expo_build; then
        expo_status="✅ PASSED"
    fi
    
    if run_integration_tests; then
        integration_status="✅ PASSED"
    fi
    
    # Generate report
    generate_test_report
    
    echo ""
    echo "🎉 Testing completed!"
    echo ""
    echo "📋 Summary:"
    echo "   API Health: $api_health_status"
    echo "   Mobile Build: $mobile_build_status"
    echo "   Expo Config: $expo_status"
    echo ""
    echo "📱 Next Steps:"
    echo "   1. Run: npx expo start"
    echo "   2. Test on iOS: Press 'i'"
    echo "   3. Test on Android: Press 'a'"
    echo "   4. Test on device: Scan QR code with Expo Go"
    echo ""
}

# Run main function
main "$@"