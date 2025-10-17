import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import all reducers
import authReducer from '../../store/authSlice';
import ingredientReducer from '../../store/ingredientSlice';
import suggestionReducer from '../../store/suggestionSlice';
import mealReducer from '../../store/mealSlice';
import calendarReducer from '../../store/calendarSlice';
import favoritesReducer from '../../store/favoritesSlice';
import communityReducer from '../../store/communitySlice';
import searchReducer from '../../store/searchSlice';

// Import navigation components
import RootNavigator from '../../navigation/RootNavigator';
import AppNavigator from '../../navigation/AppNavigator';

// Mock services
jest.mock('../../services/authService');
jest.mock('../../services/ingredientService');
jest.mock('../../services/suggestionService');
jest.mock('../../services/mealService');
jest.mock('../../services/calendarService');
jest.mock('../../services/favoritesService');
jest.mock('../../services/communityService');
jest.mock('../../services/searchService');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock i18n
jest.mock('../../localization/i18n', () => ({
  t: (key: string) => key,
  changeLanguage: jest.fn(),
  language: 'en',
}));

// Create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      ingredients: ingredientReducer,
      suggestions: suggestionReducer,
      meals: mealReducer,
      calendar: calendarReducer,
      favorites: favoritesReducer,
      community: communityReducer,
      search: searchReducer,
    },
    preloadedState: initialState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode; store?: any }> = ({ 
  children, 
  store 
}) => {
  const testStore = store || createTestStore();
  
  return (
    <Provider store={testStore}>
      <NavigationContainer>
        {children}
      </NavigationContainer>
    </Provider>
  );
};

