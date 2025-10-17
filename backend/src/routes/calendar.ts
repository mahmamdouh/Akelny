import { Router } from 'express';
import { CalendarController } from '../controllers/calendar';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All calendar routes require authentication
router.use(authenticateToken);

// Calendar entry CRUD operations
router.post('/', CalendarController.createEntry);
router.get('/', CalendarController.getEntries);
router.get('/recent-meals', CalendarController.getRecentMeals);
router.get('/:id', CalendarController.getEntry);
router.put('/:id', CalendarController.updateEntry);
router.delete('/:id', CalendarController.deleteEntry);

export default router;