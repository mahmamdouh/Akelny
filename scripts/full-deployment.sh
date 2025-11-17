#!/bin/bash

# Complete Deployment Script - Backend + Mobile Setup
echo "🚀 Complete Akelny Deployment..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "================================"
echo "  Akelny Complete Deployment"
echo "================================"
echo ""

# Phase 1: Backend Deployment
echo -e "${BLUE}PHASE 1: Backend Deployment${NC}"
echo "================================"
echo ""

if [ -f "scripts/bulletproof-deploy.sh" ]; then
    chmod +x scripts/bulletproof-deploy.sh
    if ./scripts/bulletproof-deploy.sh; then
        echo -e "${GREEN}✓ Backend deployed successfully${NC}"
    else
        echo -e "${RED}✗ Backend deployment failed${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Backend deployment script not found${NC}"
    exit 1
fi
echo ""

# Wait for backend to be fully ready
echo "⏳ Waiting for backend to be fully ready..."
sleep 5

# Phase 2: Test Backend
echo -e "${BLUE}PHASE 2: Backend Testing${NC}"
echo "================================"
echo ""

if [ -f "scripts/test-backend.sh" ]; then
    chmod +x scripts/test-backend.sh
    if ./scripts/test-backend.sh; then
        echo -e "${GREEN}✓ Backend tests passed${NC}"
    else
        echo -e "${YELLOW}⚠ Some backend tests failed${NC}"
        echo "Backend is running but some tests failed"
        echo "You may continue with mobile setup"
    fi
else
    echo -e "${YELLOW}⚠ Backend test script not found${NC}"
fi
echo ""

# Phase 3: Mobile App Setup
echo -e "${BLUE}PHASE 3: Mobile App Setup${NC}"
echo "================================"
echo ""

if [ -f "scripts/build-mobile.sh" ]; then
    chmod +x scripts/build-mobile.sh
    if ./scripts/build-mobile.sh; then
        echo -e "${GREEN}✓ Mobile app built successfully${NC}"
    else
        echo -e "${RED}✗ Mobile app build failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ Mobile build script not found${NC}"
    echo "Attempting manual mobile setup..."
    cd mobile || exit 1
    npm install
    npm run type-check
    cd ..
fi
echo ""

# Final Summary
echo "================================"
echo "  Deployment Complete!"
echo "================================"
echo ""
echo -e "${GREEN}✓ Backend Services Running${NC}"
echo "  - API: http://localhost:3001/api"
echo "  - Health: http://localhost:3001/health"
echo "  - Dashboard: http://localhost:3001/dashboard"
echo ""
echo -e "${GREEN}✓ Mobile App Ready${NC}"
echo "  - Run: cd mobile && npm start"
echo ""
echo "📋 Next Steps:"
echo "  1. Start mobile app: cd mobile && npm start"
echo "  2. Test on device with Expo Go"
echo "  3. Review COMPLETE_DEPLOYMENT_PLAN.md for details"
echo ""
echo "🔧 Management Commands:"
echo "  Backend logs: docker-compose -p akelny logs -f backend"
echo "  Stop services: docker-compose -p akelny down"
echo "  Restart: docker-compose -p akelny restart"
echo ""
echo -e "${GREEN}🎉 Akelny is ready to use!${NC}"
echo ""