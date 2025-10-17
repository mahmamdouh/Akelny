import { Router } from 'express';
import { SuggestionsController } from '../controllers/suggestions';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All suggestion routes require authentication
router.use(authenticateToken);

/**
 * @route GET /api/suggestions
 * @desc Get meal suggestions based on user preferences and pantry
 * @query {string} [mealType] - Filter by meal type (breakfast, lunch, dinner)
 * @query {string} [kitchenIds] - Comma-separated kitchen IDs to filter by
 * @query {string} [excludeRecent=true] - Exclude meals from recent days
 * @query {string} [strictMode=true] - Only return meals with all mandatory ingredients
 * @query {string} [favoriteBoost=true] - Boost favorite meals in ranking
 * @query {string} [limit=10] - Maximum number of suggestions (max 50)
 * @query {string} [offset=0] - Pagination offset
 * @access Private
 */
router.get('/', SuggestionsController.getSuggestions);

/**
 * @route POST /api/suggestions/filter-by-pantry
 * @desc Filter meals based on user's pantry ingredients
 * @query {string} [strictMode=false] - Only return meals with all mandatory ingredients
 * @query {string} [mealType] - Filter by meal type
 * @query {string} [kitchenIds] - Comma-separated kitchen IDs to filter by
 * @access Private
 */
router.post('/filter-by-pantry', SuggestionsController.filterByPantry);

/**
 * @route GET /api/suggestions/random
 * @desc Get random meal suggestions with weighted selection
 * @query {string} [count=3] - Number of random meals to return (max 10)
 * @query {string} [mealType] - Filter by meal type
 * @query {string} [kitchenIds] - Comma-separated kitchen IDs to filter by
 * @query {string} [excludeRecent=true] - Exclude meals from recent days
 * @query {string} [strictMode=true] - Only consider meals with all mandatory ingredients
 * @query {string} [favoriteBoost=true] - Boost favorite meals in selection
 * @access Private
 */
router.get('/random', SuggestionsController.getRandomPicker);

/**
 * @route DELETE /api/suggestions/cache
 * @desc Clear suggestion cache for the authenticated user
 * @desc Useful after pantry updates or preference changes
 * @access Private
 */
router.delete('/cache', SuggestionsController.clearCache);

/**
 * @route GET /api/suggestions/stats
 * @desc Get suggestion statistics and context for the user
 * @desc Useful for debugging and analytics
 * @access Private
 */
router.get('/stats', SuggestionsController.getStats);

export default router;