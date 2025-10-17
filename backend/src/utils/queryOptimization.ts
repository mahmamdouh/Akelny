import { Pool, PoolClient } from 'pg';

// Query performance monitoring
interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  params?: any[];
}

class QueryOptimizer {
  private metrics: QueryMetrics[] = [];
  private slowQueryThreshold = 1000; // 1 second

  // Execute query with performance monitoring
  async executeQuery(
    pool: Pool | PoolClient,
    query: string,
    params?: any[]
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      const result = await pool.query(query, params);
      const duration = Date.now() - startTime;
      
      // Log slow queries
      if (duration > this.slowQueryThreshold) {
        console.warn(`🐌 Slow query detected (${duration}ms):`, {
          query: query.substring(0, 200) + '...',
          duration,
          params: params?.length
        });
      }
      
      // Store metrics
      this.metrics.push({
        query: query.substring(0, 100),
        duration,
        timestamp: new Date(),
        params
      });
      
      // Keep only last 1000 metrics
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Query error (${duration}ms):`, {
        query: query.substring(0, 200),
        error: error instanceof Error ? error.message : error,
        params
      });
      throw error;
    }
  }

  // Get query performance metrics
  getMetrics() {
    const totalQueries = this.metrics.length;
    const avgDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries;
    const slowQueries = this.metrics.filter(m => m.duration > this.slowQueryThreshold);
    
    return {
      totalQueries,
      avgDuration: Math.round(avgDuration),
      slowQueries: slowQueries.length,
      slowQueryPercentage: Math.round((slowQueries.length / totalQueries) * 100),
      recentMetrics: this.metrics.slice(-10)
    };
  }
}

export const queryOptimizer = new QueryOptimizer();

// Optimized query builders
export const optimizedQueries = {
  // Meal suggestions with proper indexing
  getMealSuggestions: `
    SELECT DISTINCT
      m.id,
      m.title_en,
      m.title_ar,
      m.description_en,
      m.description_ar,
      m.image_url,
      m.prep_time_min,
      m.cook_time_min,
      m.servings,
      k.name_en as kitchen_name_en,
      k.name_ar as kitchen_name_ar,
      COUNT(mi.ingredient_id) as total_ingredients,
      COUNT(CASE WHEN mi.status = 'mandatory' THEN 1 END) as mandatory_ingredients,
      COUNT(CASE WHEN mi.status = 'mandatory' AND up.ingredient_id IS NOT NULL THEN 1 END) as available_mandatory
    FROM meals m
    JOIN kitchens k ON m.kitchen_id = k.id
    LEFT JOIN meal_ingredients mi ON m.id = mi.meal_id
    LEFT JOIN user_pantry up ON mi.ingredient_id = up.ingredient_id AND up.user_id = $1
    WHERE m.is_public = true 
      AND m.is_approved = true
      AND ($2::text IS NULL OR m.meal_type = $2)
      AND ($3::uuid[] IS NULL OR m.kitchen_id = ANY($3))
      AND ($4::uuid[] IS NULL OR m.id != ALL($4)) -- Exclude recent meals
    GROUP BY m.id, k.name_en, k.name_ar
    HAVING ($5::boolean = false OR COUNT(CASE WHEN mi.status = 'mandatory' THEN 1 END) = COUNT(CASE WHEN mi.status = 'mandatory' AND up.ingredient_id IS NOT NULL THEN 1 END))
    ORDER BY 
      COUNT(CASE WHEN mi.status = 'mandatory' AND up.ingredient_id IS NOT NULL THEN 1 END) DESC,
      RANDOM()
    LIMIT $6
  `,

  // Optimized ingredient search with full-text search
  searchIngredients: `
    SELECT 
      i.id,
      i.name_en,
      i.name_ar,
      i.category,
      i.calories_per_100g,
      ts_rank(
        to_tsvector('english', COALESCE(i.name_en, '')) || 
        to_tsvector('arabic', COALESCE(i.name_ar, '')), 
        plainto_tsquery($2)
      ) as rank
    FROM ingredients i
    WHERE 
      i.is_approved = true
      AND (
        to_tsvector('english', COALESCE(i.name_en, '')) @@ plainto_tsquery($2)
        OR to_tsvector('arabic', COALESCE(i.name_ar, '')) @@ plainto_tsquery($2)
        OR i.name_en ILIKE $1
        OR i.name_ar ILIKE $1
      )
    ORDER BY rank DESC, i.name_en
    LIMIT $3
  `,

  // Optimized meal details with all related data
  getMealDetails: `
    SELECT 
      m.*,
      k.name_en as kitchen_name_en,
      k.name_ar as kitchen_name_ar,
      json_agg(
        json_build_object(
          'id', i.id,
          'name_en', i.name_en,
          'name_ar', i.name_ar,
          'quantity', mi.quantity,
          'unit', mi.unit,
          'status', mi.status,
          'calories_per_100g', i.calories_per_100g,
          'protein_per_100g', i.protein_per_100g,
          'carbs_per_100g', i.carbs_per_100g,
          'fat_per_100g', i.fat_per_100g,
          'available', CASE WHEN up.ingredient_id IS NOT NULL THEN true ELSE false END
        ) ORDER BY 
          CASE mi.status 
            WHEN 'mandatory' THEN 1 
            WHEN 'recommended' THEN 2 
            ELSE 3 
          END,
          i.name_en
      ) as ingredients
    FROM meals m
    JOIN kitchens k ON m.kitchen_id = k.id
    LEFT JOIN meal_ingredients mi ON m.id = mi.meal_id
    LEFT JOIN ingredients i ON mi.ingredient_id = i.id
    LEFT JOIN user_pantry up ON i.id = up.ingredient_id AND up.user_id = $2
    WHERE m.id = $1
    GROUP BY m.id, k.name_en, k.name_ar
  `,

  // Batch operations for better performance
  batchUpdatePantry: `
    INSERT INTO user_pantry (user_id, ingredient_id)
    SELECT $1, unnest($2::uuid[])
    ON CONFLICT (user_id, ingredient_id) DO NOTHING
  `,

  batchRemoveFromPantry: `
    DELETE FROM user_pantry 
    WHERE user_id = $1 AND ingredient_id = ANY($2::uuid[])
  `
};

// Connection pool optimization
export const poolConfig = {
  // Connection pool settings for production
  production: {
    max: 20, // Maximum number of clients in the pool
    min: 5,  // Minimum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection could not be established
    maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
    allowExitOnIdle: false, // Don't exit if all connections are idle
    application_name: 'akelny_backend'
  },

  // Connection pool settings for development
  development: {
    max: 10,
    min: 2,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
    maxUses: 1000,
    allowExitOnIdle: true,
    application_name: 'akelny_backend_dev'
  }
};

// Database health check
export const checkDatabaseHealth = async (pool: Pool): Promise<{
  healthy: boolean;
  metrics: any;
  connections: any;
}> => {
  try {
    const start = Date.now();
    
    // Test basic connectivity
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    const responseTime = Date.now() - start;
    
    // Get connection pool stats
    const poolStats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };
    
    // Get database stats
    const dbStats = await pool.query(`
      SELECT 
        numbackends as active_connections,
        xact_commit as transactions_committed,
        xact_rollback as transactions_rolled_back,
        blks_read as blocks_read,
        blks_hit as blocks_hit,
        tup_returned as tuples_returned,
        tup_fetched as tuples_fetched,
        tup_inserted as tuples_inserted,
        tup_updated as tuples_updated,
        tup_deleted as tuples_deleted
      FROM pg_stat_database 
      WHERE datname = current_database()
    `);
    
    return {
      healthy: responseTime < 1000, // Consider healthy if response time < 1s
      metrics: {
        responseTime,
        timestamp: result.rows[0].current_time,
        version: result.rows[0].version,
        queryMetrics: queryOptimizer.getMetrics()
      },
      connections: {
        pool: poolStats,
        database: dbStats.rows[0]
      }
    };
  } catch (error) {
    return {
      healthy: false,
      metrics: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      connections: {
        pool: {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount
        },
        database: null
      }
    };
  }
};