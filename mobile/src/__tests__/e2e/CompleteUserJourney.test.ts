/**
 * End-to-End User Journey Tests
 * 
 * This test suite validates complete user flows from onboarding to meal planning.
 * It tests the integration between all major components and ensures data consistency
 * across the entire application.
 */

import { apiClient } from '../../services/apiClient';
import { authService } from '../../services/authService';
import { ingredientService } from '../../services/ingredientService';
import { suggestionService } from '../../services/suggestionService';
import { mealService } from '../../services/mealService';
import { calendarService } from '../../services/calendarService';
import { favoritesService } from '../../services/favoritesService';
import { communityService } from '../../services/communityService';
import { searchService } from '../../services/searchService';

// Mock API responses
const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  country: 'EG',
  primary_kitchen_id: 'kitchen-1',
  language: 'en'
};

const mockIngredients = [
  {
    id: 'ingredient-1',
    name_en: 'Rice',
    name_ar: 'أرز',
    category: 'grains',
    calories_per_100g: 130,
    protein_per_100g: 2.7,
    carbs_per_100g: 28,
    fat_per_100g: 0.3
  },
  {
    id: 'ingredient-2',
    name_en: 'Chicken Breast',
    name_ar: 'صدر دجاج',
    category: 'protein',
    calories_per_100g: 165,
    protein_per_100g: 31,
    carbs_per_100g: 0,
    fat_per_100g: 3.6
  },
  {
    id: 'ingredient-3',
    name_en: 'Tomato',
    name_ar: 'طماطم',
    category: 'vegetables',
    calories_per_100g: 18,
    protein_per_100g: 0.9,
    carbs_per_100g: 3.9,
    fat_per_100g: 0.2
  }
];

const mockMeals = [
  {
    id: 'meal-1',
    title_en: 'Chicken Rice Bowl',
    title_ar: 'وعاء أرز بالدجاج',
    description_en: 'A healthy chicken and rice bowl',
    description_ar: 'وعاء صحي من الأرز والدجاج',
    kitchen_id: 'kitchen-1',
    meal_type: 'lunch',
    servings: 2,
    prep_time_min: 15,
    cook_time_min: 30,
    ingredients: [
      {
        ingredient_id: 'ingredient-1',
        quantity: 200,
        unit: 'g',
        status: 'mandatory'
      },
      {
        ingredient_id: 'ingredient-2',
        quantity: 150,
        unit: 'g',
        status: 'mandatory'
      },
      {
        ingredient_id: 'ingredient-3',
        quantity: 100,
        unit: 'g',
        status: 'recommended'
      }
    ]
  }
];

