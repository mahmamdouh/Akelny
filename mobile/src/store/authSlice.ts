import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  country: string;
  primaryKitchenId: string;
  language: 'en' | 'ar';
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
  country: string;
  language: 'en' | 'ar';
}

interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Login failed');
      }

      // Store tokens securely
      await SecureStore.setItemAsync('accessToken', data.data.token);
      await SecureStore.setItemAsync('refreshToken', data.data.refreshToken);

      return data.data as AuthResponse;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signup',
  async (signupData: SignupData, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Signup failed');
      }

      // Store tokens securely
      await SecureStore.setItemAsync('accessToken', data.data.token);
      await SecureStore.setItemAsync('refreshToken', data.data.refreshToken);

      return data.data as AuthResponse;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const loadStoredAuth = createAsyncThunk(
  'auth/loadStored',
  async (_, { rejectWithValue }) => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');

      if (!token) {
        return rejectWithValue('No stored token');
      }

      // Verify token by getting user profile
      const response = await fetch('http://localhost:3000/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Token might be expired, try to refresh
        if (refreshToken) {
          const refreshResponse = await fetch('http://localhost:3000/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            await SecureStore.setItemAsync('accessToken', refreshData.data.token);
            await SecureStore.setItemAsync('refreshToken', refreshData.data.refreshToken);

            // Get user profile with new token
            const profileResponse = await fetch('http://localhost:3000/api/auth/profile', {
              headers: {
                'Authorization': `Bearer ${refreshData.data.token}`,
              },
            });

            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              return {
                user: profileData.data.user,
                token: refreshData.data.token,
                refreshToken: refreshData.data.refreshToken,
              };
            }
          }
        }

        // Clear invalid tokens
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        return rejectWithValue('Invalid token');
      }

      const data = await response.json();
      return {
        user: data.data.user,
        token,
        refreshToken,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load stored auth');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const refreshToken = state.auth.refreshToken;

      if (refreshToken) {
        // Notify server about logout
        await fetch('http://localhost:3000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      }

      // Clear stored tokens
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');

      return null;
    } catch (error: any) {
      // Even if server logout fails, clear local tokens
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      return null;
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Signup
    builder
      .addCase(signupUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Load stored auth
    builder
      .addCase(loadStoredAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearError, setLoading } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectIsAuthenticated = (state: { auth: AuthState }) => !!state.auth.user;