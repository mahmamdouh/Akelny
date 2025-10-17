import { Request, Response } from 'express';
import { pool } from '../config/database';
import { 
  CommunityMealFilters,
  CommunityMealListResponse,
  MealReport,
  CreateMealReportRequest,
  ModerationAction,
  PublishRecipeRequest,
  Meal
} from '../../../shared/src/types/meal';
import { ModerationService } from '../services/moderationService';

export class CommunityController {
  // Get community meals (public and approved)
  static async getCommunityMeals(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const filters: CommunityMealFilters = {
        kitchen_ids: req.query.kitchen_ids ? (req.query.kitchen_ids as string).split(',') : undefined,
        meal_type: req.query.meal_type as 'breakfast' | 'lunch' | 'dinner' | undefined,
        search: req.query.search as string | undefined,
        is_public: true, // Only public meals in community
        is_approved: req.query.is_approved !== undefined ? req.query.is_approved === 'true' : true,
        reported: req.query.reported === 'true' ? true : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const result = await CommunityController.getCommunityMealsWithFilters(filters, userId);
      res.json(result);
    } catch (error) {
      console.error('Error fetching community meals:', error);
      res.status(500).json({ error: 'Failed to fetch community meals' });
    }
  }

  // Publish a recipe to the community
  static async publishRecipe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { meal_id, is_public }: PublishRecipeRequest = req.body;

      if (!meal_id) {
        res.status(400).json({ error: 'meal_id is required' });
        return;
      }

      // Check if meal exists and user owns it
      const mealResult = await pool.query(
        'SELECT * FROM meals WHERE id = $1 AND created_by_user_id = $2',
        [meal_id, userId]
      );

      if (mealResult.rows.length === 0) {
        res.status(404).json({ error: 'Meal not found or not owned by user' });
        return;
      }

      // Update meal visibility
      const updatedMeal = await pool.query(`
        UPDATE meals 
        SET is_public = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND created_by_user_id = $3
        RETURNING *
      `, [is_public, meal_id, userId]);

