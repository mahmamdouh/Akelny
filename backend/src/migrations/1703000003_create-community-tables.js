/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Create meal_reports table
    .createTable('meal_reports', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('meal_id').notNullable().references('id').inTable('meals').onDelete('CASCADE');
      table.uuid('reported_by_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.enum('reason', ['inappropriate_content', 'spam', 'copyright', 'other']).notNullable();
      table.text('description');
      table.enum('status', ['pending', 'reviewed', 'resolved', 'dismissed']).defaultTo('pending');
      table.timestamps(true, true);
      
      // Indexes
      table.index(['meal_id']);
      table.index(['reported_by_user_id']);
      table.index(['status']);
      table.index(['created_at']);
      
      // Unique constraint to prevent duplicate reports from same user for same meal
      table.unique(['meal_id', 'reported_by_user_id']);
    })
    
    // Create moderation_actions table
    .createTable('moderation_actions', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('meal_id').notNullable().references('id').inTable('meals').onDelete('CASCADE');
      table.uuid('moderator_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.enum('action', ['approve', 'reject', 'hide']).notNullable();
      table.text('reason');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['meal_id']);
      table.index(['moderator_user_id']);
      table.index(['action']);
      table.index(['created_at']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('moderation_actions')
    .dropTableIfExists('meal_reports');
};