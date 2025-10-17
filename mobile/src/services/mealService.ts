import { 
  Meal, 
  CreateMealRequest, 
  UpdateMealRequest, 
  MealFilters,
  MealListResponse 
} from '../../../shared/src/types/meal';
// import { API_BASE_URL } from '../constants/api';
const API_BASE_URL = 'http://localhost:3000/api';
import { getStoredToken } from '../utils/storage';

class MealService {
  private baseUrl = `${API_BASE_URL}/meals`;

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await getStoredToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  async getMeals(filters?: MealFilters): Promise<MealListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.kitchen_ids?.length) {
        queryParams.append('kitchen_ids', filters.kitchen_ids.join(','));
      }
      if (filters?.meal_type) {
        queryParams.append('meal_type', filters.meal_type);
      }
      if (filters?.is_public !== undefined) {
        queryParams.append('is_public', filters.is_public.toString());
      }
      if (filters?.created_by_user_id) {
        queryParams.append('created_by_user_id', filters.created_by_user_id);
      }
      if (filters?.search) {
        queryParams.append('search', filters.search);
      }
      if (filters?.limit) {
        queryParams.append('limit', filters.limit.toString());
      }
      if (filters?.offset) {
        queryParams.append('offset', filters.offset.toString());
      }

      const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch meals: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching meals:', error);
      throw error;
    }
  }

  async getMealById(id: string): Promise<Meal> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Meal not found');
        }
        throw new Error(`Failed to fetch meal: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching meal:', error);
      throw error;
    }
  }

  async createMeal(mealData: CreateMealRequest): Promise<Meal> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(mealData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create meal: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating meal:', error);
      throw error;
    }
  }

  async updateMeal(id: string, updateData: UpdateMealRequest): Promise<Meal> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          throw new Error('Meal not found');
        }
        if (response.status === 403) {
          throw new Error('Not authorized to update this meal');
        }
        throw new Error(errorData.error || `Failed to update meal: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating meal:', error);
      throw error;
    }
  }

  async deleteMeal(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Meal not found');
        }
        if (response.status === 403) {
          throw new Error('Not authorized to delete this meal');
        }
        throw new Error(`Failed to delete meal: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting meal:', error);
      throw error;
    }
  }

  async uploadMealImage(mealId: string, imageUri: string): Promise<{ image_url: string }> {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'meal-image.jpg'
      } as any);

      const token = await getStoredToken();
      const response = await fetch(`${this.baseUrl}/${mealId}/image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to upload image: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading meal image:', error);
      throw error;
    }
  }

  // Helper method to get user's own meals
  async getUserMeals(userId: string, filters?: Omit<MealFilters, 'created_by_user_id'>): Promise<MealListResponse> {
    return this.getMeals({
      ...filters,
      created_by_user_id: userId
    });
  }

  // Helper method to get public meals
  async getPublicMeals(filters?: Omit<MealFilters, 'is_public'>): Promise<MealListResponse> {
    return this.getMeals({
      ...filters,
      is_public: true
    });
  }

  // Helper method to search meals
  async searchMeals(query: string, filters?: Omit<MealFilters, 'search'>): Promise<MealListResponse> {
    return this.getMeals({
      ...filters,
      search: query
    });
  }
}

export const mealService = new MealService();