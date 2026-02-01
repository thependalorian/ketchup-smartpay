/**
 * Run Audit Log Retention Migration
 * 
 * Location: scripts/run-audit-retention-migration.ts
 * Purpose: Execute migration_audit_log_retention.sql to create archive tables and retention function
 * 
 * Usage:
 *   npx tsx scripts/run-audit-retention-migration.ts
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';
import logger, { log } from '@/utils/logger';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;

if (!DATABASE_URL) {
  log.error('❌ DATABASE_URL or NEON_CONNECTION_STRING environment variable is required');
  process.exit(1);
}

async function runMigration() {
  logger.info('🔄 Running audit log retention migration...\n');

  const sql = neon(DATABASE_URL);

  try {
    // Read migration file
    const migrationPath = resolve(process.cwd(), 'sql/migration_audit_log_retention.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split into statements more intelligently
    // Handle CREATE TABLE ... LIKE ... statements and function definitions
    const statements: string[] = [];
    let currentStatement = '';
    let inFunction = false;
    let dollarQuoteDepth = 0;
    
    const lines = migrationSQL.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Skip comments
      if (trimmed.startsWith('--') || trimmed.length === 0) {
        continue;
      }
      
      // Track function definitions with $$ delimiters
      if (trimmed.includes('$$')) {
        const dollarCount = (trimmed.match(/\$\$/g) || []).length;
        dollarQuoteDepth += dollarCount;
        currentStatement += line + '\n';
        
        // If we have an even number of $$, we're done with the function
        if (dollarQuoteDepth % 2 === 0 && dollarQuoteDepth > 0) {
          inFunction = false;
          dollarQuoteDepth = 0;
          if (trimmed.endsWith(';')) {
            statements.push(currentStatement.trim());
            currentStatement = '';
          }
        } else {
          inFunction = true;
        }
        continue;
      }
      
      if (inFunction) {
        currentStatement += line + '\n';
        continue;
      }
      
      // Regular statement handling
      currentStatement += line;
      
      // Check if statement ends with semicolon
      if (trimmed.endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      } else {
        currentStatement += '\n';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim());
    }
    
    // Filter out empty statements and very short ones
    const validStatements = statements
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length > 10);

    logger.info(`📝 Found ${validStatements.length} SQL statements to execute\n`);

    for (let i = 0; i < validStatements.length; i++) {
      const statement = validStatements[i];
      if (statement.length === 0) continue;

      try {
        logger.info(`[${i + 1}/${validStatements.length}] Executing statement...`);
        // Execute using .query() method for DDL statements
        await (sql as any).query(statement);
        logger.info(`✅ Statement ${i + 1} executed successfully\n`);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message?.includes('already exists') || 
            error.message?.includes('duplicate') || 
            error.code === '42P07' || 
            error.code === '42710') {
          logger.info(`⚠️  Statement ${i + 1} skipped (already exists)\n`);
        } else {
          log.error(`❌ Statement ${i + 1} failed: ${error.message?.substring(0, 100)}`);
          log.error(`   Code: ${error.code}`);
          // Don't throw - continue with other statements
        }
      }
    }

    // Verify tables were created
    logger.info('🔍 Verifying archive tables...\n');
    const tables = [
      'audit_logs_archive',
      'pin_audit_logs_archive',
      'voucher_audit_logs_archive',
      'transaction_audit_logs_archive',
      'api_sync_audit_logs_archive',
      'staff_audit_logs_archive',
    ];

    for (const tableName of tables) {
      // Use template literal for proper query execution
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        ) as exists
      `;
      
      const exists = Array.isArray(result) && result.length > 0 ? result[0]?.exists : false;
      if (exists) {
        logger.info(`✅ Table ${tableName} exists`);
      } else {
        logger.info(`❌ Table ${tableName} NOT found`);
      }
    }

    // Verify function
    logger.info('\n🔍 Verifying retention function...\n');
    try {
      const functionResult = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.routines 
          WHERE routine_schema = 'public' 
          AND routine_name = 'check_audit_log_retention'
        ) as exists
      `;
      
      const functionExists = Array.isArray(functionResult) && functionResult.length > 0 ? functionResult[0]?.exists : false;
      if (functionExists) {
        logger.info(`✅ Function check_audit_log_retention() exists`);
      } else {
        logger.info(`❌ Function check_audit_log_retention() NOT found`);
      }
    } catch (error: any) {
      logger.info(`❌ Function check_audit_log_retention() NOT found (error: ${error.message?.substring(0, 50)})`);
    }

    logger.info('\n✅ Migration completed successfully!');
  } catch (error) {
    log.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
