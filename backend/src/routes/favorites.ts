import { Router } from 'express';
import { FavoritesController } from '../controllers/favorites';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All favorites routes require authentication
router.use(authenticateToken);

// Favorites management
router.post('/', FavoritesController.addFavorite);
router.get('/', FavoritesController.getFavorites);
router.get('/meal-ids', FavoritesController.getFavoriteMealIds);
router.get('/check/:meal_id', FavoritesController.checkFavorite);
router.delete('/:meal_id', FavoritesController.removeFavorite);

export default router;