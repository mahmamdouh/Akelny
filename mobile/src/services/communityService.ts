import { apiClient } from './apiClient';
import { 
  CommunityMealListResponse, 
  CommunityMealFilters,
  CreateMealReportRequest,
  MealReport,
  PublishRecipeRequest
} from '../../../shared/src/types/meal';

export const communityService = {
  // Get community meals
  getCommunityMeals: async (filters?: CommunityMealFilters): Promise<CommunityMealListResponse> => {
    const params = new URLSearchParams();
    
    if (filters?.kitchen_ids?.length) {
      params.append('kitchen_ids', filters.kitchen_ids.join(','));
    }
    if (filters?.meal_type) {
      params.append('meal_type', filters.meal_type);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.is_approved !== undefined) {
      params.append('is_approved', filters.is_approved.toString());
    }
    if (filters?.reported !== undefined) {
      params.append('reported', filters.reported.toString());
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters?.offset) {
      params.append('offset', filters.offset.toString());
    }

    const response = await apiClient.get(`/community/meals?${params.toString()}`);
    return response.data;
  },

  // Publish recipe to community
  publishRecipe: async (data: PublishRecipeRequest): Promise<{ message: string; meal: any }> => {
    const response = await apiClient.post('/community/publish', data);
    return response.data;
  },

  // Report a meal
  reportMeal: async (data: CreateMealReportRequest): Promise<{ message: string; report: MealReport }> => {
    const response = await apiClient.post('/community/report', data);
    return response.data;
  },

  // Get user's own reports
  getUserReports: async (): Promise<{ reports: MealReport[] }> => {
    const response = await apiClient.get('/community/reports');
    return response.data;
  }
};