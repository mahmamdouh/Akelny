import { apiClient } from './apiClient';
import { storage } from '../utils/storage';

export interface User {
  id: string;
  name: string;
  email: string;
  country: string;
  primaryKitchenId: string;
  language: 'en' | 'ar';
  createdAt: string;
  updatedAt: string;
}

export interface SignupRequest {
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

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

export const authService = {
  // Sign up new user
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/signup', data);
    const authData = response.data;
    
    // Store tokens securely
    await storage.setAuthTokens(authData.token, authData.refreshToken);
    await storage.setUser(authData.user);
    
    return authData;
  },

  // Login user
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data);
    const authData = response.data;
    
    // Store tokens securely
    await storage.setAuthTokens(authData.token, authData.refreshToken);
    await storage.setUser(authData.user);
    
    return authData;
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear local storage regardless of API call success
      await storage.clearAuthData();
    }
  },

  // Refresh access token
  refreshToken: async (): Promise<RefreshTokenResponse> => {
    const refreshToken = await storage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post('/auth/refresh', { refreshToken });
    const tokenData = response.data;
    
    // Update stored tokens
    await storage.setAuthTokens(tokenData.token, tokenData.refreshToken);
    
    return tokenData;
  },

  // Get current user from storage
  getCurrentUser: async (): Promise<User | null> => {
    return await storage.getUser();
  },

  // Get current auth token
  getAuthToken: async (): Promise<string | null> => {
    return await storage.getAuthToken();
  },

  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    const token = await storage.getAuthToken();
    const user = await storage.getUser();
    return !!(token && user);
  },

  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put('/auth/profile', data);
    const updatedUser = response.data.user;
    
    // Update stored user data
    await storage.setUser(updatedUser);
    
    return updatedUser;
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
  },

  // Request password reset
  requestPasswordReset: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  // Reset password with token
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', {
      token,
      newPassword
    });
  }
};