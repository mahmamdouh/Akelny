# Akelny Mobile App Testing Checklist

## 🧪 Pre-Testing Setup

### Backend API Testing
- [ ] Backend deployed and running on https://akelny.nabd-co.com
- [ ] Database seeded with meals data
- [ ] All API endpoints responding correctly
- [ ] SSL certificate valid and working

### Mobile App Configuration
- [ ] API_BASE_URL updated to production URL
- [ ] Environment variables configured
- [ ] Dependencies installed (`npm install`)
- [ ] TypeScript compilation successful (`npx tsc --noEmit`)

## 📱 Device Testing Matrix

### iOS Testing
| Device | Version | Screen Size | Status |
|--------|---------|-------------|--------|
| iPhone SE | iOS 14+ | 4.7" | ⏳ |
| iPhone 12 | iOS 15+ | 6.1" | ⏳ |
| iPhone 14 Pro | iOS 16+ | 6.1" | ⏳ |
| iPad Air | iPadOS 15+ | 10.9" | ⏳ |
| iOS Simulator | Latest | Various | ⏳ |

### Android Testing
| Device | Version | Screen Size | Status |
|--------|---------|-------------|--------|
| Pixel 6 | Android 12+ | 6.4" | ⏳ |
| Samsung Galaxy S21 | Android 11+ | 6.2" | ⏳ |
| OnePlus 9 | Android 11+ | 6.55" | ⏳ |
| Tablet (Generic) | Android 10+ | 10"+ | ⏳ |
| Android Emulator | API 30+ | Various | ⏳ |

## 🔧 Functional Testing

### Authentication Flow
- [ ] User registration with valid email
- [ ] User registration with invalid email (error handling)
- [ ] User login with correct credentials
- [ ] User login with incorrect credentials (error handling)
- [ ] Password reset functionality
- [ ] Logout functionality
- [ ] Token refresh mechanism
- [ ] Session persistence across app restarts

### Onboarding & Profile
- [ ] Language selection (English/Arabic)
- [ ] Dietary preferences selection
- [ ] Kitchen preferences selection
- [ ] Profile information update
- [ ] Profile picture upload (if implemented)

### Home Screen & Meal Suggestions
- [ ] Load meal suggestions based on pantry
- [ ] Random meal picker functionality
- [ ] Refresh suggestions (pull-to-refresh)
- [ ] Empty state when no suggestions available
- [ ] Loading states and skeleton screens
- [ ] Error handling for API failures

### Pantry Management
- [ ] Add ingredients to pantry
- [ ] Remove ingredients from pantry
- [ ] Search ingredients by name
- [ ] Browse ingredients by category
- [ ] Ingredient quantity management
- [ ] Pantry persistence across sessions
- [ ] Bulk ingredient operations

### Meal Details & Recipes
- [ ] View meal details and nutrition info
- [ ] View recipe instructions
- [ ] Ingredient availability indicators
- [ ] Add meal to favorites
- [ ] Remove meal from favorites
- [ ] Share meal functionality (if implemented)
- [ ] Meal rating/feedback (if implemented)

### Search & Discovery
- [ ] Search meals by name
- [ ] Filter by cuisine type
- [ ] Filter by meal type (breakfast, lunch, dinner)
- [ ] Filter by dietary restrictions
- [ ] Browse by kitchen preferences
- [ ] Search results pagination
- [ ] Empty search results handling

### Calendar & Planning
- [ ] Add meals to calendar
- [ ] View planned meals by date
- [ ] Remove meals from calendar
- [ ] Calendar navigation (previous/next month)
- [ ] Meal planning suggestions
- [ ] Calendar persistence

### Favorites Management
- [ ] View all favorite meals
- [ ] Remove meals from favorites
- [ ] Search within favorites
- [ ] Empty favorites state
- [ ] Favorites synchronization

## 🌐 Localization Testing

### English (LTR)
- [ ] All text displays correctly
- [ ] Navigation flows properly
- [ ] Input fields work correctly
- [ ] Date/time formatting
- [ ] Number formatting
- [ ] Currency formatting (if applicable)

### Arabic (RTL)
- [ ] RTL layout applied correctly
- [ ] Arabic text renders properly
- [ ] Navigation direction reversed
- [ ] Input fields aligned correctly
- [ ] Icons and buttons positioned correctly
- [ ] Mixed content (Arabic + English) displays properly

### Language Switching
- [ ] Switch from English to Arabic
- [ ] Switch from Arabic to English
- [ ] Language preference persists
- [ ] App restarts in selected language
- [ ] All screens update language immediately

