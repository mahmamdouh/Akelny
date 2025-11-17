# 🚀 Complete Akelny Deployment & Testing Plan

## 📋 Overview
This guide covers the complete deployment of both backend and mobile app, plus comprehensive testing procedures.

---

## PHASE 1: Backend Deployment (30 minutes)

### Step 1.1: Deploy Backend Services
```bash
cd /root/Akelny
chmod +x scripts/bulletproof-deploy.sh
./scripts/bulletproof-deploy.sh
```

**Expected Output:**
- ✅ Backend API running on `http://localhost:3001`
- ✅ PostgreSQL database on `localhost:5433`
- ✅ Redis cache on `localhost:6380`
- ✅ Health check passing at `/health`

### Step 1.2: Verify Backend Deployment
```bash
# Test health endpoint
curl http://localhost:3001/health

# Test API info
curl http://localhost:3001/api

# Check service status
docker-compose -p akelny ps

# View logs
docker-compose -p akelny logs -f backend
```

### Step 1.3: Seed Database (Optional but Recommended)
```bash
# Run seed scripts to populate initial data
docker-compose -p akelny exec backend npm run seed

# Or manually seed specific data
docker-compose -p akelny exec postgres psql -U akelny_user -d akelny -c "SELECT COUNT(*) FROM kitchens;"
```

---

## PHASE 2: Mobile App Setup (20 minutes)

### Step 2.1: Install Dependencies
```bash
cd mobile
npm install
```

### Step 2.2: Configure API Endpoint
Update `mobile/src/services/apiClient.ts` to point to your backend:

```typescript
// For local testing
const API_BASE_URL = 'http://localhost:3001/api';

// For device testing (use your machine's IP)
const API_BASE_URL = 'http://192.168.1.XXX:3001/api';

// For production
const API_BASE_URL = 'https://api.akelny.com/api';
```

### Step 2.3: Build and Test Mobile App
```bash
# Type check
npm run type-check

# Run linter
npm run lint

# Start Expo development server
npm start
```

---

## PHASE 3: Testing Strategy

### 3.1 Backend API Testing

#### Manual API Tests
```bash
# 1. Test Authentication
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!",
    "country": "EG",
    "language": "en"
  }'

# 2. Test Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Save the token from response
TOKEN="your_jwt_token_here"

# 3. Test Ingredients List
curl http://localhost:3001/api/ingredients \
  -H "Authorization: Bearer $TOKEN"

# 4. Test Meal Suggestions
curl http://localhost:3001/api/suggestions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ingredient_ids": ["ingredient-id-1", "ingredient-id-2"],
    "meal_type": "lunch"
  }'

# 5. Test Search
curl "http://localhost:3001/api/search/meals?query=chicken" \
  -H "Authorization: Bearer $TOKEN"
```

#### Automated Backend Tests
```bash
cd backend
npm test
```

### 3.2 Mobile App Testing

#### A. Expo Go Testing (Quickest)
1. Install Expo Go app on your phone (iOS/Android)
2. Run `npm start` in mobile directory
3. Scan QR code with Expo Go app
4. Test all features on real device

#### B. iOS Simulator Testing (Mac only)
```bash
npm run ios
```

#### C. Android Emulator Testing
```bash
# Start Android emulator first
npm run android
```

#### D. Manual Testing Checklist

**Authentication Flow:**
- [ ] User can register new account
- [ ] User can login with credentials
- [ ] User can logout
- [ ] Token persists after app restart
- [ ] Invalid credentials show error

**Onboarding Flow:**
- [ ] User can select country
- [ ] User can select language (EN/AR)
- [ ] User can select preferred kitchens
- [ ] RTL layout works for Arabic
- [ ] Onboarding saves preferences

**Home Screen:**
- [ ] Meal suggestions load correctly
- [ ] Random meal picker works
- [ ] Refresh updates suggestions
- [ ] Loading states display properly
- [ ] Error states show helpful messages

**Pantry Management:**
- [ ] User can search ingredients
- [ ] User can add ingredients to pantry
- [ ] User can remove ingredients
- [ ] Ingredient quantities update
- [ ] Pantry persists after app restart

**Meal Details:**
- [ ] Meal details load correctly
- [ ] Ingredients list displays
- [ ] Instructions show properly
- [ ] Nutrition info displays
- [ ] Images load correctly
- [ ] Can add to favorites
- [ ] Can add to calendar

**Search & Browse:**
- [ ] Search by meal name works
- [ ] Search by ingredient works
- [ ] Kitchen filter works
- [ ] Meal type filter works
- [ ] Difficulty filter works
- [ ] Results display correctly

**Favorites:**
- [ ] Can add meals to favorites
- [ ] Can remove from favorites
- [ ] Favorites list displays
- [ ] Favorites persist

**Calendar:**
- [ ] Can add meals to calendar
- [ ] Can view calendar
- [ ] Can remove from calendar
- [ ] Calendar displays correctly

**Recipe Creation:**
- [ ] Can create new recipe
- [ ] Can add ingredients
- [ ] Can add instructions
- [ ] Can upload image
- [ ] Can save recipe
- [ ] Validation works

