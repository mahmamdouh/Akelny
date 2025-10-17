import { Router } from 'express';
import { KitchensController } from '../controllers/kitchens';

const router = Router();

/**
 * @route GET /api/kitchens
 * @desc Get all active kitchens
 * @query {string} [language=en] - Language for sorting (en or ar)
 * @access Public
 */
router.get('/', KitchensController.getKitchens);

/**
 * @route GET /api/kitchens/:id
 * @desc Get kitchen by ID
 * @param {string} id - Kitchen ID
 * @access Public
 */
router.get('/:id', KitchensController.getKitchenById);

export default router;