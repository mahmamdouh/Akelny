import { Request, Response } from 'express';
import { pool } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

// Inline types to fix Docker build
interface CalendarEntry {
  id?: string;
  user_id: string;
  meal_id: string;
  planned_date?: string;
  scheduled_date?: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner';
  servings?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  meal?: any;
}

interface CreateCalendarEntryRequest {
  meal_id: string;
  planned_date?: string;
  scheduled_date?: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner';
  servings?: number;
  notes?: string;
}

interface UpdateCalendarEntryRequest {
  planned_date?: string;
  scheduled_date?: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner';
  servings?: number;
  notes?: string;
}

interface CalendarFilters {
  start_date?: string;
  end_date?: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner';
  limit?: number;
  offset?: number;
}

interface CalendarListResponse {
  entries: CalendarEntry[];
  total: number;
  limit?: number;
  offset?: number;
}

export class CalendarController {
  // Create a new calendar entry
  static async createEntry(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { meal_id, scheduled_date, notes }: CreateCalendarEntryRequest = req.body;

      if (!meal_id || !scheduled_date) {
        return res.status(400).json({ 
          error: 'Missing required fields: meal_id and scheduled_date' 
        });
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(scheduled_date)) {
        return res.status(400).json({ 
          error: 'Invalid date format. Use YYYY-MM-DD' 
        });
      }

      // Check if meal exists
      const mealCheck = await pool.query(
        'SELECT id FROM meals WHERE id = $1',
        [meal_id]
      );

      if (mealCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Meal not found' });
      }

      // Check if entry already exists for this user, meal, and date
      const existingEntry = await pool.query(
        'SELECT id FROM calendar_entries WHERE user_id = $1 AND meal_id = $2 AND scheduled_date = $3',
        [userId, meal_id, scheduled_date]
      );

      if (existingEntry.rows.length > 0) {
        return res.status(409).json({ 
          error: 'Meal already scheduled for this date' 
        });
      }

      // Create calendar entry
      const result = await pool.query(
        `INSERT INTO calendar_entries (user_id, meal_id, scheduled_date, notes)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, meal_id, scheduled_date, notes || null]
      );

      const entry: CalendarEntry = result.rows[0];
      res.status(201).json(entry);
    } catch (error) {
      console.error('Error creating calendar entry:', error);
      res.status(500).json({ error: 'Failed to create calendar entry' });
    }
  }

  // Get calendar entries for a user
  static async getEntries(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const {
        start_date,
        end_date,
        meal_type,
        limit = 50,
        offset = 0
      }: CalendarFilters = req.query as any;

      let query = `
        SELECT 
          ce.*,
          m.title_en,
          m.title_ar,
          m.description_en,
          m.description_ar,
          m.kitchen_id,
          m.meal_type,
          m.servings,
          m.prep_time_min,
          m.cook_time_min,
          m.nutrition_totals,
          m.image_url,
          m.is_public,
          m.created_at as meal_created_at
        FROM calendar_entries ce
        JOIN meals m ON ce.meal_id = m.id
        WHERE ce.user_id = $1
      `;

      const queryParams: any[] = [userId];
      let paramIndex = 2;

      if (start_date) {
        query += ` AND ce.scheduled_date >= $${paramIndex}`;
        queryParams.push(start_date);
        paramIndex++;
      }

      if (end_date) {
        query += ` AND ce.scheduled_date <= $${paramIndex}`;
        queryParams.push(end_date);
        paramIndex++;
      }

      if (meal_type) {
        query += ` AND m.meal_type = $${paramIndex}`;
        queryParams.push(meal_type);
        paramIndex++;
      }

      // Get total count
      const countQuery = query.replace(
        'SELECT ce.*, m.title_en, m.title_ar, m.description_en, m.description_ar, m.kitchen_id, m.meal_type, m.servings, m.prep_time_min, m.cook_time_min, m.nutrition_totals, m.image_url, m.is_public, m.created_at as meal_created_at',
        'SELECT COUNT(*)'
      );
      const countResult = await pool.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].count);

      // Add ordering, limit, and offset
      query += ` ORDER BY ce.scheduled_date DESC, ce.created_at DESC`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);

      const result = await pool.query(query, queryParams);

      const entries: CalendarEntry[] = result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        meal_id: row.meal_id,
        scheduled_date: row.scheduled_date,
        notes: row.notes,
        created_at: row.created_at,
        meal: {
          id: row.meal_id,
          title_en: row.title_en,
          title_ar: row.title_ar,
          description_en: row.description_en,
          description_ar: row.description_ar,
          kitchen_id: row.kitchen_id,
          meal_type: row.meal_type,
          servings: row.servings,
          prep_time_min: row.prep_time_min,
          cook_time_min: row.cook_time_min,
          steps_en: null,
          steps_ar: null,
          nutrition_totals: row.nutrition_totals,
          image_url: row.image_url,
          created_by_user_id: null,
          is_public: row.is_public,
          is_approved: true,
          created_at: row.meal_created_at,
          updated_at: row.meal_created_at
        }
      }));

      const response: CalendarListResponse = {
        entries,
        total,
        limit: parseInt(limit.toString()),
        offset: parseInt(offset.toString())
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching calendar entries:', error);
      res.status(500).json({ error: 'Failed to fetch calendar entries' });
    }
  }

  // Get a specific calendar entry
  static async getEntry(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { id } = req.params;

      const result = await pool.query(
        `SELECT 
          ce.*,
          m.title_en,
          m.title_ar,
          m.description_en,
          m.description_ar,
          m.kitchen_id,
          m.meal_type,
          m.servings,
          m.prep_time_min,
          m.cook_time_min,
          m.nutrition_totals,
          m.image_url,
          m.is_public,
          m.created_at as meal_created_at
        FROM calendar_entries ce
        JOIN meals m ON ce.meal_id = m.id
        WHERE ce.id = $1 AND ce.user_id = $2`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Calendar entry not found' });
      }

      const row = result.rows[0];
      const entry: CalendarEntry = {
        id: row.id,
        user_id: row.user_id,
        meal_id: row.meal_id,
        scheduled_date: row.scheduled_date,
        notes: row.notes,
        created_at: row.created_at,
        meal: {
          id: row.meal_id,
          title_en: row.title_en,
          title_ar: row.title_ar,
          description_en: row.description_en,
          description_ar: row.description_ar,
          kitchen_id: row.kitchen_id,
          meal_type: row.meal_type,
          servings: row.servings,
          prep_time_min: row.prep_time_min,
          cook_time_min: row.cook_time_min,
          steps_en: null,
          steps_ar: null,
          nutrition_totals: row.nutrition_totals,
          image_url: row.image_url,
          created_by_user_id: null,
          is_public: row.is_public,
          is_approved: true,
          created_at: row.meal_created_at,
          updated_at: row.meal_created_at
        }
      };

      res.json(entry);
    } catch (error) {
      console.error('Error fetching calendar entry:', error);
      res.status(500).json({ error: 'Failed to fetch calendar entry' });
    }
  }

  // Update a calendar entry
  static async updateEntry(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { id } = req.params;
      const { scheduled_date, notes }: UpdateCalendarEntryRequest = req.body;

      // Validate date format if provided
      if (scheduled_date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(scheduled_date)) {
          return res.status(400).json({ 
            error: 'Invalid date format. Use YYYY-MM-DD' 
          });
        }
      }

      // Check if entry exists and belongs to user
      const existingEntry = await pool.query(
        'SELECT * FROM calendar_entries WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (existingEntry.rows.length === 0) {
        return res.status(404).json({ error: 'Calendar entry not found' });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (scheduled_date !== undefined) {
        updates.push(`scheduled_date = $${paramIndex}`);
        values.push(scheduled_date);
        paramIndex++;
      }

      if (notes !== undefined) {
        updates.push(`notes = $${paramIndex}`);
        values.push(notes);
        paramIndex++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id, userId);

      const query = `
        UPDATE calendar_entries 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      const entry: CalendarEntry = result.rows[0];

      res.json(entry);
    } catch (error) {
      console.error('Error updating calendar entry:', error);
      res.status(500).json({ error: 'Failed to update calendar entry' });
    }
  }

  // Delete a calendar entry
  static async deleteEntry(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM calendar_entries WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Calendar entry not found' });
      }

      res.json({ message: 'Calendar entry deleted successfully' });
    } catch (error) {
      console.error('Error deleting calendar entry:', error);
      res.status(500).json({ error: 'Failed to delete calendar entry' });
    }
  }

  // Get recently selected meals (for exclusion from suggestions)
  static async getRecentMeals(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { days = 1 } = req.query;

      const result = await pool.query(
        `SELECT DISTINCT meal_id
         FROM calendar_entries
         WHERE user_id = $1 
         AND scheduled_date >= CURRENT_DATE - INTERVAL '${parseInt(days.toString())} days'
         AND scheduled_date <= CURRENT_DATE`,
        [userId]
      );

      const recentMealIds = result.rows.map(row => row.meal_id);
      res.json({ recent_meal_ids: recentMealIds });
    } catch (error) {
      console.error('Error fetching recent meals:', error);
      res.status(500).json({ error: 'Failed to fetch recent meals' });
    }
  }
}