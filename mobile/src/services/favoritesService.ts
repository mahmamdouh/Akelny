import { apiClient } from './apiClient';
import { 
  UserFavorite, 
  AddFavoriteRequest, 
  FavoritesFilters,
  FavoritesListResponse 
} from '../../../shared/src/types/favorites';

export class FavoritesService {
  /**
   * Add a meal to favorites
   */
  static async addFavorite(data: AddFavoriteRequest): Promise<UserFavorite> {
    const response = await apiClient.post('/favorites', data);
    return response.data;
  }

  /**
   * Remove a meal from favorites
   */
  static async removeFavorite(mealId: string): Promise<void> {
    await apiClient.delete(`/favorites/${mealId}`);
  }

  /**
   * Get user's favorite meals with optional filters
   */
  static async getFavorites(filters?: FavoritesFilters): Promise<FavoritesListResponse> {
    const params = new URLSearchParams();
    
    if (filters?.meal_type) params.append('meal_type', filters.meal_type);
    if (filters?.kitchen_ids) {
      const kitchenIds = Array.isArray(filters.kitchen_ids) 
        ? filters.kitchen_ids.join(',') 
        : filters.kitchen_ids;
      params.append('kitchen_ids', kitchenIds);
    }
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get(`/favorites?${params.toString()}`);
    return response.data;
  }

  /**
   * Check if a meal is favorited by the user
   */
  static async checkFavorite(mealId: string): Promise<{ is_favorite: boolean }> {
    const response = await apiClient.get(`/favorites/check/${mealId}`);
    return response.data;
  }

  /**
   * Get user's favorite meal IDs (for suggestion weighting)
   */
  static async getFavoriteMealIds(): Promise<{ favorite_meal_ids: string[] }> {
    const response = await apiClient.get('/favorites/meal-ids');
    return response.data;
  }

  /**
   * Toggle favorite status of a meal
   */
  static async toggleFavorite(mealId: string): Promise<{ is_favorite: boolean }> {
    try {
      const { is_favorite } = await this.checkFavorite(mealId);
      
      if (is_favorite) {
        await this.removeFavorite(mealId);
        return { is_favorite: false };
      } else {
        await this.addFavorite({ meal_id: mealId });
        return { is_favorite: true };
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  /**
   * Get paginated favorites
   */
  static async getFavoritesPaginated(
    page: number = 1, 
    pageSize: number = 20,
    filters?: Omit<FavoritesFilters, 'limit' | 'offset'>
  ): Promise<FavoritesListResponse> {
    const offset = (page - 1) * pageSize;
    
    return this.getFavorites({
      ...filters,
      limit: pageSize,
      offset
    });
  }
}