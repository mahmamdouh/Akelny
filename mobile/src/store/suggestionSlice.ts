import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { suggestionService, SuggestionOptions, RandomPickerOptions } from '../services/suggestionService';
import { SuggestionResult, RandomPickerResult, SuggestionFilters, MealSuggestion } from '../types/suggestion';

interface SuggestionState {
  // Current suggestions
  suggestions: MealSuggestion[];
  totalCount: number;
  appliedFilters: SuggestionFilters;
  metadata: {
    eligibleMealsCount: number;
    partialMatchesCount: number;
    excludedRecentCount: number;
    favoriteBoostApplied: boolean;
  };
  
  // Random picker results
  randomMeals: MealSuggestion[];
  randomSelectionCriteria: any;
  
  // UI state
  isLoading: boolean;
  isLoadingRandom: boolean;
  error: string | null;
  
  // Filters
  currentFilters: SuggestionFilters;
  
  // Cache info
  cached: boolean;
  lastUpdated: string | null;
}

const initialState: SuggestionState = {
  suggestions: [],
  totalCount: 0,
  appliedFilters: {},
  metadata: {
    eligibleMealsCount: 0,
    partialMatchesCount: 0,
    excludedRecentCount: 0,
    favoriteBoostApplied: false,
  },
  randomMeals: [],
  randomSelectionCriteria: null,
  isLoading: false,
  isLoadingRandom: false,
  error: null,
  currentFilters: {
    excludeRecent: true,
    strictMode: true,
    favoriteBoost: true,
  },
  cached: false,
  lastUpdated: null,
};

// Async thunks
export const fetchSuggestions = createAsyncThunk(
  'suggestions/fetchSuggestions',
  async (options: SuggestionOptions = {}, { rejectWithValue }) => {
    try {
      const result = await suggestionService.getSuggestions(options);
      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch suggestions');
    }
  }
);

export const fetchRandomSuggestions = createAsyncThunk(
  'suggestions/fetchRandomSuggestions',
  async (options: RandomPickerOptions = {}, { rejectWithValue }) => {
    try {
      const result = await suggestionService.getRandomSuggestions(options);
      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch random suggestions');
    }
  }
);

export const filterByPantry = createAsyncThunk(
  'suggestions/filterByPantry',
  async (options: { strictMode?: boolean; mealType?: string; kitchenIds?: string[] } = {}, { rejectWithValue }) => {
    try {
      const result = await suggestionService.filterByPantry(options);
      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to filter by pantry');
    }
  }
);

export const clearSuggestionCache = createAsyncThunk(
  'suggestions/clearCache',
  async (_, { rejectWithValue }) => {
    try {
      await suggestionService.clearCache();
      return true;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to clear cache');
    }
  }
);

const suggestionSlice = createSlice({
  name: 'suggestions',
  initialState,
  reducers: {
    // Update current filters
    updateFilters: (state, action: PayloadAction<Partial<SuggestionFilters>>) => {
      state.currentFilters = { ...state.currentFilters, ...action.payload };
    },
    
    // Clear suggestions
    clearSuggestions: (state) => {
      state.suggestions = [];
      state.totalCount = 0;
      state.appliedFilters = {};
      state.metadata = initialState.metadata;
      state.error = null;
    },
    
    // Clear random meals
    clearRandomMeals: (state) => {
      state.randomMeals = [];
      state.randomSelectionCriteria = null;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Toggle favorite status for a meal
    toggleMealFavorite: (state, action: PayloadAction<string>) => {
      const mealId = action.payload;
      
      // Update in suggestions
      const suggestionIndex = state.suggestions.findIndex(meal => meal.id === mealId);
      if (suggestionIndex !== -1) {
        state.suggestions[suggestionIndex].is_favorite = !state.suggestions[suggestionIndex].is_favorite;
      }
      
      // Update in random meals
      const randomIndex = state.randomMeals.findIndex(meal => meal.id === mealId);
      if (randomIndex !== -1) {
        state.randomMeals[randomIndex].is_favorite = !state.randomMeals[randomIndex].is_favorite;
      }
    },
    
    // Reset filters to default
    resetFilters: (state) => {
      state.currentFilters = initialState.currentFilters;
    },
  },
  extraReducers: (builder) => {
    // Fetch suggestions
    builder
      .addCase(fetchSuggestions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.suggestions = action.payload.suggestions;
        state.totalCount = action.payload.totalCount;
        state.appliedFilters = action.payload.appliedFilters;
        state.metadata = action.payload.metadata;
        state.cached = action.payload.cached || false;
        state.lastUpdated = action.payload.timestamp;
        state.error = null;
      })
      .addCase(fetchSuggestions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Fetch random suggestions
    builder
      .addCase(fetchRandomSuggestions.pending, (state) => {
        state.isLoadingRandom = true;
        state.error = null;
      })
      .addCase(fetchRandomSuggestions.fulfilled, (state, action) => {
        state.isLoadingRandom = false;
        state.randomMeals = action.payload.meals;
        state.randomSelectionCriteria = action.payload.selectionCriteria;
        state.error = null;
      })
      .addCase(fetchRandomSuggestions.rejected, (state, action) => {
        state.isLoadingRandom = false;
        state.error = action.payload as string;
      });
    
    // Filter by pantry
    builder
      .addCase(filterByPantry.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(filterByPantry.fulfilled, (state, action) => {
        state.isLoading = false;
        // Combine eligible meals and partial matches
        state.suggestions = [...action.payload.eligibleMeals, ...action.payload.partialMatches];
        state.totalCount = state.suggestions.length;
        state.error = null;
      })
      .addCase(filterByPantry.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Clear cache
    builder
      .addCase(clearSuggestionCache.fulfilled, (state) => {
        state.cached = false;
        // Optionally clear current suggestions to force refresh
        state.suggestions = [];
        state.totalCount = 0;
      });
  },
});

export const {
  updateFilters,
  clearSuggestions,
  clearRandomMeals,
  clearError,
  toggleMealFavorite,
  resetFilters,
} = suggestionSlice.actions;

export default suggestionSlice.reducer;