/**
 * Run Push Notifications Migration
 * 
 * Creates tables for push tokens, notification logs, and preferences
 */

import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import logger, { log } from '@/utils/logger';

// Load .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

if (!process.env.DATABASE_URL) {
  log.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  try {
    logger.info('🚀 Running Push Notifications Migration...\n');

    const migrationPath = path.join(__dirname, '../sql/migration_push_notifications.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Parse SQL into individual statements
    // Remove comments and split by semicolons, but handle multi-line statements
    const statements: string[] = [];
    let currentStatement = '';
    let inDollarQuote = false;
    let dollarTag = '';

    for (let i = 0; i < migrationSQL.length; i++) {
      const char = migrationSQL[i];
      const nextChars = migrationSQL.substring(i, i + 2);

      // Handle dollar-quoted strings ($$ ... $$)
      if (nextChars === '$$' && !inDollarQuote) {
        inDollarQuote = true;
        // Find the tag after $$
        let tagEnd = i + 2;
        while (tagEnd < migrationSQL.length && migrationSQL[tagEnd] !== '$') {
          tagEnd++;
        }
        dollarTag = migrationSQL.substring(i + 2, tagEnd);
        currentStatement += migrationSQL.substring(i, tagEnd + 2);
        i = tagEnd + 1;
        continue;
      }

      if (inDollarQuote) {
        // Check for closing tag
        if (migrationSQL.substring(i, i + dollarTag.length + 2) === `$${dollarTag}$`) {
          currentStatement += migrationSQL.substring(i, i + dollarTag.length + 2);
          i += dollarTag.length + 1;
          inDollarQuote = false;
          dollarTag = '';
          continue;
        }
        currentStatement += char;
        continue;
      }

      // Skip single-line comments
      if (nextChars === '--') {
        while (i < migrationSQL.length && migrationSQL[i] !== '\n') {
          i++;
        }
        continue;
      }

      currentStatement += char;

      // End of statement
      if (char === ';' && !inDollarQuote) {
        const trimmed = currentStatement.trim();
        if (trimmed && !trimmed.match(/^--/)) {
          statements.push(trimmed);
        }
        currentStatement = '';
      }
    }

    // Execute each statement
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement.trim()) continue;

      try {
        await sql(statement);
        successCount++;
        logger.info(`✓ Statement ${i + 1}/${statements.length} executed`);
      } catch (err: any) {
        const errMsg = err.message || '';
        // Ignore "already exists" errors
        if (errMsg.includes('already exists') || 
            errMsg.includes('duplicate') ||
            errMsg.includes('relation') && errMsg.includes('already exists')) {
          skipCount++;
          logger.info(`⚠ Statement ${i + 1}/${statements.length} skipped (already exists)`);
        } else {
          errorCount++;
          log.error(`✗ Statement ${i + 1}/${statements.length} error:`, errMsg.substring(0, 150));
        }
      }
    }

    logger.info('\n✅ Push Notifications Migration Complete!');
    logger.info(`   ✓ ${successCount} statements executed`);
    if (skipCount > 0) logger.info(`   ⚠ ${skipCount} statements skipped (already exist)`);
    if (errorCount > 0) logger.info(`   ✗ ${errorCount} statements failed`);
    logger.info('\nCreated/Updated:');
    logger.info('  - push_tokens table');
    logger.info('  - notification_logs table');
    logger.info('  - notification_preferences table');
    logger.info('  - v_user_push_tokens view');
    logger.info('  - Triggers and indexes');

  } catch (error: any) {
    log.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
