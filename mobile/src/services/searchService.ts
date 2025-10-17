import { apiClient } from './apiClient';
import {
  IngredientSearchResponse,
  MealSearchResponse,
  KitchenBrowseResponse,
  KitchensListResponse,
  CombinedSearchResponse,
  IngredientSearchFilters,
  MealSearchFilters,
  KitchenBrowseFilters
} from '../../../shared/src/types/search';

export class SearchService {
  // Search ingredients with bilingual text matching
  static async searchIngredients(filters: IngredientSearchFilters): Promise<IngredientSearchResponse> {
    const params = new URLSearchParams();
    
    if (filters.query) params.append('query', filters.query);
    if (filters.language) params.append('language', filters.language);
    if (filters.category) params.append('category', filters.category);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get(`/search/ingredients?${params.toString()}`);
    return response.data;
  }

  // Search meals with multiple criteria support
  static async searchMeals(filters: MealSearchFilters): Promise<MealSearchResponse> {
    const params = new URLSearchParams();
    
    if (filters.query) params.append('query', filters.query);
    if (filters.language) params.append('language', filters.language);
    if (filters.kitchen_ids && filters.kitchen_ids.length > 0) {
      params.append('kitchen_ids', filters.kitchen_ids.join(','));
    }
    if (filters.meal_type) params.append('meal_type', filters.meal_type);
    if (filters.is_public !== undefined) params.append('is_public', filters.is_public.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get(`/search/meals?${params.toString()}`);
    return response.data;
  }

  // Browse meals by kitchen
  static async browseMealsByKitchen(filters: KitchenBrowseFilters): Promise<KitchenBrowseResponse> {
    const params = new URLSearchParams();
    
    params.append('kitchen_id', filters.kitchen_id);
    if (filters.meal_type) params.append('meal_type', filters.meal_type);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get(`/search/kitchens/browse?${params.toString()}`);
    return response.data;
  }

  // Get all available kitchens for browsing
  static async getKitchensForBrowsing(): Promise<KitchensListResponse> {
    const response = await apiClient.get('/search/kitchens');
    return response.data;
  }

  // Combined search for both ingredients and meals
  static async searchAll(
    query: string,
    language: 'en' | 'ar' = 'en',
    types: string = 'ingredients,meals',
    limit: number = 10
  ): Promise<CombinedSearchResponse> {
    const params = new URLSearchParams({
      query,
      language,
      types,
      limit: limit.toString()
    });

    const response = await apiClient.get(`/search/all?${params.toString()}`);
    return response.data;
  }
}