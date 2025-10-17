import { SuggestionResult, RandomPickerResult, SuggestionFilters, Kitchen } from '../types/suggestion';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface SuggestionOptions extends SuggestionFilters {
  limit?: number;
  offset?: number;
}

export interface RandomPickerOptions extends SuggestionFilters {
  count?: number;
}

export interface PantryFilterOptions {
  strictMode?: boolean;
  mealType?: string;
  kitchenIds?: string[];
}

class SuggestionService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    // This will be implemented when we have auth token storage
    // For now, return empty headers
    return {
      'Content-Type': 'application/json',
    };
  }

  private async getAuthToken(): Promise<string | null> {
    // This will be implemented when we have auth token storage
    // For now, return null
    return null;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
  /**
   * Get meal suggestions based on user preferences and pantry
   */
  async getSuggestions(options: SuggestionOptions = {}): Promise<SuggestionResult> {
    const params = new URLSearchParams();
    
    if (options.mealType) params.append('mealType', options.mealType);
    if (options.kitchenIds?.length) params.append('kitchenIds', options.kitchenIds.join(','));
    if (options.excludeRecent !== undefined) params.append('excludeRecent', options.excludeRecent.toString());
    if (options.strictMode !== undefined) params.append('strictMode', options.strictMode.toString());
    if (options.favoriteBoost !== undefined) params.append('favoriteBoost', options.favoriteBoost.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    return this.makeRequest<SuggestionResult>(`/suggestions?${params.toString()}`);
  }

  /**
   * Get random meal suggestions
   */
  async getRandomSuggestions(options: RandomPickerOptions = {}): Promise<RandomPickerResult> {
    const params = new URLSearchParams();
    
    if (options.count) params.append('count', options.count.toString());
    if (options.mealType) params.append('mealType', options.mealType);
    if (options.kitchenIds?.length) params.append('kitchenIds', options.kitchenIds.join(','));
    if (options.excludeRecent !== undefined) params.append('excludeRecent', options.excludeRecent.toString());
    if (options.strictMode !== undefined) params.append('strictMode', options.strictMode.toString());
    if (options.favoriteBoost !== undefined) params.append('favoriteBoost', options.favoriteBoost.toString());

    return this.makeRequest<RandomPickerResult>(`/suggestions/random?${params.toString()}`);
  }

  /**
   * Filter meals by pantry ingredients
   */
  async filterByPantry(options: PantryFilterOptions = {}): Promise<{
    eligibleMeals: any[];
    partialMatches: any[];
  }> {
    const params = new URLSearchParams();
    
    if (options.strictMode !== undefined) params.append('strictMode', options.strictMode.toString());
    if (options.mealType) params.append('mealType', options.mealType);
    if (options.kitchenIds?.length) params.append('kitchenIds', options.kitchenIds.join(','));

    return this.makeRequest<{
      eligibleMeals: any[];
      partialMatches: any[];
    }>(`/suggestions/filter-by-pantry?${params.toString()}`, {
      method: 'POST',
    });
  }

  /**
   * Clear suggestion cache
   */
  async clearCache(): Promise<void> {
    await this.makeRequest<void>('/suggestions/cache', {
      method: 'DELETE',
    });
  }

  /**
   * Get suggestion statistics
   */
  async getStats(): Promise<any> {
    return this.makeRequest<any>('/suggestions/stats');
  }

  /**
   * Get available kitchens
   */
  async getKitchens(): Promise<Kitchen[]> {
    return this.makeRequest<Kitchen[]>('/kitchens');
  }

  // Utility methods for UI

  /**
   * Get localized meal title
   */
  getLocalizedTitle(meal: any, language: 'en' | 'ar'): string {
    if (language === 'ar' && meal.title_ar) {
      return meal.title_ar;
    }
    return meal.title_en;
  }

  /**
   * Get localized kitchen name
   */
  getLocalizedKitchenName(meal: any, language: 'en' | 'ar'): string {
    if (language === 'ar' && meal.kitchen_name_ar) {
      return meal.kitchen_name_ar;
    }
    return meal.kitchen_name_en;
  }

  /**
   * Get availability score color
   */
  getAvailabilityScoreColor(score: number): string {
    if (score >= 90) return '#22c55e'; // green
    if (score >= 70) return '#f97316'; // orange
    if (score >= 50) return '#eab308'; // yellow
    return '#ef4444'; // red
  }

  /**
   * Get match quality label
   */
  getMatchQuality(score: number, missingMandatory: number): 'perfect' | 'good' | 'partial' {
    if (missingMandatory === 0 && score >= 90) return 'perfect';
    if (missingMandatory === 0 && score >= 70) return 'good';
    return 'partial';
  }

  /**
   * Format cooking time
   */
  formatCookingTime(prepTime?: number, cookTime?: number): string {
    const total = (prepTime || 0) + (cookTime || 0);
    if (total === 0) return '';
    return `${total} min`;
  }

  /**
   * Get meal type icon
   */
  getMealTypeIcon(mealType: string): string {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      default: return '🍽️';
    }
  }
}

export const suggestionService = new SuggestionService();