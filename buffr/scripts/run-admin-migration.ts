/**
 * Run Admin Role Migration
 * 
 * Location: scripts/run-admin-migration.ts
 * Purpose: Execute admin role migration for RBAC system
 * 
 * Usage:
 *   npx tsx scripts/run-admin-migration.ts
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync, accessSync } from 'fs';
import { join } from 'path';
import logger, { log } from '@/utils/logger';

// Load environment variables
let envPath = '.env.local';
try {
  accessSync(envPath);
} catch {
  envPath = '.env';
}

try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line: string) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  logger.warn('Could not load .env file, using environment variables');
}

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;

if (!DATABASE_URL) {
  log.error('❌ Error: DATABASE_URL or NEON_CONNECTION_STRING not found in environment');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigration() {
  logger.info('🚀 Running Admin Role Migration...\n');

  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'sql', 'migration_add_admin_role.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    logger.info('📄 Migration file loaded\n');
    
    // Split migration into executable statements
    // Neon serverless requires each statement to be executed separately
    logger.info('📝 Splitting migration into individual statements...\n');
    
    // Extract DO blocks and UPDATE statements separately
    const statements: string[] = [];
    let currentStatement = '';
    let inDoBlock = false;
    let doBlockDepth = 0;
    
    const lines = migrationSQL.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments
      if (trimmed.startsWith('--')) continue;
      if (trimmed.length === 0) continue;
      
      // Track DO block boundaries
      if (trimmed.includes('DO $$')) {
        inDoBlock = true;
        doBlockDepth = 0;
        currentStatement = '';
      }
      
      if (inDoBlock) {
        currentStatement += line + '\n';
        // Count $$ markers
        const beginMarkers = (line.match(/\$\$/g) || []).length;
        if (beginMarkers > 0) {
          doBlockDepth += beginMarkers;
        }
        // Check for END $$
        if (trimmed.includes('END $$') && doBlockDepth >= 2) {
          inDoBlock = false;
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
      } else {
        currentStatement += line;
        // Check for statement end (semicolon not in string)
        if (trimmed.endsWith(';')) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        } else {
          currentStatement += '\n';
        }
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim());
    }
    
    // Filter out empty statements
    const validStatements = statements
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    logger.info(`Found ${validStatements.length} statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < validStatements.length; i++) {
      const stmt = validStatements[i];
      
      try {
        await sql(stmt);
        successCount++;
        const preview = stmt.substring(0, 50).replace(/\n/g, ' ');
        logger.info(`✅ Statement ${i + 1}: ${preview}...`);
      } catch (err: any) {
        const errorMsg = err.message || '';
        if (errorMsg.includes('already exists') || 
            errorMsg.includes('duplicate') ||
            (errorMsg.includes('does not exist') && errorMsg.includes('type')) ||
            errorMsg.includes('relation') && errorMsg.includes('already exists')) {
          skippedCount++;
          const preview = stmt.substring(0, 50).replace(/\n/g, ' ');
          logger.info(`⚠️  Statement ${i + 1} skipped (already exists): ${preview}...`);
        } else {
          errorCount++;
          log.error(`❌ Statement ${i + 1} error: ${errorMsg.substring(0, 150)}`);
          // Don't stop on errors, continue with other statements
        }
      }
    }
    
    logger.info(`\n📊 Summary: ${successCount} successful, ${skippedCount} skipped, ${errorCount} errors\n`);
    
    // Verify migration
    logger.info('🔍 Verifying migration...\n');
    
    const columns = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('role', 'is_admin', 'permissions', 'mfa_enabled', 'mfa_secret')
      ORDER BY column_name
    `;
    
    logger.info('📋 Added columns:');
    if (columns.length === 0) {
      logger.info('   ⚠️  No new columns found (may already exist)');
    } else {
      columns.forEach((col: any) => {
        logger.info(`   ✅ ${col.column_name} (${col.data_type})`);
      });
    }
    
    const indexes = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'users'
      AND indexname IN ('idx_users_role', 'idx_users_is_admin', 'idx_users_admin_roles', 'idx_users_mfa_enabled')
      ORDER BY indexname
    `;
    
    logger.info('\n📋 Created indexes:');
    if (indexes.length === 0) {
      logger.info('   ⚠️  No new indexes found (may already exist)');
    } else {
      indexes.forEach((idx: any) => {
        logger.info(`   ✅ ${idx.indexname}`);
      });
    }
    
    const enumType = await sql`
      SELECT typname
      FROM pg_type
      WHERE typname = 'user_role'
    `;
    
    if (enumType.length > 0) {
      logger.info('\n📋 Created enum type:');
      logger.info('   ✅ user_role');
    }
    
    logger.info('\n✅ Migration verification complete!\n');
    
  } catch (error: any) {
    log.error('❌ Migration failed:', error.message);
    log.error(error);
    process.exit(1);
  }
}

runMigration().catch(console.error);

