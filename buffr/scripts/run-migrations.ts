/**
 * Database Migration Runner
 * 
 * Location: scripts/run-migrations.ts
 * Purpose: Run all database migrations in order for production deployment
 * 
 * Usage:
 *   npx tsx scripts/run-migrations.ts
 * 
 * This script:
 * 1. Reads all migration files from sql/ directory
 * 2. Executes them in order
 * 3. Tracks executed migrations in migrations table
 * 4. Prevents duplicate execution
 */

import { neon } from '@neondatabase/serverless';
import { readdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { config } from 'dotenv';
import logger, { log } from '@/utils/logger';

// Load environment variables from .env.local (highest priority)
config({ path: resolve(process.cwd(), '.env.local') });
// Fallback to .env if .env.local doesn't exist
config({ path: resolve(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;

if (!DATABASE_URL) {
  log.error('❌ DATABASE_URL or NEON_CONNECTION_STRING environment variable is required');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

interface Migration {
  filename: string;
  content: string;
  order: number;
}

async function ensureMigrationsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT NOW(),
      checksum VARCHAR(64)
    )
  `;
  logger.info('✅ Migrations table ready');
}

async function getExecutedMigrations(): Promise<Set<string>> {
  const executed = await sql<{ filename: string }>`
    SELECT filename FROM migrations ORDER BY executed_at
  `;
  return new Set(executed.map(m => m.filename));
}

async function readMigrations(): Promise<Migration[]> {
  const sqlDir = join(process.cwd(), 'sql');
  const files = await readdir(sqlDir);
  
  const migrations: Migration[] = [];
  
  for (const file of files) {
    if (file.endsWith('.sql')) {
      const content = await readFile(join(sqlDir, file), 'utf-8');
      // Extract order from filename (e.g., migration_001_...)
      const orderMatch = file.match(/^(\d+)/);
      const order = orderMatch ? parseInt(orderMatch[1]) : 999;
      
      migrations.push({
        filename: file,
        content,
        order,
      });
    }
  }
  
  // Sort by order
  migrations.sort((a, b) => a.order - b.order);
  
  return migrations;
}

async function executeMigration(migration: Migration) {
  logger.info(`\n📄 Executing: ${migration.filename}`);
  
  try {
    // Execute migration
    await sql.unsafe(migration.content);
    
    // Record migration
    await sql`
      INSERT INTO migrations (filename, checksum)
      VALUES (${migration.filename}, MD5(${migration.content}))
      ON CONFLICT (filename) DO NOTHING
    `;
    
    logger.info(`✅ Completed: ${migration.filename}`);
    return true;
  } catch (error) {
    log.error(`❌ Failed: ${migration.filename}`);
    log.error(error);
    return false;
  }
}

async function main() {
  logger.info('🚀 Starting database migrations...\n');
  
  try {
    await ensureMigrationsTable();
    
    const migrations = await readMigrations();
    const executed = await getExecutedMigrations();
    
    logger.info(`\n📋 Found ${migrations.length} migration(s)`);
    
    let executedCount = 0;
    let skippedCount = 0;
    
    for (const migration of migrations) {
      if (executed.has(migration.filename)) {
        logger.info(`⏭️  Skipped (already executed): ${migration.filename}`);
        skippedCount++;
        continue;
      }
      
      const success = await executeMigration(migration);
      if (success) {
        executedCount++;
      } else {
        log.error(`\n❌ Migration failed. Stopping execution.`);
        process.exit(1);
      }
    }
    
    logger.info(`\n✅ Migration Summary:`);
    logger.info(`   - Executed: ${executedCount}`);
    logger.info(`   - Skipped: ${skippedCount}`);
    logger.info(`   - Total: ${migrations.length}`);
    logger.info(`\n🎉 All migrations completed successfully!`);
    
  } catch (error) {
    log.error('❌ Migration runner error:', error);
    process.exit(1);
  }
}

main();
