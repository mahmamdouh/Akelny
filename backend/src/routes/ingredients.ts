import { Router } from 'express';
import { IngredientsController } from '../controllers/ingredients';
import { PantryController } from '../controllers/pantry';
import { MealIngredientsController } from '../controllers/mealIngredients';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Ingredient routes
router.get('/', IngredientsController.getIngredients);
router.get('/search', IngredientsController.searchIngredients);
router.get('/categories', IngredientsController.getCategories);
router.get('/:id', IngredientsController.getIngredientById);
router.post('/', authenticateToken, IngredientsController.createIngredient);

// Pantry routes
router.get('/pantry/me', authenticateToken, PantryController.getUserPantry);
router.get('/pantry/stats', authenticateToken, PantryController.getPantryStats);
router.post('/pantry', authenticateToken, PantryController.addToPantry);
router.put('/pantry', authenticateToken, PantryController.updatePantry);
router.delete('/pantry/:ingredientId', authenticateToken, PantryController.removeFromPantry);

// Meal-ingredient relationship routes
router.get('/meals/:mealId', MealIngredientsController.getMealIngredients);
router.get('/meals/:mealId/eligibility', authenticateToken, MealIngredientsController.checkMealEligibility);
router.get('/eligible-meals', authenticateToken, MealIngredientsController.getEligibleMeals);
router.post('/nutrition/calculate', MealIngredientsController.calculateNutrition);
router.put('/meals/:mealId/:ingredientId/status', authenticateToken, MealIngredientsController.updateIngredientStatus);

export default router;