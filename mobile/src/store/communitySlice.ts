import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  CommunityMealListResponse, 
  CommunityMealFilters,
  Meal,
  CreateMealReportRequest,
  MealReport,
  PublishRecipeRequest
} from '../../../shared/src/types/meal';
import { communityService } from '../services/communityService';

interface CommunityState {
  meals: (Meal & { report_count?: number; is_reported_by_user?: boolean })[];
  loading: boolean;
  error: string | null;
  filters: CommunityMealFilters;
  total: number;
  hasMore: boolean;
  reports: MealReport[];
  reportingMealId: string | null;
  publishingMealId: string | null;
}

const initialState: CommunityState = {
  meals: [],
  loading: false,
  error: null,
  filters: {
    limit: 20,
    offset: 0,
    is_public: true,
    is_approved: true
  },
  total: 0,
  hasMore: true,
  reports: [],
  reportingMealId: null,
  publishingMealId: null
};

// Async thunks
export const fetchCommunityMeals = createAsyncThunk(
  'community/fetchCommunityMeals',
  async (params: { filters?: CommunityMealFilters; refresh?: boolean }) => {
    const { filters = {}, refresh = false } = params;
    const response = await communityService.getCommunityMeals(filters);
    return { ...response, refresh };
  }
);

export const publishRecipe = createAsyncThunk(
  'community/publishRecipe',
  async (data: PublishRecipeRequest) => {
    const response = await communityService.publishRecipe(data);
    return response;
  }
);

export const reportMeal = createAsyncThunk(
  'community/reportMeal',
  async (data: CreateMealReportRequest) => {
    const response = await communityService.reportMeal(data);
    return response;
  }
);

export const fetchUserReports = createAsyncThunk(
  'community/fetchUserReports',
  async () => {
    const response = await communityService.getUserReports();
    return response.reports;
  }
);

const communitySlice = createSlice({
  name: 'community',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<CommunityMealFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      if (action.payload.search !== undefined || 
          action.payload.kitchen_ids !== undefined || 
          action.payload.meal_type !== undefined) {
        // Reset pagination when filters change
        state.filters.offset = 0;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    setReportingMealId: (state, action: PayloadAction<string | null>) => {
      state.reportingMealId = action.payload;
    },
    setPublishingMealId: (state, action: PayloadAction<string | null>) => {
      state.publishingMealId = action.payload;
    },
    resetCommunityState: (state) => {
      state.meals = [];
      state.filters.offset = 0;
      state.hasMore = true;
      state.total = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch community meals
      .addCase(fetchCommunityMeals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommunityMeals.fulfilled, (state, action) => {
        state.loading = false;
        const { meals, total, limit, offset, refresh } = action.payload;
        
        if (refresh || offset === 0) {
          state.meals = meals;
        } else {
          state.meals = [...state.meals, ...meals];
        }
        
        state.total = total;
        state.hasMore = meals.length === limit;
        state.filters.offset = offset + meals.length;
      })
      .addCase(fetchCommunityMeals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch community meals';
      })
      
      // Publish recipe
      .addCase(publishRecipe.pending, (state, action) => {
        state.publishingMealId = action.meta.arg.meal_id;
      })
      .addCase(publishRecipe.fulfilled, (state, action) => {
        state.publishingMealId = null;
        // Update the meal in the list if it exists
        const mealIndex = state.meals.findIndex(meal => meal.id === action.meta.arg.meal_id);
        if (mealIndex !== -1) {
          state.meals[mealIndex].is_public = action.meta.arg.is_public;
        }
      })
      .addCase(publishRecipe.rejected, (state, action) => {
        state.publishingMealId = null;
        state.error = action.error.message || 'Failed to publish recipe';
      })
      
      // Report meal
      .addCase(reportMeal.pending, (state, action) => {
        state.reportingMealId = action.meta.arg.meal_id;
      })
      .addCase(reportMeal.fulfilled, (state, action) => {
        state.reportingMealId = null;
        // Mark the meal as reported by user
        const mealIndex = state.meals.findIndex(meal => meal.id === action.meta.arg.meal_id);
        if (mealIndex !== -1) {
          state.meals[mealIndex].is_reported_by_user = true;
          if (state.meals[mealIndex].report_count !== undefined) {
            state.meals[mealIndex].report_count! += 1;
          }
        }
        // Add to reports list
        state.reports.unshift(action.payload.report);
      })
      .addCase(reportMeal.rejected, (state, action) => {
        state.reportingMealId = null;
        state.error = action.error.message || 'Failed to report meal';
      })
      
      // Fetch user reports
      .addCase(fetchUserReports.fulfilled, (state, action) => {
        state.reports = action.payload;
      })
      .addCase(fetchUserReports.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch reports';
      });
  }
});

export const { 
  setFilters, 
  clearError, 
  setReportingMealId, 
  setPublishingMealId,
  resetCommunityState 
} = communitySlice.actions;

export default communitySlice.reducer;