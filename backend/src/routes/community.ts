import { Router } from 'express';
import { CommunityController } from '../controllers/community';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/meals', CommunityController.getCommunityMeals);

// Protected routes
router.post('/publish', authenticateToken, CommunityController.publishRecipe);
router.post('/report', authenticateToken, CommunityController.reportMeal);

// Admin routes (TODO: Add admin middleware when user roles are implemented)
router.get('/reports', authenticateToken, CommunityController.getReports);
router.get('/moderation/queue', authenticateToken, CommunityController.getModerationQueue);
router.get('/moderation/stats', authenticateToken, CommunityController.getModerationStats);
router.get('/meals/:meal_id/reports', authenticateToken, CommunityController.getMealReports);
router.post('/moderate/:meal_id', authenticateToken, CommunityController.moderateMeal);
router.put('/reports/:report_id/status', authenticateToken, CommunityController.updateReportStatus);

export default router;