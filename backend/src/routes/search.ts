import { Router } from 'express';
import { SearchController } from '../controllers/search';
import { cacheConfigs } from '../middleware/cache';

const router = Router();

// Ingredient search endpoints
router.get('/ingredients', cacheConfigs.search, SearchController.searchIngredients);

// Meal search endpoints
router.get('/meals', cacheConfigs.search, SearchController.searchMeals);

// Kitchen browsing endpoints
router.get('/kitchens', cacheConfigs.static, SearchController.getKitchensForBrowsing);
router.get('/kitchens/browse', cacheConfigs.semiStatic, SearchController.browseMealsByKitchen);

// Combined search endpoint
router.get('/all', cacheConfigs.search, SearchController.searchAll);

export default router;