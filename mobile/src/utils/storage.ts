// Conditional import for AsyncStorage
let AsyncStorage: any;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (error) {
  console.warn('AsyncStorage not available, using fallback');
  AsyncStorage = {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
    clear: async () => {},
    getAllKeys: async () => [],
  };
}

/**
 * Storage utility for persisting user preferences
 */

// Storage keys
export const STORAGE_KEYS = {
  LANGUAGE: 'user_language',
  THEME: 'user_theme',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  USER_PREFERENCES: 'user_preferences',
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

/**
 * Generic storage functions
 */

// Store data
export const storeData = async (key: string, value: any): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error(`Failed to store data for key ${key}:`, error);
    throw error;
  }
};

// Retrieve data
export const getData = async <T>(key: string, defaultValue?: T): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    if (jsonValue === null) {
      return defaultValue || null;
    }
    return JSON.parse(jsonValue) as T;
  } catch (error) {
    console.error(`Failed to retrieve data for key ${key}:`, error);
    return defaultValue || null;
  }
};

// Remove data
export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove data for key ${key}:`, error);
    throw error;
  }
};

// Clear all data
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Failed to clear all data:', error);
    throw error;
  }
};

/**
 * Language-specific storage functions
 */

// Store language preference
export const storeLanguage = async (languageCode: string): Promise<void> => {
  await storeData(STORAGE_KEYS.LANGUAGE, languageCode);
};

// Get stored language preference
export const getStoredLanguage = async (): Promise<string | null> => {
  return await getData<string>(STORAGE_KEYS.LANGUAGE);
};

// Remove language preference
export const removeLanguage = async (): Promise<void> => {
  await removeData(STORAGE_KEYS.LANGUAGE);
};

/**
 * User preferences storage
 */

export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  primaryKitchen?: string;
  selectedKitchens: string[];
}

// Store user preferences
export const storeUserPreferences = async (preferences: Partial<UserPreferences>): Promise<void> => {
  try {
    const currentPreferences = await getUserPreferences();
    const updatedPreferences = { ...currentPreferences, ...preferences };
    await storeData(STORAGE_KEYS.USER_PREFERENCES, updatedPreferences);
  } catch (error) {
    console.error('Failed to store user preferences:', error);
    throw error;
  }
};

// Get user preferences
export const getUserPreferences = async (): Promise<UserPreferences> => {
  const defaultPreferences: UserPreferences = {
    language: 'en',
    theme: 'system',
    notifications: true,
    selectedKitchens: [],
  };
  
  try {
    const preferences = await getData<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES);
    return { ...defaultPreferences, ...preferences };
  } catch (error) {
    console.error('Failed to get user preferences:', error);
    return defaultPreferences;
  }
};

// Update specific preference
export const updateUserPreference = async <K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): Promise<void> => {
  try {
    const preferences = await getUserPreferences();
    preferences[key] = value;
    await storeUserPreferences(preferences);
  } catch (error) {
    console.error(`Failed to update preference ${key}:`, error);
    throw error;
  }
};

/**
 * Onboarding storage
 */

// Mark onboarding as completed
export const markOnboardingCompleted = async (): Promise<void> => {
  await storeData(STORAGE_KEYS.ONBOARDING_COMPLETED, true);
};

// Check if onboarding is completed
export const isOnboardingCompleted = async (): Promise<boolean> => {
  const completed = await getData<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETED, false);
  return completed || false;
};

// Reset onboarding status
export const resetOnboardingStatus = async (): Promise<void> => {
  await removeData(STORAGE_KEYS.ONBOARDING_COMPLETED);
};

/**
 * Migration utilities
 */

// Migrate old storage format to new format
export const migrateStorage = async (): Promise<void> => {
  try {
    // Check if migration is needed
    const oldLanguage = await AsyncStorage.getItem('language');
    if (oldLanguage && !await getStoredLanguage()) {
      await storeLanguage(oldLanguage);
      await AsyncStorage.removeItem('language');
    }
    
    // Add more migration logic as needed
  } catch (error) {
    console.error('Storage migration failed:', error);
  }
};

/**
 * Authentication token storage
 */

// Store authentication token
export const storeToken = async (token: string): Promise<void> => {
  await storeData(STORAGE_KEYS.AUTH_TOKEN, token);
};

// Get stored authentication token
export const getStoredToken = async (): Promise<string | null> => {
  return await getData<string>(STORAGE_KEYS.AUTH_TOKEN);
};

// Remove authentication token
export const removeToken = async (): Promise<void> => {
  await removeData(STORAGE_KEYS.AUTH_TOKEN);
};

// Store refresh token
export const storeRefreshToken = async (token: string): Promise<void> => {
  await storeData(STORAGE_KEYS.REFRESH_TOKEN, token);
};

// Get stored refresh token
export const getStoredRefreshToken = async (): Promise<string | null> => {
  return await getData<string>(STORAGE_KEYS.REFRESH_TOKEN);
};

// Remove refresh token
export const removeRefreshToken = async (): Promise<void> => {
  await removeData(STORAGE_KEYS.REFRESH_TOKEN);
};

// Clear all authentication data
export const clearAuthData = async (): Promise<void> => {
  await removeToken();
  await removeRefreshToken();
};

/**
 * Debug utilities
 */

// Get all stored keys (for debugging)
export const getAllStorageKeys = async (): Promise<string[]> => {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('Failed to get storage keys:', error);
    return [];
  }
};

// Get all stored data (for debugging)
export const getAllStorageData = async (): Promise<Record<string, any>> => {
  try {
    const keys = await getAllStorageKeys();
    const data: Record<string, any> = {};
    
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      try {
        data[key] = JSON.parse(value || '');
      } catch {
        data[key] = value;
      }
    }
    
    return data;
  } catch (error) {
    console.error('Failed to get all storage data:', error);
    return {};
  }
};