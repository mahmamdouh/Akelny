import { Request, Response } from 'express';
import { pool } from '../config/database';

export class KitchensController {
  /**
   * Get all active kitchens
   */
  static async getKitchens(req: Request, res: Response): Promise<void> {
    try {
      const { language = 'en' } = req.query;

      const query = `
        SELECT 
          id,
          name_en,
          name_ar,
          description_en,
          description_ar,
          icon_url,
          is_active
        FROM kitchens
        WHERE is_active = true
        ORDER BY name_${language === 'ar' ? 'ar' : 'en'} ASC
      `;

      const result = await pool.query(query);

      res.json({
        kitchens: result.rows,
        total_count: result.rows.length
      });
    } catch (error) {
      console.error('Error fetching kitchens:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to fetch kitchens',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Get kitchen by ID
   */
  static async getKitchenById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          id,
          name_en,
          name_ar,
          description_en,
          description_ar,
          icon_url,
          is_active
        FROM kitchens
        WHERE id = $1 AND is_active = true
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        res.status(404).json({
          error: {
            code: 'BIZ_001',
            message: 'Kitchen not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      res.json({
        kitchen: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching kitchen:', error);
      res.status(500).json({
        error: {
          code: 'SYS_001',
          message: 'Failed to fetch kitchen',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
}