import { Router } from 'express';
import { SearchController } from '../controllers/search';

const router = Router();

// Ingredient search endpoints
router.get('/ingredients', SearchController.searchIngredients);

// Meal search endpoints
router.get('/meals', SearchController.searchMeals);

// Kitchen browsing endpoints
router.get('/kitchens', SearchController.getKitchensForBrowsing);
router.get('/kitchens/browse', SearchController.browseMealsByKitchen);

// Combined search endpoint
router.get('/all', SearchController.searchAll);

export default router;