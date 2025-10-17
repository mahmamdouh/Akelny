export interface User {
  id: string;
  name: string;
  email: string;
  country: string;
  primaryKitchenId: string;
  language: 'en' | 'ar';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  userId: string;
  selectedKitchens: string[];
  pantryIngredients: string[];
  favoriteRecipes: string[];
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  country: string;
  language: 'en' | 'ar';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}