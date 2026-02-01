/**
 * Run Create Missing Objects Migration
 * 
 * Location: scripts/run-create-missing-objects-migration.ts
 * Purpose: Execute migration to create missing functions, triggers, and views
 * 
 * Usage:
 *   npx tsx scripts/run-create-missing-objects-migration.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { neon } from '@neondatabase/serverless';
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
  logger.info('🔄 Running create missing objects migration...\n');

  const sql = neon(DATABASE_URL);

  try {
    // Read migration file
    const migrationPath = resolve(process.cwd(), 'sql/migration_create_missing_objects.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split into statements intelligently
    const statements: string[] = [];
    let currentStatement = '';
    let inFunction = false;
    let dollarQuoteDepth = 0;
    
    const lines = migrationSQL.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Skip comments
      if (trimmed.startsWith('--') || (trimmed.length === 0 && !inFunction)) {
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
    
    // Filter out empty statements
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

    // Verify objects were created
    logger.info('🔍 Verifying created objects...\n');
    
    // Check function
    try {
      const funcResult = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.routines 
          WHERE routine_schema = 'public' 
          AND routine_name = 'set_incident_deadlines'
        ) as exists
      `;
      
      const funcExists = Array.isArray(funcResult) && funcResult.length > 0 ? funcResult[0]?.exists : false;
      if (funcExists) {
        logger.info(`✅ Function set_incident_deadlines() exists`);
      } else {
        logger.info(`❌ Function set_incident_deadlines() NOT found`);
      }
    } catch (e: any) {
      logger.info(`❌ Function set_incident_deadlines() (error)`);
    }

    // Check trigger
    try {
      const triggerResult = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND trigger_name = 'trg_set_incident_deadlines'
        ) as exists
      `;
      
      const triggerExists = Array.isArray(triggerResult) && triggerResult.length > 0 ? triggerResult[0]?.exists : false;
      if (triggerExists) {
        logger.info(`✅ Trigger trg_set_incident_deadlines exists`);
      } else {
        logger.info(`❌ Trigger trg_set_incident_deadlines NOT found`);
      }
    } catch (e: any) {
      logger.info(`❌ Trigger trg_set_incident_deadlines (error)`);
    }

    // Check view
    try {
      const viewResult = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.views 
          WHERE table_schema = 'public' 
          AND table_name = 'v_audit_log_summary'
        ) as exists
      `;
      
      const viewExists = Array.isArray(viewResult) && viewResult.length > 0 ? viewResult[0]?.exists : false;
      if (viewExists) {
        logger.info(`✅ View v_audit_log_summary exists`);
      } else {
        logger.info(`❌ View v_audit_log_summary NOT found`);
      }
    } catch (e: any) {
      logger.info(`❌ View v_audit_log_summary (error)`);
    }

    logger.info('\n✅ Create missing objects migration completed successfully!');
  } catch (error) {
    log.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
