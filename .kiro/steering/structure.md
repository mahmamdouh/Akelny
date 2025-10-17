# Project Structure

## Root Directory Organization
```
akelny/
├── mobile/                 # React Native Expo app
├── backend/               # Node.js Express API server
├── shared/                # Shared TypeScript types and utilities
├── docs/                  # Project documentation
└── .kiro/                 # Kiro configuration and specs
```

## Mobile App Structure (`mobile/`)
```
mobile/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── common/        # Generic components (Button, Input, etc.)
│   │   └── specific/      # Feature-specific components
│   ├── screens/           # Screen components organized by feature
│   │   ├── auth/          # Authentication screens
│   │   ├── home/          # Home and meal suggestions
│   │   ├── meal/          # Meal details and creation
│   │   ├── pantry/        # Ingredient management
│   │   ├── calendar/      # Calendar and planning
│   │   └── profile/       # User profile and settings
│   ├── navigation/        # Navigation configuration
│   ├── store/             # Redux store and slices
│   ├── services/          # API services and utilities
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Helper functions
│   ├── constants/         # App constants and configuration
│   ├── types/             # TypeScript type definitions
│   └── localization/      # i18n translation files
│       ├── en.json        # English translations
│       └── ar.json        # Arabic translations
├── assets/                # Images, fonts, and static assets
└── app.json              # Expo configuration
```

## Backend Structure (`backend/`)
```
backend/
├── src/
│   ├── controllers/       # Route handlers organized by feature
│   │   ├── auth.ts        # Authentication endpoints
│   │   ├── users.ts       # User management
│   │   ├── meals.ts       # Meal CRUD and suggestions
│   │   ├── ingredients.ts # Ingredient management
│   │   └── calendar.ts    # Calendar operations
│   ├── middleware/        # Express middleware
│   │   ├── auth.ts        # JWT authentication
│   │   ├── validation.ts  # Request validation
│   │   └── localization.ts # Language handling
│   ├── models/            # Database models and schemas
│   ├── services/          # Business logic layer
│   │   ├── suggestionEngine.ts # Meal suggestion algorithm
│   │   ├── nutritionCalculator.ts # Nutrition calculations
│   │   └── moderationService.ts # Content moderation
│   ├── utils/             # Helper functions and utilities
│   ├── config/            # Configuration files
│   │   ├── database.ts    # Database connection
│   │   ├── redis.ts       # Redis configuration
│   │   └── auth.ts        # JWT configuration
│   ├── migrations/        # Database migration files
│   ├── seeds/             # Database seed data
│   └── types/             # TypeScript type definitions
├── tests/                 # Test files mirroring src structure
└── package.json
```

## Shared Types (`shared/`)
```
shared/
├── types/
│   ├── user.ts           # User-related types
│   ├── meal.ts           # Meal and recipe types
│   ├── ingredient.ts     # Ingredient types
│   ├── api.ts            # API request/response types
│   └── common.ts         # Common utility types
└── utils/
    ├── validation.ts     # Shared validation schemas
    └── constants.ts      # Shared constants
```

## Key Organizational Principles

### Feature-Based Organization
- Group related files by feature rather than file type
- Each feature should be self-contained with its components, services, and types
- Shared utilities go in common directories

### Naming Conventions
- **Files**: camelCase for TypeScript files, kebab-case for components
- **Components**: PascalCase (e.g., `MealDetailScreen.tsx`)
- **Services**: camelCase with descriptive names (e.g., `suggestionEngine.ts`)
- **Database**: snake_case for tables and columns
- **API endpoints**: kebab-case URLs (e.g., `/api/meal-suggestions`)

### Import Organization
```typescript
// External libraries
import React from 'react';
import { View, Text } from 'react-native';

// Internal utilities and types
import { MealType } from '@shared/types';
import { formatNutrition } from '@utils/nutrition';

// Components (relative imports for same feature)
import MealCard from './MealCard';
```

### Bilingual Content Structure
- All user-facing content requires both English and Arabic versions
- Database fields: `title_en`, `title_ar`, `description_en`, `description_ar`
- Translation files organized by screen/feature
- RTL-aware component variants when needed

### Testing Structure
- Test files co-located with source files using `.test.ts` suffix
- Integration tests in separate `__tests__` directories
- Mock data and utilities in `__mocks__` directories