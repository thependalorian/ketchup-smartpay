/**
 * Run Vouchers Migration
 * 
 * Usage: npx tsx scripts/run-vouchers-migration.ts
 * 
 * Creates vouchers and voucher_redemptions tables for government and merchant vouchers
 * Includes NamPay integration, verification support, and compliance audit trail
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import logger, { log } from '@/utils/logger';

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });
config({ path: join(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;

if (!DATABASE_URL) {
  log.error('❌ Error: DATABASE_URL or NEON_CONNECTION_STRING not found in environment');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigration() {
  logger.info('🚀 Starting Vouchers Migration...\n');

  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'sql', 'migration_vouchers.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Split SQL statements more intelligently
    // Handle dollar-quoted strings ($$) used in PostgreSQL functions
    const statements: string[] = [];
    let currentStatement = '';
    let inDollarQuote = false;
    let dollarTag = '';
    
    const lines = migrationSQL.split('\n');
    
    for (const line of lines) {
      // Skip comments (but keep COMMENT ON statements)
      if (line.trim().startsWith('--') && !line.trim().startsWith('COMMENT')) {
        continue;
      }
      
      // Check for dollar-quoted function definitions
      const dollarQuoteMatch = line.match(/\$([^$]*)\$/);
      if (dollarQuoteMatch) {
        if (!inDollarQuote) {
          inDollarQuote = true;
          dollarTag = dollarQuoteMatch[0];
          currentStatement += line + '\n';
        } else if (dollarQuoteMatch[0] === dollarTag) {
          inDollarQuote = false;
          currentStatement += line + '\n';
          // Check if this is the end of a statement
          if (line.trim().endsWith(';')) {
            statements.push(currentStatement.trim());
            currentStatement = '';
            dollarTag = '';
          }
        } else {
          currentStatement += line + '\n';
        }
        continue;
      }
      
      if (inDollarQuote) {
        currentStatement += line + '\n';
        continue;
      }
      
      // Regular SQL statement handling
      currentStatement += line + '\n';
      
      // Check if this line ends a statement
      if (line.trim().endsWith(';')) {
        const trimmed = currentStatement.trim();
        if (trimmed.length > 0 && !trimmed.startsWith('--')) {
          statements.push(trimmed);
        }
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim());
    }

    logger.info(`Found ${statements.length} SQL statements to execute...\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const stmtPreview = stmt.substring(0, 80).replace(/\s+/g, ' ') + (stmt.length > 80 ? '...' : '');

      try {
        // Execute statement
        await sql(stmt);
        
        // Check for common "already exists" messages (these are OK)
        if (stmt.toUpperCase().includes('CREATE TABLE IF NOT EXISTS') ||
            stmt.toUpperCase().includes('CREATE INDEX IF NOT EXISTS')) {
          logger.info(`✅ Statement ${i + 1}/${statements.length}: ${stmtPreview}`);
        } else {
          logger.info(`✅ Statement ${i + 1}/${statements.length}: ${stmtPreview}`);
        }
        
        successCount++;
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        
        // Ignore "already exists" errors for tables and indexes
        if (errorMsg.includes('already exists') || 
            errorMsg.includes('duplicate key') ||
            errorMsg.includes('relation') && errorMsg.includes('already exists')) {
          logger.info(`⚠️  Statement ${i + 1}/${statements.length}: Already exists (skipping) - ${stmtPreview}`);
          successCount++;
          continue;
        }
        
        log.error(`❌ Statement ${i + 1}/${statements.length} failed: ${stmtPreview}`);
        log.error(`   Error: ${errorMsg}`);
        errorCount++;
        errors.push(`Statement ${i + 1}: ${errorMsg}`);
      }
    }

    logger.info('\n' + '='.repeat(60));
    logger.info('📊 Migration Summary');
    logger.info('='.repeat(60));
    logger.info(`✅ Successful: ${successCount}`);
    logger.info(`❌ Failed: ${errorCount}`);
    logger.info('='.repeat(60) + '\n');

    if (errorCount > 0) {
      log.error('Errors encountered:');
      errors.forEach((err, idx) => {
        log.error(`  ${idx + 1}. ${err}`);
      });
      logger.info('\n');
    }

    // Verify tables were created
    logger.info('🔍 Verifying migration...\n');
    
    try {
      const vouchersTable = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'vouchers'
        );
      `;
      
      const redemptionsTable = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'voucher_redemptions'
        );
      `;

      if (vouchersTable[0]?.exists && redemptionsTable[0]?.exists) {
        logger.info('✅ vouchers table created successfully');
        logger.info('✅ voucher_redemptions table created successfully');
        logger.info('\n🎉 Vouchers migration completed successfully!\n');
      } else {
        log.error('❌ Verification failed: Tables not found');
        if (!vouchersTable[0]?.exists) log.error('   - vouchers table missing');
        if (!redemptionsTable[0]?.exists) log.error('   - voucher_redemptions table missing');
        process.exit(1);
      }
    } catch (verifyError: any) {
      log.error('❌ Verification error:', verifyError.message);
      process.exit(1);
    }

  } catch (error: any) {
    log.error('\n❌ Migration failed:', error.message);
    log.error(error);
    process.exit(1);
  }
}

runMigration();

