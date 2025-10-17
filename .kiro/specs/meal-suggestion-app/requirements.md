# Requirements Document

## Introduction

Akelny (أكلني - "Feed me") is a bilingual mobile application that helps users discover and plan meals by suggesting recipes based on their available ingredients, dietary preferences, and cultural kitchen choices. The app supports both English and Arabic with full RTL layout support, allowing users to filter meals by ingredient availability, save favorites, manage a personal recipe collection, and avoid meal repetition through calendar integration.

## Requirements

### Requirement 1: User Account Management

**User Story:** As a new user, I want to create an account with my personal preferences, so that I can receive personalized meal suggestions.

#### Acceptance Criteria

1. WHEN a user opens the app for the first time THEN the system SHALL present an onboarding flow with name, country, and language selection
2. WHEN a user selects their country THEN the system SHALL automatically set their primary kitchen based on country mapping
3. WHEN a user completes registration THEN the system SHALL store their profile with name, email, country, primary kitchen, and language preference
4. WHEN a user logs in THEN the system SHALL authenticate using JWT tokens and redirect to the home screen

### Requirement 2: Kitchen and Cuisine Management

**User Story:** As a user, I want to select from different international kitchens, so that I can explore diverse meal options beyond my primary cuisine.

#### Acceptance Criteria

1. WHEN a user views available kitchens THEN the system SHALL display a list including Egyptian, Gulf, Asian, Indian, European, and Mexican cuisines
2. WHEN a user selects additional kitchens THEN the system SHALL add them to their preferences while maintaining the primary kitchen
3. WHEN suggesting meals THEN the system SHALL filter recipes based on selected kitchen preferences
4. WHEN displaying kitchen names THEN the system SHALL show localized names based on user's language setting

### Requirement 3: Meal Suggestion Engine

**User Story:** As a user, I want to receive meal suggestions based on meal type and available ingredients, so that I can cook with what I have on hand.

#### Acceptance Criteria

1. WHEN a user requests meal suggestions THEN the system SHALL provide options filtered by breakfast, lunch, or dinner categories
2. WHEN a user has marked available ingredients in their pantry THEN the system SHALL only suggest meals where all mandatory ingredients are available
3. WHEN a user selects random meal picker THEN the system SHALL randomly choose from eligible meals after applying all filters
4. WHEN a meal was selected yesterday THEN the system SHALL exclude it from today's suggestions
5. WHEN no meals match the pantry criteria THEN the system SHALL suggest meals with the fewest missing mandatory ingredients

### Requirement 4: Ingredient Management and Pantry System

**User Story:** As a user, I want to manage my available ingredients with clear status indicators, so that I can make informed cooking decisions.

#### Acceptance Criteria

1. WHEN viewing ingredients in a recipe THEN the system SHALL display green circles for mandatory ingredients, orange for recommended, and gray for optional
2. WHEN a user updates their pantry THEN the system SHALL store which ingredients they currently have available
3. WHEN adding new ingredients THEN the system SHALL allow users to contribute to the ingredient library with proper attribution
4. WHEN displaying ingredient information THEN the system SHALL show nutritional data including calories, macros, and key minerals per ingredient

### Requirement 5: Recipe and Meal Details

**User Story:** As a user, I want to view comprehensive meal information including ingredients, nutrition, and cooking instructions, so that I can successfully prepare the dish.

#### Acceptance Criteria

1. WHEN viewing a meal detail page THEN the system SHALL display title, description, kitchen tag, and ingredient list with status indicators
2. WHEN viewing nutrition information THEN the system SHALL show per-ingredient nutrition and aggregated totals for the entire meal
3. WHEN viewing recipe instructions THEN the system SHALL display step-by-step cooking directions with prep time, cook time, and serving information
4. WHEN a user taps an ingredient info icon THEN the system SHALL display detailed nutritional information for that ingredient
5. WHEN a user needs help understanding status indicators THEN the system SHALL provide an accessible help modal explaining color codes

### Requirement 6: Calendar Integration and Meal Planning

**User Story:** As a user, I want to save meals to my calendar and avoid repetition, so that I can plan varied meals throughout the week.

#### Acceptance Criteria

1. WHEN a user saves a meal to calendar THEN the system SHALL store the meal with the selected date
2. WHEN generating suggestions THEN the system SHALL exclude meals that were selected on the previous day
3. WHEN viewing the calendar THEN the system SHALL display saved meals with dates and allow users to view meal details
4. WHEN a user wants to plan ahead THEN the system SHALL allow saving meals to future dates

### Requirement 7: Favorites and Personal Recipe Collection

**User Story:** As a user, I want to save favorite meals and create my own recipes, so that I can build a personalized collection.

#### Acceptance Criteria

1. WHEN a user marks a meal as favorite THEN the system SHALL add it to their favorites list for quick access
2. WHEN a user creates a new recipe THEN the system SHALL allow them to specify ingredients with status indicators, cooking instructions, and nutritional information
3. WHEN a user publishes a recipe THEN the system SHALL make it available to the community with proper attribution to the creator
4. WHEN viewing user-created recipes THEN the system SHALL display the creator's username and creation date

### Requirement 8: Localization and RTL Support

**User Story:** As an Arabic-speaking user, I want to use the app in Arabic with proper RTL layout, so that I can navigate comfortably in my preferred language.

#### Acceptance Criteria

1. WHEN a user selects Arabic language THEN the system SHALL display all UI elements in Arabic with RTL layout
2. WHEN switching between languages THEN the system SHALL maintain user context and display appropriate content translations
3. WHEN displaying recipe content THEN the system SHALL show localized ingredient names and cooking instructions where available
4. WHEN content is not translated THEN the system SHALL gracefully fall back to the default language with clear indication

### Requirement 9: Community Features and Content Moderation

**User Story:** As a user, I want to share recipes with the community while ensuring quality content, so that everyone can benefit from diverse recipe contributions.

#### Acceptance Criteria

1. WHEN a user publishes a recipe THEN the system SHALL include attribution with the creator's username
2. WHEN viewing community recipes THEN the system SHALL allow users to report inappropriate content
3. WHEN recipes are reported THEN the system SHALL flag them for moderation review
4. WHEN sharing recipes externally THEN the system SHALL provide sharing functionality with proper attribution maintained

### Requirement 10: Search and Discovery

**User Story:** As a user, I want to search for specific ingredients or meals, so that I can quickly find what I'm looking for.

#### Acceptance Criteria

1. WHEN a user searches for ingredients THEN the system SHALL return matching results from the ingredient library
2. WHEN a user searches for meals THEN the system SHALL return recipes matching the search criteria
3. WHEN browsing by kitchen THEN the system SHALL display all available meals for that cuisine type
4. WHEN search results are displayed THEN the system SHALL show relevant information including kitchen type and ingredient availability status