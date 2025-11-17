#!/bin/bash

# Backend API Testing Script
echo "🧪 Testing Akelny Backend API..."

API_URL="http://localhost:3001/api"
HEALTH_URL="http://localhost:3001/health"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local expected_code=$5
    local token=$6
    
    echo -n "Testing $name... "
    
    if [ -z "$data" ]; then
        if [ -z "$token" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$url")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$url" -H "Authorization: Bearer $token")
        fi
    else
        if [ -z "$token" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$url" \
                -H "Content-Type: application/json" \
                -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$url" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data")
        fi
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" == "$expected_code" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected $expected_code, got $http_code)"
        echo "Response: $body"
        ((FAILED++))
        return 1
    fi
}

echo "================================"
echo "  Akelny Backend API Tests"
echo "================================"
echo ""

# Test 1: Health Check
echo "📋 Basic Health Checks"
echo "----------------------"
test_endpoint "Health Check" "GET" "$HEALTH_URL" "" "200"
test_endpoint "API Info" "GET" "$API_URL" "" "200"
echo ""

# Test 2: Authentication
echo "🔐 Authentication Tests"
echo "----------------------"

# Register new user
TIMESTAMP=$(date +%s)
REGISTER_DATA='{
  "name": "Test User",
  "email": "test'$TIMESTAMP'@example.com",
  "password": "Test123!",
  "country": "EG",
  "language": "en"
}'

if test_endpoint "User Registration" "POST" "$API_URL/auth/register" "$REGISTER_DATA" "201"; then
    # Login
    LOGIN_DATA='{
      "email": "test'$TIMESTAMP'@example.com",
      "password": "Test123!"
    }'
    
    response=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "$LOGIN_DATA")
    
    TOKEN=$(echo $response | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$TOKEN" ]; then
        echo -e "Testing Login... ${GREEN}✓ PASSED${NC} (Token received)"
        ((PASSED++))
    else
        echo -e "Testing Login... ${RED}✗ FAILED${NC} (No token received)"
        ((FAILED++))
    fi
fi
echo ""

# Test 3: Protected Endpoints (if token exists)
if [ -n "$TOKEN" ]; then
    echo "🔒 Protected Endpoint Tests"
    echo "----------------------"
    test_endpoint "Get User Profile" "GET" "$API_URL/users/profile" "" "200" "$TOKEN"
    test_endpoint "Get Ingredients" "GET" "$API_URL/ingredients" "" "200" "$TOKEN"
    test_endpoint "Get Kitchens" "GET" "$API_URL/kitchens" "" "200" "$TOKEN"
    test_endpoint "Get Pantry" "GET" "$API_URL/pantry" "" "200" "$TOKEN"
    echo ""
fi

# Test 4: Public Endpoints
echo "🌐 Public Endpoint Tests"
echo "----------------------"
test_endpoint "Search Meals" "GET" "$API_URL/search/meals?query=chicken" "" "200"
test_endpoint "Browse Kitchens" "GET" "$API_URL/search/kitchens" "" "200"
echo ""

# Test 5: Error Handling
echo "⚠️  Error Handling Tests"
echo "----------------------"
test_endpoint "Invalid Login" "POST" "$API_URL/auth/login" '{"email":"invalid@test.com","password":"wrong"}' "401"
test_endpoint "Missing Auth Token" "GET" "$API_URL/users/profile" "" "401"
test_endpoint "Invalid Endpoint" "GET" "$API_URL/invalid-endpoint" "" "404"
echo ""

# Summary
echo "================================"
echo "  Test Summary"
echo "================================"
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi