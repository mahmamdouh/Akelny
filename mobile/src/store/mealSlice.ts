import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  Meal, 
  CreateMealRequest, 
  UpdateMealRequest, 
  MealFilters,
  MealListResponse 
} from '../../../shared/src/types/meal';
import { mealService } from '../services/mealService';

interface MealState {
  meals: Meal[];
  currentMeal: Meal | null;
  userMeals: Meal[];
  publicMeals: Meal[];
  searchResults: Meal[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  filters: MealFilters;
}

const initialState: MealState = {
  meals: [],
  currentMeal: null,
  userMeals: [],
  publicMeals: [],
  searchResults: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  },
  filters: {}
};

// Async thunks
export const fetchMeals = createAsyncThunk(
  'meals/fetchMeals',
  async (filters?: MealFilters) => {
    const response = await mealService.getMeals(filters);
    return response;
  }
);

export const fetchMealById = createAsyncThunk(
  'meals/fetchMealById',
  async (id: string) => {
    const meal = await mealService.getMealById(id);
    return meal;
  }
);

export const createMeal = createAsyncThunk(
  'meals/createMeal',
  async (mealData: CreateMealRequest) => {
    const meal = await mealService.createMeal(mealData);
    return meal;
  }
);

export const updateMeal = createAsyncThunk(
  'meals/updateMeal',
  async ({ id, updateData }: { id: string; updateData: UpdateMealRequest }) => {
    const meal = await mealService.updateMeal(id, updateData);
    return meal;
  }
);

export const deleteMeal = createAsyncThunk(
  'meals/deleteMeal',
  async (id: string) => {
    await mealService.deleteMeal(id);
    return id;
  }
);

export const fetchUserMeals = createAsyncThunk(
  'meals/fetchUserMeals',
  async ({ userId, filters }: { userId: string; filters?: Omit<MealFilters, 'created_by_user_id'> }) => {
    const response = await mealService.getUserMeals(userId, filters);
    return response;
  }
);

export const fetchPublicMeals = createAsyncThunk(
  'meals/fetchPublicMeals',
  async (filters?: Omit<MealFilters, 'is_public'>) => {
    const response = await mealService.getPublicMeals(filters);
    return response;
  }
);

export const searchMeals = createAsyncThunk(
  'meals/searchMeals',
  async ({ query, filters }: { query: string; filters?: Omit<MealFilters, 'search'> }) => {
    const response = await mealService.searchMeals(query, filters);
    return response;
  }
);

export const uploadMealImage = createAsyncThunk(
  'meals/uploadMealImage',
  async ({ mealId, imageUri }: { mealId: string; imageUri: string }) => {
    const result = await mealService.uploadMealImage(mealId, imageUri);
    return { mealId, imageUrl: result.image_url };
  }
);

const mealSlice = createSlice({
  name: 'meals',
  initialState,
  reducers: {
    clearCurrentMeal: (state) => {
      state.currentMeal = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<MealFilters>) => {
      state.filters = action.payload;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    resetPagination: (state) => {
      state.pagination = {
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch meals
      .addCase(fetchMeals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMeals.fulfilled, (state, action) => {
        state.loading = false;
        const { meals, total, limit, offset } = action.payload;
        
        if (offset === 0) {
          state.meals = meals;
        } else {
          state.meals = [...state.meals, ...meals];
        }
        
        state.pagination = {
          total,
          limit,
          offset,
          hasMore: offset + meals.length < total
        };
      })
      .addCase(fetchMeals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch meals';
      })

      // Fetch meal by ID
      .addCase(fetchMealById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMealById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMeal = action.payload;
      })
      .addCase(fetchMealById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch meal';
      })

      // Create meal
      .addCase(createMeal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMeal.fulfilled, (state, action) => {
        state.loading = false;
        state.meals.unshift(action.payload);
        state.userMeals.unshift(action.payload);
        state.currentMeal = action.payload;
      })
      .addCase(createMeal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create meal';
      })

      // Update meal
      .addCase(updateMeal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMeal.fulfilled, (state, action) => {
        state.loading = false;
        const updatedMeal = action.payload;
        
        // Update in all relevant arrays
        const updateMealInArray = (meals: Meal[]) => {
          const index = meals.findIndex(meal => meal.id === updatedMeal.id);
          if (index !== -1) {
            meals[index] = updatedMeal;
          }
        };
        
        updateMealInArray(state.meals);
        updateMealInArray(state.userMeals);
        updateMealInArray(state.publicMeals);
        updateMealInArray(state.searchResults);
        
        if (state.currentMeal?.id === updatedMeal.id) {
          state.currentMeal = updatedMeal;
        }
      })
      .addCase(updateMeal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update meal';
      })

      // Delete meal
      .addCase(deleteMeal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMeal.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = action.payload;
        
        // Remove from all arrays
        state.meals = state.meals.filter(meal => meal.id !== deletedId);
        state.userMeals = state.userMeals.filter(meal => meal.id !== deletedId);
        state.publicMeals = state.publicMeals.filter(meal => meal.id !== deletedId);
        state.searchResults = state.searchResults.filter(meal => meal.id !== deletedId);
        
        if (state.currentMeal?.id === deletedId) {
          state.currentMeal = null;
        }
      })
      .addCase(deleteMeal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete meal';
      })

      // Fetch user meals
      .addCase(fetchUserMeals.fulfilled, (state, action) => {
        const { meals } = action.payload;
        state.userMeals = meals;
      })

      // Fetch public meals
      .addCase(fetchPublicMeals.fulfilled, (state, action) => {
        const { meals } = action.payload;
        state.publicMeals = meals;
      })

      // Search meals
      .addCase(searchMeals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchMeals.fulfilled, (state, action) => {
        state.loading = false;
        const { meals } = action.payload;
        state.searchResults = meals;
      })
      .addCase(searchMeals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to search meals';
      })

      // Upload meal image
      .addCase(uploadMealImage.fulfilled, (state, action) => {
        const { mealId, imageUrl } = action.payload;
        
        // Update image URL in all relevant arrays
        const updateImageInArray = (meals: Meal[]) => {
          const meal = meals.find(m => m.id === mealId);
          if (meal) {
            meal.image_url = imageUrl;
          }
        };
        
        updateImageInArray(state.meals);
        updateImageInArray(state.userMeals);
        updateImageInArray(state.publicMeals);
        updateImageInArray(state.searchResults);
        
        if (state.currentMeal?.id === mealId) {
          state.currentMeal.image_url = imageUrl;
        }
      });
  }
});

export const { 
  clearCurrentMeal, 
  clearError, 
  setFilters, 
  clearSearchResults, 
  resetPagination 
} = mealSlice.actions;

export default mealSlice.reducer;

// Selectors
export const selectMeals = (state: { meals: MealState }) => state.meals.meals;
export const selectCurrentMeal = (state: { meals: MealState }) => state.meals.currentMeal;
export const selectUserMeals = (state: { meals: MealState }) => state.meals.userMeals;
export const selectPublicMeals = (state: { meals: MealState }) => state.meals.publicMeals;
export const selectSearchResults = (state: { meals: MealState }) => state.meals.searchResults;
export const selectMealLoading = (state: { meals: MealState }) => state.meals.loading;
export const selectMealError = (state: { meals: MealState }) => state.meals.error;
export const selectMealPagination = (state: { meals: MealState }) => state.meals.pagination;
export const selectMealFilters = (state: { meals: MealState }) => state.meals.filters;