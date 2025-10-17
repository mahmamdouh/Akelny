import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { FavoritesService } from '../services/favoritesService';
import { 
  UserFavorite, 
  AddFavoriteRequest, 
  FavoritesFilters 
} from '../../../shared/src/types/favorites';

interface FavoritesState {
  favorites: UserFavorite[];
  favoriteMealIds: Set<string>;
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filters: FavoritesFilters;
}

const initialState: FavoritesState = {
  favorites: [],
  favoriteMealIds: new Set(),
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 20,
  filters: {}
};

// Async thunks
export const addFavorite = createAsyncThunk(
  'favorites/addFavorite',
  async (data: AddFavoriteRequest, { rejectWithValue }) => {
    try {
      return await FavoritesService.addFavorite(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add favorite');
    }
  }
);

export const removeFavorite = createAsyncThunk(
  'favorites/removeFavorite',
  async (mealId: string, { rejectWithValue }) => {
    try {
      await FavoritesService.removeFavorite(mealId);
      return mealId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to remove favorite');
    }
  }
);

export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (filters?: FavoritesFilters, { rejectWithValue }) => {
    try {
      return await FavoritesService.getFavorites(filters);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch favorites');
    }
  }
);

export const checkFavorite = createAsyncThunk(
  'favorites/checkFavorite',
  async (mealId: string, { rejectWithValue }) => {
    try {
      const result = await FavoritesService.checkFavorite(mealId);
      return { mealId, is_favorite: result.is_favorite };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to check favorite status');
    }
  }
);

export const fetchFavoriteMealIds = createAsyncThunk(
  'favorites/fetchFavoriteMealIds',
  async (_, { rejectWithValue }) => {
    try {
      const result = await FavoritesService.getFavoriteMealIds();
      return result.favorite_meal_ids;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch favorite meal IDs');
    }
  }
);

export const toggleFavorite = createAsyncThunk(
  'favorites/toggleFavorite',
  async (mealId: string, { rejectWithValue }) => {
    try {
      const result = await FavoritesService.toggleFavorite(mealId);
      return { mealId, is_favorite: result.is_favorite };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to toggle favorite');
    }
  }
);

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<FavoritesFilters>) => {
      state.filters = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetFavorites: (state) => {
      return initialState;
    },
    // Local state update for immediate UI feedback
    updateFavoriteStatus: (state, action: PayloadAction<{ mealId: string; is_favorite: boolean }>) => {
      const { mealId, is_favorite } = action.payload;
      if (is_favorite) {
        state.favoriteMealIds.add(mealId);
      } else {
        state.favoriteMealIds.delete(mealId);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Add favorite
      .addCase(addFavorite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addFavorite.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites.unshift(action.payload);
        state.favoriteMealIds.add(action.payload.meal_id);
        state.totalCount += 1;
      })
      .addCase(addFavorite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Remove favorite
      .addCase(removeFavorite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = state.favorites.filter(fav => fav.meal_id !== action.payload);
        state.favoriteMealIds.delete(action.payload);
        state.totalCount = Math.max(0, state.totalCount - 1);
      })
      .addCase(removeFavorite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch favorites
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload.favorites;
        state.totalCount = action.payload.total;
        // Update favorite meal IDs set
        state.favoriteMealIds = new Set(action.payload.favorites.map(fav => fav.meal_id));
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Check favorite
      .addCase(checkFavorite.fulfilled, (state, action) => {
        const { mealId, is_favorite } = action.payload;
        if (is_favorite) {
          state.favoriteMealIds.add(mealId);
        } else {
          state.favoriteMealIds.delete(mealId);
        }
      })

      // Fetch favorite meal IDs
      .addCase(fetchFavoriteMealIds.fulfilled, (state, action) => {
        state.favoriteMealIds = new Set(action.payload);
      })

      // Toggle favorite
      .addCase(toggleFavorite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        state.loading = false;
        const { mealId, is_favorite } = action.payload;
        
        if (is_favorite) {
          state.favoriteMealIds.add(mealId);
          // If we have the meal data, add it to favorites list
          // This would need to be handled by fetching the meal data
        } else {
          state.favoriteMealIds.delete(mealId);
          state.favorites = state.favorites.filter(fav => fav.meal_id !== mealId);
          state.totalCount = Math.max(0, state.totalCount - 1);
        }
      })
      .addCase(toggleFavorite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const {
  setFilters,
  setCurrentPage,
  clearError,
  resetFavorites,
  updateFavoriteStatus
} = favoritesSlice.actions;

export default favoritesSlice.reducer;