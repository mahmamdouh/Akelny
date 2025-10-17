import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  Ingredient, 
  IngredientCategory, 
  PantryIngredient, 
  IngredientFilters,
  PantryStats 
} from '../types/ingredient';
import ingredientService from '../services/ingredientService';

interface IngredientState {
  // Ingredients
  ingredients: Ingredient[];
  categories: IngredientCategory[];
  searchResults: Ingredient[];
  
  // Pantry
  pantry: PantryIngredient[];
  pantryStats: PantryStats | null;
  
  // UI State
  loading: {
    ingredients: boolean;
    categories: boolean;
    search: boolean;
    pantry: boolean;
    pantryStats: boolean;
    addToPantry: boolean;
    removeFromPantry: boolean;
  };
  
  error: {
    ingredients: string | null;
    categories: string | null;
    search: string | null;
    pantry: string | null;
    pantryStats: string | null;
    addToPantry: string | null;
    removeFromPantry: string | null;
  };
  
  // Pagination
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  
  // Filters
  filters: IngredientFilters;
  searchQuery: string;
}

const initialState: IngredientState = {
  ingredients: [],
  categories: [],
  searchResults: [],
  pantry: [],
  pantryStats: null,
  loading: {
    ingredients: false,
    categories: false,
    search: false,
    pantry: false,
    pantryStats: false,
    addToPantry: false,
    removeFromPantry: false,
  },
  error: {
    ingredients: null,
    categories: null,
    search: null,
    pantry: null,
    pantryStats: null,
    addToPantry: null,
    removeFromPantry: null,
  },
  pagination: {
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  },
  filters: {
    language: 'en',
    limit: 50,
    offset: 0,
  },
  searchQuery: '',
};

// Async Thunks

// Fetch ingredients
export const fetchIngredients = createAsyncThunk(
  'ingredients/fetchIngredients',
  async (filters: IngredientFilters = {}, { rejectWithValue }) => {
    try {
      const response = await ingredientService.getIngredients(filters);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch ingredients');
    }
  }
);

// Search ingredients
export const searchIngredients = createAsyncThunk(
  'ingredients/searchIngredients',
  async (
    { query, language = 'en', limit = 20 }: { 
      query: string; 
      language?: 'en' | 'ar'; 
      limit?: number; 
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await ingredientService.searchIngredients(query, language, limit);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to search ingredients');
    }
  }
);

// Fetch categories
export const fetchCategories = createAsyncThunk(
  'ingredients/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ingredientService.getCategories();
      return response.categories;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch categories');
    }
  }
);

// Fetch user pantry
export const fetchPantry = createAsyncThunk(
  'ingredients/fetchPantry',
  async (language: 'en' | 'ar' = 'en', { rejectWithValue }) => {
    try {
      const response = await ingredientService.getUserPantry(language);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch pantry');
    }
  }
);

// Add to pantry
export const addToPantry = createAsyncThunk(
  'ingredients/addToPantry',
  async (ingredientId: string, { rejectWithValue }) => {
    try {
      const response = await ingredientService.addToPantry(ingredientId);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add to pantry');
    }
  }
);

// Remove from pantry
export const removeFromPantry = createAsyncThunk(
  'ingredients/removeFromPantry',
  async (ingredientId: string, { rejectWithValue }) => {
    try {
      const response = await ingredientService.removeFromPantry(ingredientId);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to remove from pantry');
    }
  }
);

// Update pantry (bulk)
export const updatePantry = createAsyncThunk(
  'ingredients/updatePantry',
  async (ingredientIds: string[], { rejectWithValue }) => {
    try {
      const response = await ingredientService.updatePantry(ingredientIds);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update pantry');
    }
  }
);

// Fetch pantry stats
export const fetchPantryStats = createAsyncThunk(
  'ingredients/fetchPantryStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ingredientService.getPantryStats();
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch pantry stats');
    }
  }
);