describe('Complete User Flows Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  describe('Authentication Flow', () => {
    it('should complete onboarding to home screen flow', async () => {
      const store = createTestStore({
        auth: {
          isAuthenticated: false,
          isLoading: false,
          user: null,
          token: null,
          error: null,
        },
      });

      const { getByText, getByPlaceholderText } = render(
        <TestWrapper store={store}>
          <RootNavigator />
        </TestWrapper>
      );

      // Should show login screen initially
      await waitFor(() => {
        expect(getByText('auth.loginTitle')).toBeTruthy();
      });

      // Navigate to onboarding
      fireEvent.press(getByText('auth.dontHaveAccount'));

      await waitFor(() => {
        expect(getByText('auth.onboardingTitle')).toBeTruthy();
      });

      // Fill onboarding form
      fireEvent.changeText(getByPlaceholderText('auth.namePlaceholder'), 'Test User');
      fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('auth.passwordPlaceholder'), 'password123');

      // Submit onboarding
      fireEvent.press(getByText('auth.signup'));

      // Should navigate to authenticated app
      await waitFor(() => {
        expect(getByText('home.title')).toBeTruthy();
      });
    });
  });

  describe('Pantry Management Flow', () => {
    it('should add ingredients to pantry and see them in suggestions', async () => {
      const store = createTestStore({
        auth: {
          isAuthenticated: true,
          user: { id: '1', name: 'Test User' },
          token: 'test-token',
          isLoading: false,
          error: null,
        },
        ingredients: {
          pantry: [],
          available: [
            { id: '1', name_en: 'Rice', name_ar: 'أرز', category: 'grains' },
            { id: '2', name_en: 'Chicken', name_ar: 'دجاج', category: 'protein' },
          ],
          loading: false,
          error: null,
        },
      });

      const { getByText, getByTestId } = render(
        <TestWrapper store={store}>
          <AppNavigator />
        </TestWrapper>
      );

      // Navigate to pantry tab
      fireEvent.press(getByText('navigation.pantry'));

      await waitFor(() => {
        expect(getByText('pantry.title')).toBeTruthy();
      });

      // Add ingredients
      fireEvent.press(getByText('pantry.addIngredients'));

      // Should show ingredient search
      await waitFor(() => {
        expect(getByText('Rice')).toBeTruthy();
      });

      // Add rice to pantry
      fireEvent.press(getByTestId('add-ingredient-1'));

      // Go back to home and check suggestions
      fireEvent.press(getByText('navigation.home'));

      await waitFor(() => {
        expect(getByText('home.suggestions.getSuggestions')).toBeTruthy();
      });

      // Get suggestions
      fireEvent.press(getByText('home.suggestions.getSuggestions'));

      // Should show suggestions based on pantry
      await waitFor(() => {
        expect(getByText('home.suggestions.loading')).toBeTruthy();
      });
    });
  });

  describe('Meal Detail and Calendar Flow', () => {
    it('should view meal details and save to calendar', async () => {
      const mockMeal = {
        id: '1',
        title_en: 'Test Meal',
        title_ar: 'وجبة تجريبية',
        description_en: 'A test meal',
        servings: 4,
        prep_time_min: 30,
        cook_time_min: 45,
      };

      const store = createTestStore({
        auth: {
          isAuthenticated: true,
          user: { id: '1', name: 'Test User' },
          token: 'test-token',
          isLoading: false,
          error: null,
        },
        meals: {
          currentMeal: mockMeal,
          loading: false,
          error: null,
        },
        calendar: {
          entries: [],
          loading: false,
          error: null,
        },
      });

      const { getByText } = render(
        <TestWrapper store={store}>
          <AppNavigator />
        </TestWrapper>
      );

      // Navigate to meal detail (simulated)
      // In real app, this would be triggered by tapping a meal card

      // Should show meal details
      await waitFor(() => {
        expect(getByText('Test Meal')).toBeTruthy();
      });

      // Save to calendar
      fireEvent.press(getByText('meal.saveToCalendar'));

      // Should show success message
      await waitFor(() => {
        expect(getByText('calendar.mealSaved')).toBeTruthy();
      });

      // Navigate to calendar tab
      fireEvent.press(getByText('navigation.calendar'));

      // Should show saved meal in calendar
      await waitFor(() => {
        expect(getByText('Test Meal')).toBeTruthy();
      });
    });
  });

  describe('Recipe Creation and Community Flow', () => {
    it('should create recipe and share to community', async () => {
      const store = createTestStore({
        auth: {
          isAuthenticated: true,
          user: { id: '1', name: 'Test User' },
          token: 'test-token',
          isLoading: false,
          error: null,
        },
        meals: {
          creating: false,
          error: null,
        },
        community: {
          meals: [],
          loading: false,
          error: null,
          publishingMealId: null,
        },
      });

      const { getByText, getByPlaceholderText } = render(
        <TestWrapper store={store}>
          <AppNavigator />
        </TestWrapper>
      );

      // Navigate to create recipe (simulated navigation)
      // In real app, this would be triggered from a menu or button

      // Fill recipe form
      fireEvent.changeText(
        getByPlaceholderText('recipe.titleEnPlaceholder'),
        'My Test Recipe'
      );
      fireEvent.changeText(
        getByPlaceholderText('recipe.descriptionEnPlaceholder'),
        'A delicious test recipe'
      );

      // Submit recipe
      fireEvent.press(getByText('recipe.createRecipe'));

      // Should show success message
      await waitFor(() => {
        expect(getByText('recipe.createSuccess')).toBeTruthy();
      });

      // Navigate to community
      fireEvent.press(getByText('navigation.search')); // Community is accessible through search

      // Should show community recipes
      await waitFor(() => {
        expect(getByText('community.title')).toBeTruthy();
      });
    });
  });

  describe('Search and Discovery Flow', () => {
    it('should search for ingredients and meals', async () => {
      const store = createTestStore({
        auth: {
          isAuthenticated: true,
          user: { id: '1', name: 'Test User' },
          token: 'test-token',
          isLoading: false,
          error: null,
        },
        search: {
          ingredients: [
            { id: '1', name_en: 'Rice', name_ar: 'أرز' },
          ],
          meals: [
            { id: '1', title_en: 'Rice Dish', title_ar: 'طبق أرز' },
          ],
          loading: false,
          error: null,
        },
      });

      const { getByText, getByPlaceholderText } = render(
        <TestWrapper store={store}>
          <AppNavigator />
        </TestWrapper>
      );

      // Navigate to search tab
      fireEvent.press(getByText('navigation.search'));

      await waitFor(() => {
        expect(getByText('search.title')).toBeTruthy();
      });

      // Search for rice
      fireEvent.changeText(
        getByPlaceholderText('search.placeholder'),
        'rice'
      );

      // Should show search results
      await waitFor(() => {
        expect(getByText('Rice')).toBeTruthy();
        expect(getByText('Rice Dish')).toBeTruthy();
      });
    });
  });

  describe('Favorites Flow', () => {
    it('should add meal to favorites and view favorites list', async () => {
      const mockMeal = {
        id: '1',
        title_en: 'Favorite Meal',
        title_ar: 'وجبة مفضلة',
        description_en: 'A favorite meal',
      };

      const store = createTestStore({
        auth: {
          isAuthenticated: true,
          user: { id: '1', name: 'Test User' },
          token: 'test-token',
          isLoading: false,
          error: null,
        },
        favorites: {
          meals: [],
          loading: false,
          error: null,
        },
      });

      const { getByText } = render(
        <TestWrapper store={store}>
          <AppNavigator />
        </TestWrapper>
      );

      // Add meal to favorites (simulated from meal detail)
      fireEvent.press(getByText('meal.addToFavorites'));

      // Navigate to favorites tab
      fireEvent.press(getByText('navigation.favorites'));

      await waitFor(() => {
        expect(getByText('favorites.title')).toBeTruthy();
      });

      // Should show favorited meal
      await waitFor(() => {
        expect(getByText('Favorite Meal')).toBeTruthy();
      });
    });
  });

  describe('Cross-Component Data Consistency', () => {
    it('should maintain consistent state across components', async () => {
      const store = createTestStore({
        auth: {
          isAuthenticated: true,
          user: { id: '1', name: 'Test User' },
          token: 'test-token',
          isLoading: false,
          error: null,
        },
        ingredients: {
          pantry: [
            { id: '1', name_en: 'Rice', name_ar: 'أرز' },
          ],
          available: [],
          loading: false,
          error: null,
        },
        suggestions: {
          meals: [
            {
              id: '1',
              title_en: 'Rice Dish',
              availability_score: 100,
              missing_ingredients: [],
            },
          ],
          loading: false,
          error: null,
        },
      });

      const { getByText } = render(
        <TestWrapper store={store}>
          <AppNavigator />
        </TestWrapper>
      );

      // Check home screen shows suggestions based on pantry
      await waitFor(() => {
        expect(getByText('Rice Dish')).toBeTruthy();
      });

      // Navigate to pantry
      fireEvent.press(getByText('navigation.pantry'));

      // Should show rice in pantry
      await waitFor(() => {
        expect(getByText('Rice')).toBeTruthy();
      });

      // Remove rice from pantry
      fireEvent.press(getByText('common.remove'));

      // Navigate back to home
      fireEvent.press(getByText('navigation.home'));

      // Suggestions should update to reflect pantry changes
      fireEvent.press(getByText('home.suggestions.getSuggestions'));

      // Should show different suggestions or no suggestions
      await waitFor(() => {
        expect(getByText('home.suggestions.noSuggestions')).toBeTruthy();
      });
    });
  });

  describe('Language Switching Flow', () => {
    it('should switch language and maintain context', async () => {
      const store = createTestStore({
        auth: {
          isAuthenticated: true,
          user: { id: '1', name: 'Test User' },
          token: 'test-token',
          isLoading: false,
          error: null,
        },
      });

      const { getByText } = render(
        <TestWrapper store={store}>
          <AppNavigator />
        </TestWrapper>
      );

      // Should show English content initially
      await waitFor(() => {
        expect(getByText('home.title')).toBeTruthy();
      });

      // Switch to Arabic (simulated)
      // In real app, this would be triggered from settings or language switcher
      act(() => {
        // Simulate language change
        store.dispatch({ type: 'LANGUAGE_CHANGED', payload: 'ar' });
      });

      // Should show Arabic content
      await waitFor(() => {
        expect(getByText('أكلني')).toBeTruthy(); // Arabic title
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network errors gracefully', async () => {
      const store = createTestStore({
        auth: {
          isAuthenticated: true,
          user: { id: '1', name: 'Test User' },
          token: 'test-token',
          isLoading: false,
          error: null,
        },
        suggestions: {
          meals: [],
          loading: false,
          error: 'Network error occurred',
        },
      });

      const { getByText } = render(
        <TestWrapper store={store}>
          <AppNavigator />
        </TestWrapper>
      );

      // Should show error message
      await waitFor(() => {
        expect(getByText('Network error occurred')).toBeTruthy();
      });

      // Should show retry button
      expect(getByText('common.retry')).toBeTruthy();

      // Retry should clear error and attempt reload
      fireEvent.press(getByText('common.retry'));

      await waitFor(() => {
        expect(getByText('home.suggestions.loading')).toBeTruthy();
      });
    });
  });
});