## ⚡ Performance Testing

### App Performance
- [ ] App startup time < 3 seconds
- [ ] Screen transitions smooth (60 FPS)
- [ ] List scrolling performance
- [ ] Image loading and caching
- [ ] Memory usage reasonable
- [ ] Battery usage optimized
- [ ] No memory leaks during extended use

### Network Performance
- [ ] API response times < 2 seconds
- [ ] Offline functionality (cached data)
- [ ] Poor network handling (slow 3G)
- [ ] Network error recovery
- [ ] Background sync (if implemented)
- [ ] Data usage optimization

### Loading States
- [ ] Skeleton screens during data loading
- [ ] Progress indicators for long operations
- [ ] Smooth transitions between states
- [ ] Error states with retry options
- [ ] Empty states with helpful messages

## 🔒 Security Testing

### Data Protection
- [ ] Sensitive data encrypted in storage
- [ ] API tokens securely stored
- [ ] No sensitive data in logs
- [ ] Secure HTTP (HTTPS) only
- [ ] Certificate pinning (if implemented)

### Input Validation
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] Input sanitization
- [ ] File upload security (if applicable)
- [ ] Rate limiting respected

## 🎨 UI/UX Testing

### Visual Design
- [ ] Consistent color scheme
- [ ] Proper typography hierarchy
- [ ] Appropriate spacing and margins
- [ ] Consistent iconography
- [ ] Loading animations smooth
- [ ] Error states visually clear

### Accessibility
- [ ] Screen reader compatibility
- [ ] Sufficient color contrast
- [ ] Touch targets minimum 44px
- [ ] Focus indicators visible
- [ ] Alternative text for images
- [ ] Voice control compatibility

### Responsive Design
- [ ] Works on small screens (iPhone SE)
- [ ] Works on large screens (iPad)
- [ ] Landscape orientation support
- [ ] Dynamic type size support
- [ ] Different screen densities

## 🔄 Integration Testing

### API Integration
- [ ] All endpoints return expected data
- [ ] Error responses handled correctly
- [ ] Authentication headers sent properly
- [ ] Request/response logging works
- [ ] API versioning compatibility

### Third-party Services
- [ ] Push notifications (if implemented)
- [ ] Analytics tracking (if implemented)
- [ ] Crash reporting (if implemented)
- [ ] Social sharing (if implemented)

## 🚨 Error Handling

### Network Errors
- [ ] No internet connection
- [ ] Server unavailable (5xx errors)
- [ ] Timeout errors
- [ ] Invalid responses
- [ ] Rate limiting (429 errors)

### App Errors
- [ ] Unhandled exceptions caught
- [ ] Graceful degradation
- [ ] Error reporting to developers
- [ ] User-friendly error messages
- [ ] Recovery mechanisms

## 📊 Testing Tools & Commands

### Development Testing
```bash
# Start local development
cd akelny/mobile
npm install
npx expo start

# Run tests
npm test
npm run test:integration
npm run lint
npx tsc --noEmit
```

### Production Testing
```bash
# Test against production API
./scripts/test-production.sh

# Build for testing
npx expo build:ios
npx expo build:android
```

### Device Testing
```bash
# iOS Simulator
npx expo run:ios

# Android Emulator
npx expo run:android

# Physical device (Expo Go)
# Scan QR code from expo start
```

## ✅ Sign-off Criteria

### Functional Requirements
- [ ] All core features working correctly
- [ ] No critical bugs identified
- [ ] Performance targets met
- [ ] Localization complete and accurate
- [ ] Security requirements satisfied

### Quality Assurance
- [ ] All test cases passed
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Deployment tested
- [ ] Rollback plan prepared

### Stakeholder Approval
- [ ] Product owner approval
- [ ] Technical lead approval
- [ ] QA team approval
- [ ] Security team approval (if applicable)

## 📝 Test Reporting

### Bug Report Template
```
**Title**: Brief description of the issue
**Priority**: Critical/High/Medium/Low
**Device**: iPhone 12, iOS 15.0
**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Result**: What should happen
**Actual Result**: What actually happened
**Screenshots**: Attach if applicable
**Additional Notes**: Any other relevant information
```

### Test Completion Report
- Total test cases: ___
- Passed: ___
- Failed: ___
- Blocked: ___
- Pass rate: ___%
- Critical issues: ___
- Recommendations: ___

---

**Note**: This checklist should be completed before releasing the app to production or app stores. Each item should be verified on multiple devices and operating system versions.