import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import ingredientReducer from './ingredientSlice';
import suggestionReducer from './suggestionSlice';
import mealReducer from './mealSlice';
import calendarReducer from './calendarSlice';
import favoritesReducer from './favoritesSlice';
import communityReducer from './communitySlice';
import searchReducer from './searchSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ingredients: ingredientReducer,
    suggestions: suggestionReducer,
    meals: mealReducer,
    calendar: calendarReducer,
    favorites: favoritesReducer,
    community: communityReducer,
    search: searchReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;