**Localization:**
- [ ] Can switch language
- [ ] All text translates
- [ ] RTL layout works for Arabic
- [ ] Date/time formats correctly

**Performance:**
- [ ] App loads quickly
- [ ] Smooth scrolling
- [ ] No lag on interactions
- [ ] Images load efficiently
- [ ] Offline mode works (if implemented)

---

## PHASE 4: Production Deployment

### 4.1 Backend Production Setup

#### Option A: Docker Deployment (Recommended)
```bash
# On production server
cd /root/Akelny
./scripts/bulletproof-deploy.sh

# Configure environment variables
cp backend/.env.example backend/.env.production
# Edit with production values

# Use production environment
docker-compose -p akelny -f docker-compose.prod.yml up -d
```

#### Option B: Direct Server Deployment
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Install Redis
sudo apt-get install redis-server

# Deploy backend
cd backend
npm install --production
npm run build
npm start
```

### 4.2 Mobile App Production Build

#### iOS Build (Mac required)
```bash
cd mobile

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

#### Android Build
```bash
cd mobile

# Build APK for testing
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

---

## PHASE 5: Monitoring & Maintenance

### 5.1 Backend Monitoring
```bash
# View logs
docker-compose -p akelny logs -f backend

# Check resource usage
docker stats

# Monitor database
docker-compose -p akelny exec postgres psql -U akelny_user -d akelny -c "SELECT COUNT(*) FROM users;"

# Check Redis cache
docker-compose -p akelny exec redis redis-cli INFO
```

### 5.2 Performance Dashboard
Access the performance dashboard at:
```
http://localhost:3001/dashboard
```

### 5.3 Database Backups
```bash
# Backup database
docker-compose -p akelny exec postgres pg_dump -U akelny_user akelny > backup_$(date +%Y%m%d).sql

# Restore database
docker-compose -p akelny exec -T postgres psql -U akelny_user akelny < backup_20231117.sql
```

---

## PHASE 6: Troubleshooting

### Common Backend Issues

**Issue: Port already in use**
```bash
# Check what's using the port
sudo lsof -i :3001
# Kill the process or change port in docker-compose.yml
```

**Issue: Database connection failed**
```bash
# Check database status
docker-compose -p akelny exec postgres pg_isready

# Restart database
docker-compose -p akelny restart postgres
```

**Issue: TypeScript compilation errors**
```bash
# Already fixed with inline types!
# If issues persist, use docker-only-deploy.sh
./scripts/docker-only-deploy.sh
```

### Common Mobile Issues

**Issue: Cannot connect to backend**
- Check API_BASE_URL in apiClient.ts
- Use your machine's IP address, not localhost
- Ensure backend is running and accessible

**Issue: Expo Go not loading**
- Clear Expo cache: `expo start -c`
- Restart Expo Go app
- Check network connection

**Issue: Build fails**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Metro cache: `expo start -c`
- Check for TypeScript errors: `npm run type-check`

---

## 📊 Success Criteria

### Backend Deployment Success
- ✅ All services running (backend, postgres, redis)
- ✅ Health check returns 200 OK
- ✅ API endpoints respond correctly
- ✅ Database migrations applied
- ✅ Seed data loaded (if applicable)

### Mobile App Success
- ✅ App builds without errors
- ✅ App runs on device/simulator
- ✅ Can connect to backend API
- ✅ All core features work
- ✅ No critical bugs
- ✅ Performance is acceptable

---

## 🎯 Next Steps After Deployment

1. **User Testing**: Get real users to test the app
2. **Analytics**: Implement analytics (Firebase, Mixpanel)
3. **Crash Reporting**: Add Sentry or similar
4. **Push Notifications**: Implement if needed
5. **App Store Optimization**: Prepare screenshots, descriptions
6. **Marketing**: Plan launch strategy
7. **Support**: Set up user support channels

---

## 📞 Quick Reference

### Backend URLs
- API: `http://localhost:3001/api`
- Health: `http://localhost:3001/health`
- Dashboard: `http://localhost:3001/dashboard`

### Useful Commands
```bash
# Backend
docker-compose -p akelny ps              # Check status
docker-compose -p akelny logs -f backend # View logs
docker-compose -p akelny restart backend # Restart
docker-compose -p akelny down            # Stop all

# Mobile
npm start                                # Start Expo
npm run type-check                       # Check types
npm run lint                             # Lint code
npm test                                 # Run tests
```

### Environment Variables
```bash
# Backend (.env)
DATABASE_URL=postgresql://akelny_user:akelny_pass@postgres:5432/akelny
REDIS_URL=redis://redis:6379
JWT_SECRET=your-secret-key-here
NODE_ENV=production
PORT=3000

# Mobile (app.json)
API_BASE_URL=https://api.akelny.com/api
```

---

## ✅ Deployment Checklist

- [ ] Backend deployed and running
- [ ] Database migrations applied
- [ ] Seed data loaded
- [ ] API endpoints tested
- [ ] Mobile app configured
- [ ] Mobile app builds successfully
- [ ] Mobile app tested on device
- [ ] All core features working
- [ ] Performance acceptable
- [ ] Error handling works
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Documentation updated
- [ ] Team trained on deployment
- [ ] Support channels ready

---

**🎉 You're ready to launch Akelny!**