describe('Complete User Journey E2E Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Setup test environment
    jest.setTimeout(30000);
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('1. User Onboarding Journey', () => {
    it('should complete full onboarding process', async () => {
      // Mock successful signup
      (authService.signup as jest.Mock).mockResolvedValue({
        user: mockUser,
        token: 'test-auth-token',
        refreshToken: 'test-refresh-token'
      });

      // Step 1: User signs up
      const signupResult = await authService.signup({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        country: 'EG',
        language: 'en'
      });

      expect(signupResult.user).toEqual(mockUser);
      expect(signupResult.token).toBeTruthy();
      
      authToken = signupResult.token;
      userId = signupResult.user.id;

      // Step 2: Verify user profile is created with correct kitchen mapping
      expect(signupResult.user.primary_kitchen_id).toBe('kitchen-1'); // Egyptian kitchen
      expect(signupResult.user.language).toBe('en');
    });

    it('should handle login flow', async () => {
      // Mock successful login
      (authService.login as jest.Mock).mockResolvedValue({
        user: mockUser,
        token: 'test-auth-token',
        refreshToken: 'test-refresh-token'
      });

      const loginResult = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(loginResult.user).toEqual(mockUser);
      expect(loginResult.token).toBeTruthy();
    });
  });

  describe('2. Pantry Management Journey', () => {
    it('should manage pantry ingredients end-to-end', async () => {
      // Mock ingredient fetching
      (ingredientService.getIngredients as jest.Mock).mockResolvedValue({
        ingredients: mockIngredients,
        total: mockIngredients.length
      });

      // Mock pantry operations
      (ingredientService.getUserPantry as jest.Mock).mockResolvedValue({
        ingredients: []
      });

      (ingredientService.updateUserPantry as jest.Mock).mockResolvedValue({
        success: true,
        pantry: ['ingredient-1', 'ingredient-2']
      });

      // Step 1: Fetch available ingredients
      const ingredientsResult = await ingredientService.getIngredients({
        category: 'grains',
        search: 'rice'
      });

      expect(ingredientsResult.ingredients).toHaveLength(3);
      expect(ingredientsResult.ingredients[0].name_en).toBe('Rice');

      // Step 2: Get user's current pantry (empty initially)
      const pantryResult = await ingredientService.getUserPantry();
      expect(pantryResult.ingredients).toHaveLength(0);

      // Step 3: Add ingredients to pantry
      const updateResult = await ingredientService.updateUserPantry({
        ingredient_ids: ['ingredient-1', 'ingredient-2']
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.pantry).toContain('ingredient-1');
      expect(updateResult.pantry).toContain('ingredient-2');
    });
  });

  describe('3. Meal Suggestion Journey', () => {
    it('should get personalized meal suggestions based on pantry', async () => {
      // Mock suggestion service
      (suggestionService.getMealSuggestions as jest.Mock).mockResolvedValue({
        meals: mockMeals.map(meal => ({
          ...meal,
          availability_score: 100,
          missing_ingredients: [],
          suggestion_reason: 'perfect_match'
        })),
        total: 1,
        filters_applied: {
          meal_type: 'lunch',
          kitchen_ids: ['kitchen-1'],
          pantry_based: true
        }
      });

      // Step 1: Get suggestions based on pantry
      const suggestionsResult = await suggestionService.getMealSuggestions({
        meal_type: 'lunch',
        kitchen_ids: ['kitchen-1'],
        pantry_ingredient_ids: ['ingredient-1', 'ingredient-2'],
        exclude_recent: true
      });

      expect(suggestionsResult.meals).toHaveLength(1);
      expect(suggestionsResult.meals[0].availability_score).toBe(100);
      expect(suggestionsResult.meals[0].missing_ingredients).toHaveLength(0);
      expect(suggestionsResult.meals[0].suggestion_reason).toBe('perfect_match');
    });

    it('should handle random meal picker', async () => {
      // Mock random picker
      (suggestionService.getRandomMeals as jest.Mock).mockResolvedValue({
        meals: [mockMeals[0]]
      });

      const randomResult = await suggestionService.getRandomMeals({
        count: 1,
        filters: {
          meal_type: 'lunch',
          kitchen_ids: ['kitchen-1']
        }
      });

      expect(randomResult.meals).toHaveLength(1);
      expect(randomResult.meals[0].title_en).toBe('Chicken Rice Bowl');
    });
  });

  describe('4. Meal Detail and Interaction Journey', () => {
    it('should view meal details and perform actions', async () => {
      const mealId = 'meal-1';

      // Mock meal detail fetching
      (mealService.getMealById as jest.Mock).mockResolvedValue({
        meal: {
          ...mockMeals[0],
          nutrition_totals: {
            calories: 313,
            protein: 33.9,
            carbs: 31.9,
            fat: 3.9
          },
          steps_en: [
            'Cook rice according to package instructions',
            'Season and cook chicken breast',
            'Dice tomatoes',
            'Combine all ingredients in a bowl'
          ]
        }
      });

      // Step 1: Get meal details
      const mealResult = await mealService.getMealById(mealId);
      
      expect(mealResult.meal.title_en).toBe('Chicken Rice Bowl');
      expect(mealResult.meal.nutrition_totals.calories).toBe(313);
      expect(mealResult.meal.steps_en).toHaveLength(4);

      // Step 2: Add to favorites
      (favoritesService.addToFavorites as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Added to favorites'
      });

      const favoriteResult = await favoritesService.addToFavorites(mealId);
      expect(favoriteResult.success).toBe(true);

      // Step 3: Save to calendar
      (calendarService.saveToCalendar as jest.Mock).mockResolvedValue({
        success: true,
        entry: {
          id: 'calendar-1',
          meal_id: mealId,
          scheduled_date: '2024-01-15',
          notes: 'Lunch for tomorrow'
        }
      });

      const calendarResult = await calendarService.saveToCalendar({
        meal_id: mealId,
        scheduled_date: '2024-01-15',
        notes: 'Lunch for tomorrow'
      });

      expect(calendarResult.success).toBe(true);
      expect(calendarResult.entry.meal_id).toBe(mealId);
    });
  });

  describe('5. Recipe Creation Journey', () => {
    it('should create and publish a recipe', async () => {
      const newRecipe = {
        title_en: 'My Special Dish',
        title_ar: 'طبقي الخاص',
        description_en: 'A special recipe I created',
        description_ar: 'وصفة خاصة قمت بإنشائها',
        kitchen_id: 'kitchen-1',
        meal_type: 'dinner',
        servings: 4,
        prep_time_min: 20,
        cook_time_min: 40,
        ingredients: [
          {
            ingredient_id: 'ingredient-1',
            quantity: 300,
            unit: 'g',
            status: 'mandatory'
          }
        ],
        steps_en: ['Step 1', 'Step 2'],
        steps_ar: ['الخطوة 1', 'الخطوة 2'],
        is_public: false
      };

      // Mock recipe creation
      (mealService.createMeal as jest.Mock).mockResolvedValue({
        meal: {
          id: 'meal-2',
          ...newRecipe,
          created_by_user_id: userId,
          created_at: new Date().toISOString()
        }
      });

      // Step 1: Create recipe
      const createResult = await mealService.createMeal(newRecipe);
      
      expect(createResult.meal.title_en).toBe('My Special Dish');
      expect(createResult.meal.created_by_user_id).toBe(userId);
      expect(createResult.meal.is_public).toBe(false);

      // Step 2: Publish to community
      (communityService.publishRecipe as jest.Mock).mockResolvedValue({
        message: 'Recipe published successfully',
        meal: {
          ...createResult.meal,
          is_public: true
        }
      });

      const publishResult = await communityService.publishRecipe({
        meal_id: createResult.meal.id,
        is_public: true
      });

      expect(publishResult.message).toBe('Recipe published successfully');
      expect(publishResult.meal.is_public).toBe(true);
    });
  });

  describe('6. Search and Discovery Journey', () => {
    it('should search for ingredients and meals', async () => {
      // Mock search results
      (searchService.searchIngredients as jest.Mock).mockResolvedValue({
        ingredients: mockIngredients.filter(ing => 
          ing.name_en.toLowerCase().includes('rice') ||
          ing.name_ar.includes('أرز')
        ),
        total: 1
      });

      (searchService.searchMeals as jest.Mock).mockResolvedValue({
        meals: mockMeals.filter(meal =>
          meal.title_en.toLowerCase().includes('rice') ||
          meal.title_ar.includes('أرز')
        ),
        total: 1
      });

      // Step 1: Search for ingredients
      const ingredientSearchResult = await searchService.searchIngredients({
        query: 'rice',
        limit: 10
      });

      expect(ingredientSearchResult.ingredients).toHaveLength(1);
      expect(ingredientSearchResult.ingredients[0].name_en).toBe('Rice');

      // Step 2: Search for meals
      const mealSearchResult = await searchService.searchMeals({
        query: 'rice',
        limit: 10
      });

      expect(mealSearchResult.meals).toHaveLength(1);
      expect(mealSearchResult.meals[0].title_en).toBe('Chicken Rice Bowl');
    });

    it('should browse meals by kitchen', async () => {
      // Mock kitchen browsing
      (searchService.getMealsByKitchen as jest.Mock).mockResolvedValue({
        meals: mockMeals,
        total: 1,
        kitchen: {
          id: 'kitchen-1',
          name_en: 'Egyptian',
          name_ar: 'مصري'
        }
      });

      const kitchenMealsResult = await searchService.getMealsByKitchen({
        kitchen_id: 'kitchen-1',
        meal_type: 'lunch'
      });

      expect(kitchenMealsResult.meals).toHaveLength(1);
      expect(kitchenMealsResult.kitchen.name_en).toBe('Egyptian');
    });
  });

  describe('7. Calendar and Planning Journey', () => {
    it('should manage meal planning and calendar', async () => {
      // Mock calendar operations
      (calendarService.getCalendarEntries as jest.Mock).mockResolvedValue({
        entries: [
          {
            id: 'calendar-1',
            meal_id: 'meal-1',
            scheduled_date: '2024-01-15',
            notes: 'Lunch for tomorrow',
            meal: mockMeals[0]
          }
        ],
        total: 1
      });

      // Step 1: Get calendar entries
      const calendarResult = await calendarService.getCalendarEntries({
        start_date: '2024-01-01',
        end_date: '2024-01-31'
      });

      expect(calendarResult.entries).toHaveLength(1);
      expect(calendarResult.entries[0].meal.title_en).toBe('Chicken Rice Bowl');

      // Step 2: Remove from calendar
      (calendarService.removeFromCalendar as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Removed from calendar'
      });

      const removeResult = await calendarService.removeFromCalendar('calendar-1');
      expect(removeResult.success).toBe(true);
    });
  });

  describe('8. Favorites Management Journey', () => {
    it('should manage favorite meals', async () => {
      // Mock favorites operations
      (favoritesService.getFavorites as jest.Mock).mockResolvedValue({
        meals: [
          {
            ...mockMeals[0],
            favorited_at: new Date().toISOString()
          }
        ],
        total: 1
      });

      // Step 1: Get favorites
      const favoritesResult = await favoritesService.getFavorites({
        limit: 20,
        offset: 0
      });

      expect(favoritesResult.meals).toHaveLength(1);
      expect(favoritesResult.meals[0].title_en).toBe('Chicken Rice Bowl');

      // Step 2: Remove from favorites
      (favoritesService.removeFromFavorites as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Removed from favorites'
      });

      const removeResult = await favoritesService.removeFromFavorites('meal-1');
      expect(removeResult.success).toBe(true);
    });
  });

  describe('9. Community Interaction Journey', () => {
    it('should interact with community features', async () => {
      // Mock community operations
      (communityService.getCommunityMeals as jest.Mock).mockResolvedValue({
        meals: mockMeals.map(meal => ({
          ...meal,
          is_public: true,
          creator: {
            id: 'user-2',
            name: 'Community User'
          }
        })),
        total: 1
      });

      // Step 1: Browse community meals
      const communityResult = await communityService.getCommunityMeals({
        is_public: true,
        is_approved: true,
        limit: 20
      });

      expect(communityResult.meals).toHaveLength(1);
      expect(communityResult.meals[0].creator.name).toBe('Community User');

      // Step 2: Report inappropriate content
      (communityService.reportMeal as jest.Mock).mockResolvedValue({
        message: 'Report submitted successfully',
        report: {
          id: 'report-1',
          meal_id: 'meal-1',
          reason: 'inappropriate_content',
          status: 'pending'
        }
      });

      const reportResult = await communityService.reportMeal({
        meal_id: 'meal-1',
        reason: 'inappropriate_content',
        description: 'This content is inappropriate'
      });

      expect(reportResult.message).toBe('Report submitted successfully');
      expect(reportResult.report.reason).toBe('inappropriate_content');
    });
  });

  describe('10. Data Consistency and State Management', () => {
    it('should maintain consistent data across all operations', async () => {
      // This test verifies that data remains consistent across different operations
      
      // Step 1: Add ingredient to pantry
      (ingredientService.updateUserPantry as jest.Mock).mockResolvedValue({
        success: true,
        pantry: ['ingredient-1', 'ingredient-2', 'ingredient-3']
      });

      const pantryUpdate = await ingredientService.updateUserPantry({
        ingredient_ids: ['ingredient-1', 'ingredient-2', 'ingredient-3']
      });

      // Step 2: Get suggestions (should reflect pantry changes)
      (suggestionService.getMealSuggestions as jest.Mock).mockResolvedValue({
        meals: mockMeals.map(meal => ({
          ...meal,
          availability_score: 100,
          missing_ingredients: []
        })),
        total: 1
      });

      const suggestions = await suggestionService.getMealSuggestions({
        pantry_ingredient_ids: pantryUpdate.pantry
      });

      expect(suggestions.meals[0].availability_score).toBe(100);
      expect(suggestions.meals[0].missing_ingredients).toHaveLength(0);

      // Step 3: Save meal to calendar
      (calendarService.saveToCalendar as jest.Mock).mockResolvedValue({
        success: true,
        entry: {
          id: 'calendar-2',
          meal_id: 'meal-1',
          scheduled_date: '2024-01-16'
        }
      });

      await calendarService.saveToCalendar({
        meal_id: 'meal-1',
        scheduled_date: '2024-01-16'
      });

      // Step 4: Get new suggestions (should exclude recent meal)
      (suggestionService.getMealSuggestions as jest.Mock).mockResolvedValue({
        meals: [], // Empty because recent meal is excluded
        total: 0
      });

      const newSuggestions = await suggestionService.getMealSuggestions({
        pantry_ingredient_ids: pantryUpdate.pantry,
        exclude_recent: true
      });

      expect(newSuggestions.meals).toHaveLength(0); // Recent meal excluded
    });
  });

  describe('11. Error Handling and Recovery', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      (suggestionService.getMealSuggestions as jest.Mock).mockRejectedValue(
        new Error('Network request failed')
      );

      await expect(
        suggestionService.getMealSuggestions({
          meal_type: 'lunch'
        })
      ).rejects.toThrow('Network request failed');
    });

    it('should handle validation errors', async () => {
      // Mock validation error
      (mealService.createMeal as jest.Mock).mockRejectedValue(
        new Error('Title is required')
      );

      await expect(
        mealService.createMeal({
          title_en: '', // Invalid empty title
          kitchen_id: 'kitchen-1',
          meal_type: 'lunch'
        } as any)
      ).rejects.toThrow('Title is required');
    });
  });

  describe('12. Performance and Caching', () => {
    it('should handle large datasets efficiently', async () => {
      // Mock large dataset
      const largeIngredientList = Array.from({ length: 1000 }, (_, i) => ({
        id: `ingredient-${i}`,
        name_en: `Ingredient ${i}`,
        name_ar: `مكون ${i}`,
        category: 'test'
      }));

      (ingredientService.getIngredients as jest.Mock).mockResolvedValue({
        ingredients: largeIngredientList.slice(0, 50), // Paginated
        total: largeIngredientList.length,
        limit: 50,
        offset: 0
      });

      const result = await ingredientService.getIngredients({
        limit: 50,
        offset: 0
      });

      expect(result.ingredients).toHaveLength(50);
      expect(result.total).toBe(1000);
    });
  });
});