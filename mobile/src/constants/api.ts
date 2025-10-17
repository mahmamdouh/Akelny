// API Configuration
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://api.akelny.com/api';

export const API_ENDPOINTS = {
  // Auth
  AUTH: '/auth',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  REFRESH: '/auth/refresh',
  
  // Users
  USERS: '/users',
  USER_PROFILE: '/users/profile',
  
  // Ingredients
  INGREDIENTS: '/ingredients',
  PANTRY: '/users/pantry',
  
  // Meals
  MEALS: '/meals',
  
  // Suggestions
  SUGGESTIONS: '/suggestions',
  
  // Kitchens
  KITCHENS: '/kitchens'
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;

export const REQUEST_TIMEOUT = 10000; // 10 seconds