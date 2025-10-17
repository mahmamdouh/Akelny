import { Router } from 'express';
import { MealsController } from '../controllers/meals';
import { authenticateToken } from '../middleware/auth';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/meals/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'meal-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed'));
    }
  }
});

// Public routes
router.get('/', MealsController.getMeals);
router.get('/:id', MealsController.getMeal);

// Protected routes
router.post('/', authenticateToken, MealsController.createMeal);
router.put('/:id', authenticateToken, MealsController.updateMeal);
router.delete('/:id', authenticateToken, MealsController.deleteMeal);

// Image upload route
router.post('/:id/image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { id } = req.params;
    const userId = req.user?.id;

    // Check if meal exists and user has permission
    const { pool } = require('../config/database');
    const existingMeal = await pool.query(
      'SELECT * FROM meals WHERE id = $1',
      [id]
    );

    if (existingMeal.rows.length === 0) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    const meal = existingMeal.rows[0];
    if (meal.created_by_user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this meal' });
    }

    // Update meal with image URL
    const imageUrl = `/uploads/meals/${req.file.filename}`;
    await pool.query(
      'UPDATE meals SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [imageUrl, id]
    );

    res.json({ 
      message: 'Image uploaded successfully',
      image_url: imageUrl 
    });
  } catch (error) {
    console.error('Error uploading meal image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;