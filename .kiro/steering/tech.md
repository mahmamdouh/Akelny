# Technology Stack

## Frontend
- **React Native** with Expo SDK for cross-platform mobile development
- **TypeScript** for type safety and better developer experience
- **Redux Toolkit** with RTK Query for state management and API calls
- **i18next** for internationalization with RTL support
- **Expo SecureStore** for secure token storage

## Backend
- **Node.js** with Express.js framework
- **TypeScript** for consistent typing across the stack
- **PostgreSQL** with connection pooling for primary database
- **Redis** for caching and session management
- **JWT** tokens with bcrypt for authentication
- **Cloud storage** for recipe images

## Development Tools
- **ESLint** and **Prettier** for code formatting
- **Jest** for unit testing (80%+ coverage target)
- **React Native Testing Library** for component testing
- **Supertest** for API integration testing

## Common Commands

### Frontend Development
```bash
# Start Expo development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Run tests
npm test

# Type checking
npx tsc --noEmit
```

### Backend Development
```bash
# Start development server
npm run dev

# Run database migrations
npm run migrate

# Seed database
npm run seed

# Run tests
npm test

# Build for production
npm run build
```

### Database Operations
```bash
# Create new migration
npm run migrate:create <migration_name>

# Run migrations
npm run migrate:up

# Rollback migration
npm run migrate:down

# Reset database
npm run db:reset
```

## Key Technical Considerations
- All user-facing text must support bilingual content (English/Arabic)
- Database fields use dual-field approach: `field_en` and `field_ar`
- RTL layout support required for Arabic interface
- Ingredient status classification: mandatory, recommended, optional
- Caching strategy with Redis for meal suggestions (1-hour TTL)
- JWT token refresh mechanism for secure authentication