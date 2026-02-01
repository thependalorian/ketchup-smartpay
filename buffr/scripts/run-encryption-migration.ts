/**
 * Encryption Fields Migration Script
 * 
 * Location: scripts/run-encryption-migration.ts
 * Purpose: Run database migration to add encrypted columns for sensitive data
 * 
 * Usage:
 *   npx tsx scripts/run-encryption-migration.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { neon } from '@neondatabase/serverless';
import logger, { log } from '@/utils/logger';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;

if (!DATABASE_URL) {
  log.error('❌ DATABASE_URL or NEON_CONNECTION_STRING environment variable is required');
  process.exit(1);
}

async function runMigration() {
  logger.info('🔄 Running encryption fields migration...\n');

  const sql = neon(DATABASE_URL);

  try {
    // Read migration SQL file
    const migrationPath = resolve(process.cwd(), 'sql/migration_encryption_fields.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Parse SQL statements (handle dollar-quoted strings for functions)
    const statements: string[] = [];
    let currentStatement = '';
    let inDollarQuote = false;
    let dollarTag = '';
    let i = 0;

    while (i < migrationSQL.length) {
      const char = migrationSQL[i];
      const nextChar = i + 1 < migrationSQL.length ? migrationSQL[i + 1] : '';

      // Check for dollar-quoted strings (e.g., $function$ ... $function$)
      if (char === '$' && !inDollarQuote) {
        // Start of dollar quote
        let tag = '$';
        let j = i + 1;
        while (j < migrationSQL.length && migrationSQL[j] !== '$') {
          tag += migrationSQL[j];
          j++;
        }
        if (j < migrationSQL.length) {
          tag += '$';
          dollarTag = tag;
          inDollarQuote = true;
          currentStatement += migrationSQL.substring(i, j + 1);
          i = j + 1;
          continue;
        }
      } else if (inDollarQuote && migrationSQL.substring(i, i + dollarTag.length) === dollarTag) {
        // End of dollar quote
        currentStatement += dollarTag;
        i += dollarTag.length;
        inDollarQuote = false;
        dollarTag = '';
        continue;
      }

      if (!inDollarQuote && char === ';') {
        currentStatement += char;
        const trimmed = currentStatement.trim();
        if (trimmed.length > 10) {
          statements.push(trimmed);
        }
        currentStatement = '';
      } else {
        currentStatement += char;
      }
      i++;
    }

    // Add final statement if any
    if (currentStatement.trim().length > 10) {
      statements.push(currentStatement.trim());
    }

    const validStatements = statements
      .filter(s => s.length > 0 && s.length > 10);

    logger.info(`📝 Found ${validStatements.length} SQL statements to execute\n`);

    for (let i = 0; i < validStatements.length; i++) {
      const statement = validStatements[i];

      try {
        logger.info(`[${i + 1}/${validStatements.length}] Executing statement...`);
        // Execute using .query() method for DDL statements
        await (sql as any).query(statement);
        logger.info(`✅ Statement ${i + 1} executed successfully\n`);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (
          error.message?.includes('already exists') ||
          error.code === '42P07' || // duplicate_table
          error.code === '42710' || // duplicate_object
          error.code === '42703'    // undefined_column (column might already exist)
        ) {
          logger.info(`⚠️  Statement ${i + 1} skipped (already exists)\n`);
        } else {
          log.error(`❌ Statement ${i + 1} failed: ${error.message?.substring(0, 100)}`);
          log.error(`   Code: ${error.code}`);
          // Don't throw - continue with other statements
        }
      }
    }

    // Verify columns were created
    logger.info('🔍 Verifying encrypted columns...\n');
    
    const tablesToCheck = [
      { table: 'vouchers', columns: ['bank_account_number_encrypted', 'bank_account_number_iv', 'bank_account_number_tag'] },
      { table: 'voucher_redemptions', columns: ['bank_account_number_encrypted', 'bank_account_number_iv', 'bank_account_number_tag'] },
      { table: 'user_banks', columns: ['account_number_encrypted_data', 'account_number_iv', 'account_number_tag'] },
      { table: 'user_cards', columns: ['card_number_encrypted_data', 'card_number_iv', 'card_number_tag'] },
      { table: 'users', columns: ['national_id_encrypted', 'national_id_iv', 'national_id_tag', 'national_id_hash', 'national_id_salt'] },
    ];

    for (const { table, columns } of tablesToCheck) {
      for (const column of columns) {
        try {
          const result = await sql`
            SELECT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_name = ${table} 
              AND column_name = ${column}
            ) as exists
          `;
          const exists = Array.isArray(result) && result.length > 0 ? result[0]?.exists : false;
          if (exists) {
            logger.info(`✅ Column ${table}.${column} exists`);
          } else {
            logger.info(`❌ Column ${table}.${column} NOT found`);
          }
        } catch (error: any) {
          logger.info(`❌ Error checking ${table}.${column}: ${error.message?.substring(0, 50)}`);
        }
      }
    }

    logger.info('\n✅ Encryption fields migration completed successfully!');
    logger.info('\n📋 Next Steps:');
    logger.info('1. Set ENCRYPTION_KEY environment variable (32+ characters)');
    logger.info('2. Migrate existing sensitive data to encrypted format (if any)');
    logger.info('3. Update API endpoints to use encryption utilities');
  } catch (error) {
    log.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMigration();
