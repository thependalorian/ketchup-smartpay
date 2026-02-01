/**
 * Run Split Bills Migration Script
 * 
 * Location: scripts/run-split-bills-migration.ts
 * Purpose: Execute split bills database schema migration
 * 
 * Usage: npx tsx scripts/run-split-bills-migration.ts
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
  logger.info('🚀 Starting split bills migration...\n');

  const sql = neon(DATABASE_URL);

  try {
    // Read migration file
    const migrationPath = resolve(process.cwd(), 'sql/migration_split_bills.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Remove comments first
    const cleanedSQL = migrationSQL
      .split('\n')
      .map(line => {
        const commentIndex = line.indexOf('--');
        return commentIndex >= 0 ? line.substring(0, commentIndex) : line;
      })
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments
    
    // Split by semicolon followed by newline or end of string
    // But preserve dollar-quoted strings (for functions)
    const statements: string[] = [];
    let currentStatement = '';
    let inDollarQuote = false;
    let dollarTag = '';
    
    for (let i = 0; i < cleanedSQL.length; i++) {
      const char = cleanedSQL[i];
      const nextChar = cleanedSQL[i + 1];
      
      // Check for dollar-quoted strings ($$...$$)
      if (char === '$' && nextChar === '$') {
        if (!inDollarQuote) {
          // Find the tag
          let tagEnd = i + 2;
          while (tagEnd < cleanedSQL.length && cleanedSQL[tagEnd] !== '$') {
            tagEnd++;
          }
          dollarTag = cleanedSQL.substring(i, tagEnd + 1);
          inDollarQuote = true;
          currentStatement += dollarTag;
          i = tagEnd;
          continue;
        } else {
          // Check if this is the closing tag
          const potentialTag = cleanedSQL.substring(i, i + dollarTag.length);
          if (potentialTag === dollarTag) {
            inDollarQuote = false;
            currentStatement += dollarTag;
            i += dollarTag.length - 1;
            continue;
          }
        }
      }
      
      currentStatement += char;
      
      // If we hit a semicolon and we're not in a dollar-quoted string, end the statement
      if (char === ';' && !inDollarQuote) {
        const trimmed = currentStatement.trim();
        if (trimmed.length > 10) {
          statements.push(trimmed);
        }
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim().length > 10) {
      statements.push(currentStatement.trim());
    }

    logger.info(`📝 Found ${statements.length} SQL statements\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.startsWith('/*') || statement.length < 10) {
        continue;
      }

      try {
        // Execute using .query() method for DDL statements
        await (sql as any).query(statement + ';');
        successCount++;
        if ((i + 1) % 3 === 0) {
          logger.info(`  ✅ Executed ${i + 1}/${statements.length} statements...`);
        }
      } catch (error: any) {
        // Ignore "already exists" errors (idempotent)
        if (error.message?.includes('already exists') || 
            error.message?.includes('duplicate') || 
            error.code === '42P07' || 
            error.code === '42710') {
          successCount++;
          continue;
        }
        errorCount++;
        log.error(`  ❌ Error in statement ${i + 1}:`, error.message);
        log.error(`  Statement: ${statement.substring(0, 100)}...`);
      }
    }

    logger.info(`\n✅ Migration completed!`);
    logger.info(`   Success: ${successCount}`);
    logger.info(`   Errors: ${errorCount}`);

    // Verify tables were created
    logger.info('\n🔍 Verifying tables...');
    const tables = ['split_bills', 'split_bill_participants'];

    for (const table of tables) {
      try {
        // Use template literal for proper query execution
        const result = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${table}
          ) as exists
        `;
        if (result[0]?.exists) {
          logger.info(`  ✅ ${table} - exists`);
        } else {
          log.error(`  ❌ ${table} - not found`);
        }
      } catch (error: any) {
        log.error(`  ❌ ${table} - ${error.message}`);
      }
    }

    logger.info('\n✨ Split bills migration verification complete!');
  } catch (error: any) {
    log.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration().catch(console.error);
