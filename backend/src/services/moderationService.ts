import { pool } from '../config/database';
import { MealReport, ModerationAction } from '../../../shared/src/types/meal';

export class ModerationService {
  // Get moderation queue (meals that need review)
  static async getModerationQueue(limit: number = 20, offset: number = 0) {
    try {
      const result = await pool.query(`
        SELECT 
          m.*,
          k.name_en as kitchen_name_en,
          k.name_ar as kitchen_name_ar,
          u.name as creator_name,
          u.email as creator_email,
          report_counts.report_count,
          latest_report.latest_report_date
        FROM meals m
        LEFT JOIN kitchens k ON m.kitchen_id = k.id
        LEFT JOIN users u ON m.created_by_user_id = u.id
        LEFT JOIN (
          SELECT meal_id, COUNT(*) as report_count
          FROM meal_reports
          WHERE status = 'pending'
          GROUP BY meal_id
        ) report_counts ON m.id = report_counts.meal_id
        LEFT JOIN (
          SELECT meal_id, MAX(created_at) as latest_report_date
          FROM meal_reports
          WHERE status = 'pending'
          GROUP BY meal_id
        ) latest_report ON m.id = latest_report.meal_id
        WHERE (
          (m.is_public = true AND m.is_approved = false) OR
          report_counts.report_count > 0
        )
        ORDER BY 
          CASE WHEN report_counts.report_count > 0 THEN 0 ELSE 1 END,
          report_counts.report_count DESC,
          latest_report.latest_report_date DESC,
          m.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      return result.rows.map(row => ({
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
          is_active: true,
          created_at: ''
        } : undefined,
        creator: row.creator_name ? {
          id: row.created_by_user_id,
          name: row.creator_name,
          email: row.creator_email,
          country: '',
          language: 'en' as const,
          created_at: '',
          updated_at: ''
        } : undefined,
        report_count: parseInt(row.report_count) || 0,
        latest_report_date: row.latest_report_date
      }));
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      throw error;
    }
  }

  // Get reports for a specific meal
  static async getMealReports(mealId: string): Promise<MealReport[]> {
    try {
      const result = await pool.query(`
        SELECT 
          mr.*,
          u.name as reporter_name,
          u.email as reporter_email
        FROM meal_reports mr
        LEFT JOIN users u ON mr.reported_by_user_id = u.id
        WHERE mr.meal_id = $1
        ORDER BY mr.created_at DESC
      `, [mealId]);

      return result.rows.map(row => ({
        id: row.id,
        meal_id: row.meal_id,
        reported_by_user_id: row.reported_by_user_id,
        reason: row.reason,
        description: row.description,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        reporter: row.reporter_name ? {
          id: row.reported_by_user_id,
          name: row.reporter_name,
          email: row.reporter_email,
          country: '',
          language: 'en' as const,
          created_at: '',
          updated_at: ''
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching meal reports:', error);
      throw error;
    }
  }

  // Update report status
  static async updateReportStatus(reportId: string, status: 'reviewed' | 'resolved' | 'dismissed', moderatorId: string) {
    try {
      const result = await pool.query(`
        UPDATE meal_reports 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [status, reportId]);

      return result.rows[0];
    } catch (error) {
      console.error('Error updating report status:', error);
      throw error;
    }
  }

  // Get moderation history for a meal
  static async getModerationHistory(mealId: string): Promise<ModerationAction[]> {
    try {
      const result = await pool.query(`
        SELECT 
          ma.*,
          u.name as moderator_name,
          u.email as moderator_email
        FROM moderation_actions ma
        LEFT JOIN users u ON ma.moderator_user_id = u.id
        WHERE ma.meal_id = $1
        ORDER BY ma.created_at DESC
      `, [mealId]);

      return result.rows.map(row => ({
        id: row.id,
        meal_id: row.meal_id,
        moderator_user_id: row.moderator_user_id,
        action: row.action,
        reason: row.reason,
        created_at: row.created_at,
        moderator: row.moderator_name ? {
          id: row.moderator_user_id,
          name: row.moderator_name,
          email: row.moderator_email,
          country: '',
          language: 'en' as const,
          created_at: '',
          updated_at: ''
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching moderation history:', error);
      throw error;
    }
  }

  // Auto-moderate based on report count threshold
  static async autoModerate(reportThreshold: number = 5) {
    try {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        // Find meals with high report counts
        const highReportMeals = await client.query(`
          SELECT meal_id, COUNT(*) as report_count
          FROM meal_reports
          WHERE status = 'pending'
          GROUP BY meal_id
          HAVING COUNT(*) >= $1
        `, [reportThreshold]);

        const moderatedMeals = [];

        for (const meal of highReportMeals.rows) {
          // Hide the meal automatically
          await client.query(`
            UPDATE meals 
            SET is_public = false, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $1
          `, [meal.meal_id]);

          // Record auto-moderation action
          await client.query(`
            INSERT INTO moderation_actions (meal_id, moderator_user_id, action, reason)
            VALUES ($1, $2, 'hide', $3)
          `, [
            meal.meal_id, 
            null, // System action, no specific moderator
            `Auto-moderated due to ${meal.report_count} reports`
          ]);

          // Mark reports as reviewed
          await client.query(`
            UPDATE meal_reports 
            SET status = 'reviewed', updated_at = CURRENT_TIMESTAMP 
            WHERE meal_id = $1 AND status = 'pending'
          `, [meal.meal_id]);

          moderatedMeals.push({
            meal_id: meal.meal_id,
            report_count: meal.report_count,
            action: 'auto_hidden'
          });
        }

        await client.query('COMMIT');
        return moderatedMeals;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error in auto-moderation:', error);
      throw error;
    }
  }

  // Get moderation statistics
  static async getModerationStats() {
    try {
      const stats = await pool.query(`
        SELECT 
          COUNT(CASE WHEN mr.status = 'pending' THEN 1 END) as pending_reports,
          COUNT(CASE WHEN mr.status = 'reviewed' THEN 1 END) as reviewed_reports,
          COUNT(CASE WHEN mr.status = 'resolved' THEN 1 END) as resolved_reports,
          COUNT(CASE WHEN mr.status = 'dismissed' THEN 1 END) as dismissed_reports,
          COUNT(DISTINCT mr.meal_id) as reported_meals,
          COUNT(CASE WHEN m.is_public = true AND m.is_approved = false THEN 1 END) as pending_approval
        FROM meal_reports mr
        LEFT JOIN meals m ON mr.meal_id = m.id
      `);

      const moderationActions = await pool.query(`
        SELECT 
          action,
          COUNT(*) as count
        FROM moderation_actions
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY action
      `);

      return {
        reports: stats.rows[0],
        recent_actions: moderationActions.rows.reduce((acc, row) => {
          acc[row.action] = parseInt(row.count);
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      console.error('Error fetching moderation stats:', error);
      throw error;
    }
  }
}