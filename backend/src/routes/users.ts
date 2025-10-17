import { Router } from 'express';
import { UsersController } from '../controllers/users';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

// User profile routes
router.get('/profile', UsersController.getProfile);
router.put('/profile', UsersController.updateProfile);

// User preferences routes
router.put('/kitchen-preferences', UsersController.updateKitchenPreferences);
router.put('/pantry', UsersController.updatePantry);

// Public data routes (but still require auth to track user context)
router.get('/kitchens', UsersController.getAvailableKitchens);

export default router;