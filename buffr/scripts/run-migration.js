import logger, { log } from '@/utils/logger';
/**
 * Run Gamification Migration
 * 
 * Usage: node scripts/run-migration.js
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL || 
    'postgresql://neondb_owner:npg_B7JHyg6PlIvX@ep-rough-frog-ad0dg5fe-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
  
  const sql = neon(databaseUrl);
  
  logger.info('🚀 Running Gamification Migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'sql', 'migration_gamification.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolons and filter out empty statements
    const statements = migrationSQL
      .split(/;\s*$/m)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    logger.info(`Found ${statements.length} SQL statements to execute...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      
      // Skip certain statements that don't work well with the serverless driver
      if (stmt.includes('CREATE EXTENSION') || 
          stmt.includes('CREATE OR REPLACE FUNCTION') ||
          stmt.includes('CREATE TRIGGER') ||
          stmt.includes('CREATE OR REPLACE VIEW')) {
        logger.info(`⏭️  Skipping statement ${i + 1} (extension/function/trigger/view)...`);
        continue;
      }
      
      try {
        await sql.query(stmt);
        successCount++;
        
        // Log table creations
        if (stmt.includes('CREATE TABLE')) {
          const match = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
          if (match) {
            logger.info(`✅ Created table: ${match[1]}`);
          }
        } else if (stmt.includes('CREATE INDEX')) {
          logger.info(`✅ Created index`);
        } else if (stmt.includes('INSERT INTO')) {
          const match = stmt.match(/INSERT INTO (\w+)/);
          if (match) {
            logger.info(`✅ Inserted data into: ${match[1]}`);
          }
        }
      } catch (err) {
        errorCount++;
        if (err.message.includes('already exists')) {
          logger.info(`⏭️  Already exists, skipping...`);
        } else {
          logger.info(`⚠️  Statement ${i + 1} error: ${err.message.substring(0, 80)}`);
        }
      }
    }
    
    logger.info(`\n✅ Migration completed!`);
    logger.info(`   Success: ${successCount}, Errors/Skipped: ${errorCount}`);
    
    // Verify tables were created
    logger.info('\n📊 Verifying tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE '%gamification%'
        OR table_name IN ('achievements', 'quests', 'rewards', 'levels', 'points_transactions', 
                          'user_achievements', 'user_quests', 'user_rewards', 'user_power_ups', 
                          'leaderboard_entries', 'streak_history')
      ORDER BY table_name
    `;
    
    logger.info('\nGamification tables in database:');
    tables.forEach(t => logger.info(`  - ${t.table_name}`));
    
  } catch (error) {
    log.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
