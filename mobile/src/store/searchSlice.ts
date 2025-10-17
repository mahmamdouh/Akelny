import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SearchService } from '../services/searchService';
import {
  IngredientSearchResult,
  MealSearchResult,
  KitchenBrowseResult,
  SearchPagination,
  IngredientSearchFilters,
  MealSearchFilters,
  KitchenBrowseFilters,
  CombinedSearchResult
} from '../../../shared/src/types/search';

interface SearchState {
  // Ingredient search
  ingredientResults: IngredientSearchResult[];
  ingredientPagination: SearchPagination | null;
  ingredientLoading: boolean;
  ingredientError: string | null;

  // Meal search
  mealResults: MealSearchResult[];
  mealPagination: SearchPagination | null;
  mealLoading: boolean;
  mealError: string | null;

  // Kitchen browsing
  kitchens: KitchenBrowseResult[];
  kitchensLoading: boolean;
  kitchensError: string | null;

  // Kitchen meal browsing
  kitchenMeals: MealSearchResult[];
  kitchenMealsPagination: SearchPagination | null;
  kitchenMealsLoading: boolean;
  kitchenMealsError: string | null;
  selectedKitchen: KitchenBrowseResult | null;

  // Combined search
  combinedResults: CombinedSearchResult;
  combinedLoading: boolean;
  combinedError: string | null;

  // Search history
  recentSearches: string[];
  
  // Current search state
  currentQuery: string;
  currentLanguage: 'en' | 'ar';
}

const initialState: SearchState = {
  ingredientResults: [],
  ingredientPagination: null,
  ingredientLoading: false,
  ingredientError: null,

  mealResults: [],
  mealPagination: null,
  mealLoading: false,
  mealError: null,

  kitchens: [],
  kitchensLoading: false,
  kitchensError: null,

  kitchenMeals: [],
  kitchenMealsPagination: null,
  kitchenMealsLoading: false,
  kitchenMealsError: null,
  selectedKitchen: null,

  combinedResults: {},
  combinedLoading: false,
  combinedError: null,

  recentSearches: [],
  currentQuery: '',
  currentLanguage: 'en'
};