const ingredientSlice = createSlice({
  name: 'ingredients',
  initialState,
  reducers: {
    // Clear search results
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
      state.error.search = null;
    },
    
    // Update filters
    updateFilters: (state, action: PayloadAction<Partial<IngredientFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    // Set search query
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    // Clear errors
    clearError: (state, action: PayloadAction<keyof IngredientState['error']>) => {
      state.error[action.payload] = null;
    },
    
    // Clear all errors
    clearAllErrors: (state) => {
      Object.keys(state.error).forEach(key => {
        state.error[key as keyof IngredientState['error']] = null;
      });
    },
    
    // Reset pagination
    resetPagination: (state) => {
      state.pagination = {
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch ingredients
    builder
      .addCase(fetchIngredients.pending, (state) => {
        state.loading.ingredients = true;
        state.error.ingredients = null;
      })
      .addCase(fetchIngredients.fulfilled, (state, action) => {
        state.loading.ingredients = false;
        state.ingredients = action.payload.ingredients;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchIngredients.rejected, (state, action) => {
        state.loading.ingredients = false;
        state.error.ingredients = action.payload as string;
      });

    // Search ingredients
    builder
      .addCase(searchIngredients.pending, (state) => {
        state.loading.search = true;
        state.error.search = null;
      })
      .addCase(searchIngredients.fulfilled, (state, action) => {
        state.loading.search = false;
        state.searchResults = action.payload.ingredients;
        state.searchQuery = action.payload.query;
      })
      .addCase(searchIngredients.rejected, (state, action) => {
        state.loading.search = false;
        state.error.search = action.payload as string;
      });

    // Fetch categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading.categories = true;
        state.error.categories = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading.categories = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading.categories = false;
        state.error.categories = action.payload as string;
      });

    // Fetch pantry
    builder
      .addCase(fetchPantry.pending, (state) => {
        state.loading.pantry = true;
        state.error.pantry = null;
      })
      .addCase(fetchPantry.fulfilled, (state, action) => {
        state.loading.pantry = false;
        state.pantry = action.payload.pantry;
      })
      .addCase(fetchPantry.rejected, (state, action) => {
        state.loading.pantry = false;
        state.error.pantry = action.payload as string;
      });

    // Add to pantry
    builder
      .addCase(addToPantry.pending, (state) => {
        state.loading.addToPantry = true;
        state.error.addToPantry = null;
      })
      .addCase(addToPantry.fulfilled, (state, action) => {
        state.loading.addToPantry = false;
        state.pantry.push(action.payload.ingredient);
      })
      .addCase(addToPantry.rejected, (state, action) => {
        state.loading.addToPantry = false;
        state.error.addToPantry = action.payload as string;
      });

    // Remove from pantry
    builder
      .addCase(removeFromPantry.pending, (state) => {
        state.loading.removeFromPantry = true;
        state.error.removeFromPantry = null;
      })
      .addCase(removeFromPantry.fulfilled, (state, action) => {
        state.loading.removeFromPantry = false;
        state.pantry = state.pantry.filter(
          item => item.id !== action.payload.ingredientId
        );
      })
      .addCase(removeFromPantry.rejected, (state, action) => {
        state.loading.removeFromPantry = false;
        state.error.removeFromPantry = action.payload as string;
      });

    // Update pantry
    builder
      .addCase(updatePantry.pending, (state) => {
        state.loading.pantry = true;
        state.error.pantry = null;
      })
      .addCase(updatePantry.fulfilled, (state, action) => {
        state.loading.pantry = false;
        state.pantry = action.payload.pantry;
      })
      .addCase(updatePantry.rejected, (state, action) => {
        state.loading.pantry = false;
        state.error.pantry = action.payload as string;
      });

    // Fetch pantry stats
    builder
      .addCase(fetchPantryStats.pending, (state) => {
        state.loading.pantryStats = true;
        state.error.pantryStats = null;
      })
      .addCase(fetchPantryStats.fulfilled, (state, action) => {
        state.loading.pantryStats = false;
        state.pantryStats = action.payload;
      })
      .addCase(fetchPantryStats.rejected, (state, action) => {
        state.loading.pantryStats = false;
        state.error.pantryStats = action.payload as string;
      });
  },
});

export const {
  clearSearchResults,
  updateFilters,
  setSearchQuery,
  clearError,
  clearAllErrors,
  resetPagination,
} = ingredientSlice.actions;

export default ingredientSlice.reducer;

// Selectors
export const selectIngredients = (state: { ingredients: IngredientState }) => state.ingredients.ingredients;
export const selectIngredientsLoading = (state: { ingredients: IngredientState }) => state.ingredients.loading;
export const selectIngredientsError = (state: { ingredients: IngredientState }) => state.ingredients.error;