      res.json({
        message: is_public ? 'Recipe published to community' : 'Recipe made private',
        meal: updatedMeal.rows[0]
      });
    } catch (error) {
      console.error('Error publishing recipe:', error);
      res.status(500).json({ error: 'Failed to publish recipe' });
    }
  }

  // Report a meal
  static async reportMeal(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const reportData: CreateMealReportRequest = req.body;

      if (!reportData.meal_id || !reportData.reason) {
        res.status(400).json({ error: 'meal_id and reason are required' });
        return;
      }

      // Check if meal exists and is public
      const mealResult = await pool.query(
        'SELECT * FROM meals WHERE id = $1 AND is_public = true',
        [reportData.meal_id]
      );

      if (mealResult.rows.length === 0) {
        res.status(404).json({ error: 'Meal not found or not public' });
        return;
      }

      // Check if user already reported this meal
      const existingReport = await pool.query(
        'SELECT * FROM meal_reports WHERE meal_id = $1 AND reported_by_user_id = $2',
        [reportData.meal_id, userId]
      );

      if (existingReport.rows.length > 0) {
        res.status(400).json({ error: 'You have already reported this meal' });
        return;
      }

      // Create report
      const reportResult = await pool.query(`
        INSERT INTO meal_reports (meal_id, reported_by_user_id, reason, description, status)
        VALUES ($1, $2, $3, $4, 'pending')
        RETURNING *
      `, [reportData.meal_id, userId, reportData.reason, reportData.description || null]);

      const report = reportResult.rows[0];

      res.status(201).json({
        message: 'Report submitted successfully',
        report: {
          id: report.id,
          meal_id: report.meal_id,
          reported_by_user_id: report.reported_by_user_id,
          reason: report.reason,
          description: report.description,
          status: report.status,
          created_at: report.created_at,
          updated_at: report.updated_at
        }
      });
    } catch (error) {
      console.error('Error reporting meal:', error);
      res.status(500).json({ error: 'Failed to report meal' });
    }
  }

  // Get reports (admin only)
  static async getReports(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // TODO: Add admin role check when user roles are implemented
      // For now, this is a placeholder for admin functionality

      const status = req.query.status as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      let whereClause = '';
      const queryParams: any[] = [];
      let paramCount = 1;

      if (status) {
        whereClause = `WHERE mr.status = $${paramCount++}`;
        queryParams.push(status);
      }

      const reportsResult = await pool.query(`
        SELECT 
          mr.*,
          m.title_en as meal_title_en,
          m.title_ar as meal_title_ar,
          m.image_url as meal_image_url,
          u.name as reporter_name
        FROM meal_reports mr
        LEFT JOIN meals m ON mr.meal_id = m.id
        LEFT JOIN users u ON mr.reported_by_user_id = u.id
        ${whereClause}
        ORDER BY mr.created_at DESC
        LIMIT $${paramCount++} OFFSET $${paramCount++}
      `, [...queryParams, limit, offset]);

      const reports: MealReport[] = reportsResult.rows.map(row => ({
        id: row.id,
        meal_id: row.meal_id,
        reported_by_user_id: row.reported_by_user_id,
        reason: row.reason,
        description: row.description,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        meal: row.meal_title_en ? {
          id: row.meal_id,
          title_en: row.meal_title_en,
          title_ar: row.meal_title_ar,
          image_url: row.meal_image_url,
          // Other meal fields would be populated if needed
        } as Partial<Meal> as Meal : undefined,
        reporter: row.reporter_name ? {
          id: row.reported_by_user_id,
          name: row.reporter_name,
          // Other user fields would be populated if needed
        } as Partial<any> : undefined
      }));

      res.json({ reports, total: reports.length, limit, offset });
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  }

  // Moderate a meal (admin only)
  static async moderateMeal(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // TODO: Add admin role check when user roles are implemented

      const { meal_id } = req.params;
      const { action, reason } = req.body;

      if (!action || !['approve', 'reject', 'hide'].includes(action)) {
        res.status(400).json({ error: 'Valid action (approve, reject, hide) is required' });
        return;
      }

      // Check if meal exists
      const mealResult = await pool.query('SELECT * FROM meals WHERE id = $1', [meal_id]);
      if (mealResult.rows.length === 0) {
        res.status(404).json({ error: 'Meal not found' });
        return;
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Update meal based on action
        let updateQuery = '';
        let updateParams: any[] = [];

        switch (action) {
          case 'approve':
            updateQuery = 'UPDATE meals SET is_approved = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1';
            updateParams = [meal_id];
            break;
          case 'reject':
            updateQuery = 'UPDATE meals SET is_approved = false, is_public = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1';
            updateParams = [meal_id];
            break;
          case 'hide':
            updateQuery = 'UPDATE meals SET is_public = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1';
            updateParams = [meal_id];
            break;
        }

        await client.query(updateQuery, updateParams);

        // Record moderation action
        const moderationResult = await client.query(`
          INSERT INTO moderation_actions (meal_id, moderator_user_id, action, reason)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `, [meal_id, userId, action, reason || null]);

        // Update related reports to resolved if approving
        if (action === 'approve') {
          await client.query(`
            UPDATE meal_reports 
            SET status = 'resolved', updated_at = CURRENT_TIMESTAMP 
            WHERE meal_id = $1 AND status = 'pending'
          `, [meal_id]);
        }

        await client.query('COMMIT');

        const moderationAction = moderationResult.rows[0];
        res.json({
          message: `Meal ${action}ed successfully`,
          moderation_action: {
            id: moderationAction.id,
            meal_id: moderationAction.meal_id,
            moderator_user_id: moderationAction.moderator_user_id,
            action: moderationAction.action,
            reason: moderationAction.reason,
            created_at: moderationAction.created_at
          }
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error moderating meal:', error);
      res.status(500).json({ error: 'Failed to moderate meal' });
    }
  }

  // Get moderation queue (admin only)
  static async getModerationQueue(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // TODO: Add admin role check when user roles are implemented

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const queue = await ModerationService.getModerationQueue(limit, offset);
      res.json({ queue, total: queue.length, limit, offset });
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      res.status(500).json({ error: 'Failed to fetch moderation queue' });
    }
  }

  // Get reports for a specific meal (admin only)
  static async getMealReports(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // TODO: Add admin role check when user roles are implemented

      const { meal_id } = req.params;
      const reports = await ModerationService.getMealReports(meal_id);
      res.json({ reports });
    } catch (error) {
      console.error('Error fetching meal reports:', error);
      res.status(500).json({ error: 'Failed to fetch meal reports' });
    }
  }

  // Get moderation statistics (admin only)
  static async getModerationStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // TODO: Add admin role check when user roles are implemented

      const stats = await ModerationService.getModerationStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching moderation stats:', error);
      res.status(500).json({ error: 'Failed to fetch moderation stats' });
    }
  }

  // Update report status (admin only)
  static async updateReportStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // TODO: Add admin role check when user roles are implemented

      const { report_id } = req.params;
      const { status } = req.body;

      if (!status || !['reviewed', 'resolved', 'dismissed'].includes(status)) {
        res.status(400).json({ error: 'Valid status (reviewed, resolved, dismissed) is required' });
        return;
      }

      const updatedReport = await ModerationService.updateReportStatus(report_id, status, userId);
      res.json({
        message: 'Report status updated successfully',
        report: updatedReport
      });
    } catch (error) {
      console.error('Error updating report status:', error);
      res.status(500).json({ error: 'Failed to update report status' });
    }
  }

  // Helper method to get community meals with filters
  private static async getCommunityMealsWithFilters(
    filters: CommunityMealFilters, 
    userId?: string
  ): Promise<CommunityMealListResponse> {
    try {
      let whereConditions: string[] = ['m.is_public = true'];
      let queryParams: any[] = [];
      let paramCount = 1;

      // Build WHERE conditions
      if (filters.kitchen_ids && filters.kitchen_ids.length > 0) {
        whereConditions.push(`m.kitchen_id = ANY($${paramCount++})`);
        queryParams.push(filters.kitchen_ids);
      }

      if (filters.meal_type) {
        whereConditions.push(`m.meal_type = $${paramCount++}`);
        queryParams.push(filters.meal_type);
      }

      if (filters.is_approved !== undefined) {
        whereConditions.push(`m.is_approved = $${paramCount++}`);
        queryParams.push(filters.is_approved);
      }

      if (filters.search) {
        whereConditions.push(`(
          m.title_en ILIKE $${paramCount} OR 
          m.title_ar ILIKE $${paramCount} OR 
          m.description_en ILIKE $${paramCount} OR 
          m.description_ar ILIKE $${paramCount}
        )`);
        queryParams.push(`%${filters.search}%`);
        paramCount++;
      }

      if (filters.reported) {
        whereConditions.push(`EXISTS (
          SELECT 1 FROM meal_reports mr 
          WHERE mr.meal_id = m.id AND mr.status = 'pending'
        )`);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM meals m
        ${whereClause}
      `;
      const countResult = await pool.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Build the main query with report counts and user report status
      let selectFields = `
        m.*,
        k.name_en as kitchen_name_en,
        k.name_ar as kitchen_name_ar,
        k.icon_url as kitchen_icon_url,
        u.name as creator_name,
        COALESCE(report_counts.report_count, 0) as report_count
      `;

      let userReportJoin = '';
      if (userId) {
        selectFields += `, CASE WHEN user_reports.id IS NOT NULL THEN true ELSE false END as is_reported_by_user`;
        userReportJoin = `
          LEFT JOIN meal_reports user_reports ON m.id = user_reports.meal_id 
            AND user_reports.reported_by_user_id = $${paramCount++}
        `;
        queryParams.push(userId);
      }

      // Get meals with pagination
      const mealsQuery = `
        SELECT ${selectFields}
        FROM meals m
        LEFT JOIN kitchens k ON m.kitchen_id = k.id
        LEFT JOIN users u ON m.created_by_user_id = u.id
        LEFT JOIN (
          SELECT meal_id, COUNT(*) as report_count
          FROM meal_reports
          WHERE status = 'pending'
          GROUP BY meal_id
        ) report_counts ON m.id = report_counts.meal_id
        ${userReportJoin}
        ${whereClause}
        ORDER BY m.created_at DESC
        LIMIT $${paramCount++} OFFSET $${paramCount++}
      `;
      
      queryParams.push(filters.limit || 20);
      queryParams.push(filters.offset || 0);

      const mealsResult = await pool.query(mealsQuery, queryParams);

      const meals = mealsResult.rows.map(row => ({
        id: row.id,
        title_en: row.title_en,
        title_ar: row.title_ar,
        description_en: row.description_en,
        description_ar: row.description_ar,
        kitchen_id: row.kitchen_id,
        meal_type: row.meal_type,
        servings: row.servings,
        prep_time_min: row.prep_time_min,
        cook_time_min: row.cook_time_min,
        steps_en: row.steps_en ? JSON.parse(row.steps_en) : undefined,
        steps_ar: row.steps_ar ? JSON.parse(row.steps_ar) : undefined,
        nutrition_totals: row.nutrition_totals ? JSON.parse(row.nutrition_totals) : undefined,
        image_url: row.image_url,
        created_by_user_id: row.created_by_user_id,
        is_public: row.is_public,
        is_approved: row.is_approved,
        created_at: row.created_at,
        updated_at: row.updated_at,
        kitchen: row.kitchen_name_en ? {
          id: row.kitchen_id,
          name_en: row.kitchen_name_en,
          name_ar: row.kitchen_name_ar,
          icon_url: row.kitchen_icon_url,
          is_active: true,
          created_at: ''
        } : undefined,
        creator: row.creator_name ? {
          id: row.created_by_user_id,
          name: row.creator_name,
          email: '',
          country: '',
          language: 'en' as const,
          created_at: '',
          updated_at: ''
        } : undefined,
        report_count: parseInt(row.report_count) || 0,
        is_reported_by_user: userId ? row.is_reported_by_user || false : undefined
      }));

      return {
        meals,
        total,
        limit: filters.limit || 20,
        offset: filters.offset || 0
      };
    } catch (error) {
      console.error('Error fetching community meals with filters:', error);
      throw error;
    }
  }
}