// Async thunks
export const searchIngredients = createAsyncThunk(
  'search/searchIngredients',
  async (filters: IngredientSearchFilters, { rejectWithValue }) => {
    try {
      const response = await SearchService.searchIngredients(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to search ingredients');
    }
  }
);

export const searchMeals = createAsyncThunk(
  'search/searchMeals',
  async (filters: MealSearchFilters, { rejectWithValue }) => {
    try {
      const response = await SearchService.searchMeals(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to search meals');
    }
  }
);

export const loadMoreIngredients = createAsyncThunk(
  'search/loadMoreIngredients',
  async (filters: IngredientSearchFilters, { rejectWithValue }) => {
    try {
      const response = await SearchService.searchIngredients(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to load more ingredients');
    }
  }
);

export const loadMoreMeals = createAsyncThunk(
  'search/loadMoreMeals',
  async (filters: MealSearchFilters, { rejectWithValue }) => {
    try {
      const response = await SearchService.searchMeals(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to load more meals');
    }
  }
);

export const fetchKitchensForBrowsing = createAsyncThunk(
  'search/fetchKitchensForBrowsing',
  async (_, { rejectWithValue }) => {
    try {
      const response = await SearchService.getKitchensForBrowsing();
      return response.kitchens;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch kitchens');
    }
  }
);

export const browseMealsByKitchen = createAsyncThunk(
  'search/browseMealsByKitchen',
  async (filters: KitchenBrowseFilters, { rejectWithValue }) => {
    try {
      const response = await SearchService.browseMealsByKitchen(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to browse meals by kitchen');
    }
  }
);

export const loadMoreKitchenMeals = createAsyncThunk(
  'search/loadMoreKitchenMeals',
  async (filters: KitchenBrowseFilters, { rejectWithValue }) => {
    try {
      const response = await SearchService.browseMealsByKitchen(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to load more kitchen meals');
    }
  }
);

export const searchAll = createAsyncThunk(
  'search/searchAll',
  async (params: { query: string; language?: 'en' | 'ar'; types?: string; limit?: number }, { rejectWithValue }) => {
    try {
      const { query, language = 'en', types = 'ingredients,meals', limit = 10 } = params;
      const response = await SearchService.searchAll(query, language, types, limit);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to perform search');
    }
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    clearIngredientResults: (state) => {
      state.ingredientResults = [];
      state.ingredientPagination = null;
      state.ingredientError = null;
    },
    clearMealResults: (state) => {
      state.mealResults = [];
      state.mealPagination = null;
      state.mealError = null;
    },
    clearKitchenMeals: (state) => {
      state.kitchenMeals = [];
      state.kitchenMealsPagination = null;
      state.kitchenMealsError = null;
      state.selectedKitchen = null;
    },
    clearCombinedResults: (state) => {
      state.combinedResults = {};
      state.combinedError = null;
    },
    setCurrentQuery: (state, action: PayloadAction<string>) => {
      state.currentQuery = action.payload;
    },
    setCurrentLanguage: (state, action: PayloadAction<'en' | 'ar'>) => {
      state.currentLanguage = action.payload;
    },
    addToRecentSearches: (state, action: PayloadAction<string>) => {
      const query = action.payload.trim();
      if (query && !state.recentSearches.includes(query)) {
        state.recentSearches = [query, ...state.recentSearches.slice(0, 9)]; // Keep last 10 searches
      }
    },
    clearRecentSearches: (state) => {
      state.recentSearches = [];
    },
    clearAllSearchResults: (state) => {
      state.ingredientResults = [];
      state.ingredientPagination = null;
      state.ingredientError = null;
      state.mealResults = [];
      state.mealPagination = null;
      state.mealError = null;
      state.kitchenMeals = [];
      state.kitchenMealsPagination = null;
      state.kitchenMealsError = null;
      state.selectedKitchen = null;
      state.combinedResults = {};
      state.combinedError = null;
      state.currentQuery = '';
    }
  },
  extraReducers: (builder) => {
    // Search ingredients
    builder
      .addCase(searchIngredients.pending, (state) => {
        state.ingredientLoading = true;
        state.ingredientError = null;
      })
      .addCase(searchIngredients.fulfilled, (state, action) => {
        state.ingredientLoading = false;
        state.ingredientResults = action.payload.ingredients;
        state.ingredientPagination = action.payload.pagination;
      })
      .addCase(searchIngredients.rejected, (state, action) => {
        state.ingredientLoading = false;
        state.ingredientError = action.payload as string;
      });

    // Load more ingredients
    builder
      .addCase(loadMoreIngredients.pending, (state) => {
        state.ingredientLoading = true;
      })
      .addCase(loadMoreIngredients.fulfilled, (state, action) => {
        state.ingredientLoading = false;
        state.ingredientResults = [...state.ingredientResults, ...action.payload.ingredients];
        state.ingredientPagination = action.payload.pagination;
      })
      .addCase(loadMoreIngredients.rejected, (state, action) => {
        state.ingredientLoading = false;
        state.ingredientError = action.payload as string;
      });

    // Search meals
    builder
      .addCase(searchMeals.pending, (state) => {
        state.mealLoading = true;
        state.mealError = null;
      })
      .addCase(searchMeals.fulfilled, (state, action) => {
        state.mealLoading = false;
        state.mealResults = action.payload.meals;
        state.mealPagination = action.payload.pagination;
      })
      .addCase(searchMeals.rejected, (state, action) => {
        state.mealLoading = false;
        state.mealError = action.payload as string;
      });

    // Load more meals
    builder
      .addCase(loadMoreMeals.pending, (state) => {
        state.mealLoading = true;
      })
      .addCase(loadMoreMeals.fulfilled, (state, action) => {
        state.mealLoading = false;
        state.mealResults = [...state.mealResults, ...action.payload.meals];
        state.mealPagination = action.payload.pagination;
      })
      .addCase(loadMoreMeals.rejected, (state, action) => {
        state.mealLoading = false;
        state.mealError = action.payload as string;
      });

    // Fetch kitchens for browsing
    builder
      .addCase(fetchKitchensForBrowsing.pending, (state) => {
        state.kitchensLoading = true;
        state.kitchensError = null;
      })
      .addCase(fetchKitchensForBrowsing.fulfilled, (state, action) => {
        state.kitchensLoading = false;
        state.kitchens = action.payload;
      })
      .addCase(fetchKitchensForBrowsing.rejected, (state, action) => {
        state.kitchensLoading = false;
        state.kitchensError = action.payload as string;
      });

    // Browse meals by kitchen
    builder
      .addCase(browseMealsByKitchen.pending, (state) => {
        state.kitchenMealsLoading = true;
        state.kitchenMealsError = null;
      })
      .addCase(browseMealsByKitchen.fulfilled, (state, action) => {
        state.kitchenMealsLoading = false;
        state.kitchenMeals = action.payload.meals;
        state.kitchenMealsPagination = action.payload.pagination;
        state.selectedKitchen = {
          ...action.payload.kitchen,
          meal_count: action.payload.pagination.total
        };
      })
      .addCase(browseMealsByKitchen.rejected, (state, action) => {
        state.kitchenMealsLoading = false;
        state.kitchenMealsError = action.payload as string;
      });

    // Load more kitchen meals
    builder
      .addCase(loadMoreKitchenMeals.pending, (state) => {
        state.kitchenMealsLoading = true;
      })
      .addCase(loadMoreKitchenMeals.fulfilled, (state, action) => {
        state.kitchenMealsLoading = false;
        state.kitchenMeals = [...state.kitchenMeals, ...action.payload.meals];
        state.kitchenMealsPagination = action.payload.pagination;
      })
      .addCase(loadMoreKitchenMeals.rejected, (state, action) => {
        state.kitchenMealsLoading = false;
        state.kitchenMealsError = action.payload as string;
      });

    // Combined search
    builder
      .addCase(searchAll.pending, (state) => {
        state.combinedLoading = true;
        state.combinedError = null;
      })
      .addCase(searchAll.fulfilled, (state, action) => {
        state.combinedLoading = false;
        state.combinedResults = action.payload.results;
      })
      .addCase(searchAll.rejected, (state, action) => {
        state.combinedLoading = false;
        state.combinedError = action.payload as string;
      });
  }
});

export const {
  clearIngredientResults,
  clearMealResults,
  clearKitchenMeals,
  clearCombinedResults,
  setCurrentQuery,
  setCurrentLanguage,
  addToRecentSearches,
  clearRecentSearches,
  clearAllSearchResults
} = searchSlice.actions;

export default searchSlice.reducer;