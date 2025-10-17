import { 
  Ingredient, 
  IngredientCategory, 
  PantryIngredient, 
  IngredientSearchResult,
  PantryStats,
  CreateIngredientRequest,
  IngredientFilters,
  IngredientsResponse,
  PantryResponse
} from '../types/ingredient';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

class IngredientService {
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

  // Get all ingredients with optional filtering
  async getIngredients(filters: IngredientFilters = {}): Promise<IngredientsResponse> {
    const queryParams = new URLSearchParams();
    
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.language) queryParams.append('language', filters.language);
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    if (filters.offset) queryParams.append('offset', filters.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/ingredients${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<IngredientsResponse>(endpoint);
  }

  // Search ingredients
  async searchIngredients(
    query: string, 
    language: 'en' | 'ar' = 'en', 
    limit: number = 20
  ): Promise<IngredientSearchResult> {
    const queryParams = new URLSearchParams({
      q: query,
      language,
      limit: limit.toString(),
    });

    return this.makeRequest<IngredientSearchResult>(`/ingredients/search?${queryParams}`);
  }

  // Get ingredient by ID
  async getIngredientById(id: string): Promise<{ ingredient: Ingredient }> {
    return this.makeRequest<{ ingredient: Ingredient }>(`/ingredients/${id}`);
  }

  // Get ingredient categories
  async getCategories(): Promise<{ categories: IngredientCategory[] }> {
    return this.makeRequest<{ categories: IngredientCategory[] }>('/ingredients/categories');
  }

  // Create new ingredient (user-contributed)
  async createIngredient(ingredient: CreateIngredientRequest): Promise<{
    ingredient: Ingredient;
    message: string;
  }> {
    return this.makeRequest<{ ingredient: Ingredient; message: string }>(
      '/ingredients',
      {
        method: 'POST',
        body: JSON.stringify(ingredient),
      }
    );
  }

  // Pantry Management
  
  // Get user's pantry
  async getUserPantry(language: 'en' | 'ar' = 'en'): Promise<PantryResponse> {
    const queryParams = new URLSearchParams({ language });
    return this.makeRequest<PantryResponse>(`/ingredients/pantry/me?${queryParams}`);
  }

  // Add ingredient to pantry
  async addToPantry(ingredientId: string): Promise<{
    message: string;
    ingredient: PantryIngredient;
  }> {
    return this.makeRequest<{ message: string; ingredient: PantryIngredient }>(
      '/ingredients/pantry',
      {
        method: 'POST',
        body: JSON.stringify({ ingredientId }),
      }
    );
  }

  // Remove ingredient from pantry
  async removeFromPantry(ingredientId: string): Promise<{
    message: string;
    ingredientId: string;
  }> {
    return this.makeRequest<{ message: string; ingredientId: string }>(
      `/ingredients/pantry/${ingredientId}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Update entire pantry (bulk operation)
  async updatePantry(ingredientIds: string[]): Promise<{
    message: string;
    pantry: PantryIngredient[];
    count: number;
  }> {
    return this.makeRequest<{
      message: string;
      pantry: PantryIngredient[];
      count: number;
    }>(
      '/ingredients/pantry',
      {
        method: 'PUT',
        body: JSON.stringify({ ingredientIds }),
      }
    );
  }

  // Get pantry statistics
  async getPantryStats(): Promise<PantryStats> {
    return this.makeRequest<PantryStats>('/ingredients/pantry/stats');
  }

  // Utility methods for UI

  // Get localized ingredient name
  getLocalizedName(ingredient: Ingredient, language: 'en' | 'ar'): string {
    if (language === 'ar' && ingredient.name_ar) {
      return ingredient.name_ar;
    }
    return ingredient.name_en;
  }

  // Get ingredient status color
  getStatusColor(status: 'mandatory' | 'recommended' | 'optional'): string {
    switch (status) {
      case 'mandatory':
        return '#22c55e'; // green
      case 'recommended':
        return '#f97316'; // orange
      case 'optional':
        return '#6b7280'; // gray
      default:
        return '#6b7280';
    }
  }

  // Format nutrition value
  formatNutritionValue(value: number | undefined, unit: string = 'g'): string {
    if (value === undefined || value === null) return '-';
    return `${value.toFixed(1)}${unit}`;
  }

  // Get category display name (localized)
  getCategoryDisplayName(category: string, language: 'en' | 'ar'): string {
    const categoryMap: Record<string, { en: string; ar: string }> = {
      grains: { en: 'Grains & Cereals', ar: 'الحبوب والنشويات' },
      protein: { en: 'Protein', ar: 'البروتين' },
      legumes: { en: 'Legumes', ar: 'البقوليات' },
      vegetables: { en: 'Vegetables', ar: 'الخضروات' },
      fruits: { en: 'Fruits', ar: 'الفواكه' },
      dairy: { en: 'Dairy', ar: 'منتجات الألبان' },
      oils: { en: 'Oils & Fats', ar: 'الزيوت والدهون' },
      spices: { en: 'Spices', ar: 'التوابل' },
      herbs: { en: 'Herbs', ar: 'الأعشاب' },
    };

    const categoryInfo = categoryMap[category.toLowerCase()];
    if (categoryInfo) {
      return language === 'ar' ? categoryInfo.ar : categoryInfo.en;
    }
    
    // Fallback: capitalize first letter
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  // Check if ingredient is in pantry
  isInPantry(ingredientId: string, pantry: PantryIngredient[]): boolean {
    return pantry.some(item => item.id === ingredientId);
  }

  // Filter ingredients by category
  filterByCategory(ingredients: Ingredient[], category: string): Ingredient[] {
    if (!category) return ingredients;
    return ingredients.filter(ingredient => 
      ingredient.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Sort ingredients by name (localized)
  sortByName(ingredients: Ingredient[], language: 'en' | 'ar'): Ingredient[] {
    return [...ingredients].sort((a, b) => {
      const nameA = this.getLocalizedName(a, language).toLowerCase();
      const nameB = this.getLocalizedName(b, language).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }
}

export default new IngredientService();