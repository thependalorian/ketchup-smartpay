/**
 * Run Exchange Rates Migration
 * 
 * Usage: npx tsx scripts/run-exchange-rates-migration.ts
 * 
 * Creates exchange_rates and exchange_rate_fetch_log tables
 * for storing exchange rates fetched twice daily from exchangerate.host
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';
import logger, { log } from '@/utils/logger';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;

if (!DATABASE_URL) {
  log.error('❌ Error: DATABASE_URL or NEON_CONNECTION_STRING not found in environment');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigration() {
  logger.info('🚀 Starting Exchange Rates Migration...\n');

  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'sql', 'migration_exchange_rates.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Split SQL statements more intelligently
    // Handle dollar-quoted strings ($$) used in PostgreSQL functions
    const statements: string[] = [];
    let currentStatement = '';
    let inDollarQuote = false;
    let dollarTag = '';
    
    const lines = migrationSQL.split('\n');
    
    for (const line of lines) {
      // Skip comments
      if (line.trim().startsWith('--') || line.trim().startsWith('COMMENT')) {
        continue;
      }
      
      // Check for dollar-quoted strings ($$...$$)
      const dollarMatch = line.match(/\$(\w*)\$/g);
      if (dollarMatch) {
        for (const match of dollarMatch) {
          if (!inDollarQuote) {
            // Starting dollar quote
            dollarTag = match;
            inDollarQuote = true;
          } else if (match === dollarTag) {
            // Ending dollar quote
            inDollarQuote = false;
            dollarTag = '';
          }
        }
      }
      
      currentStatement += line + '\n';
      
      // If not in dollar quote and line ends with semicolon, it's a complete statement
      if (!inDollarQuote && line.trim().endsWith(';')) {
        const trimmed = currentStatement.trim();
        if (trimmed.length > 0) {
          statements.push(trimmed);
        }
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim());
    }
    
    // Filter out empty statements
    const filteredStatements = statements.filter(s => s.length > 10);

    logger.info(`📋 Found ${filteredStatements.length} SQL statements to execute...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < filteredStatements.length; i++) {
      const stmt = filteredStatements[i];
      
      // Skip empty statements
      if (!stmt || stmt.length < 10) continue;

      try {
        logger.info(`Executing statement ${i + 1}/${filteredStatements.length}...`);
        
        // Execute statement (use template literal for functions, regular sql for others)
        if (stmt.includes('CREATE OR REPLACE FUNCTION') || stmt.includes('$$')) {
          // For functions, use raw SQL
          await sql(stmt);
        } else {
          // For regular statements, use template literal
          await sql(stmt);
        }
        
        successCount++;
        logger.info(`✅ Statement ${i + 1} executed successfully\n`);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.message.includes('relation') && error.message.includes('already')) {
          logger.info(`⚠️  Statement ${i + 1} skipped (already exists)\n`);
          successCount++;
        } else {
          errorCount++;
          log.error(`❌ Error in statement ${i + 1}:`, error.message);
          log.error(`Statement: ${stmt.substring(0, 100)}...\n`);
        }
      }
    }

    // Verify tables were created
    logger.info('\n🔍 Verifying migration...\n');
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('exchange_rates', 'exchange_rate_fetch_log')
      ORDER BY table_name
    `;

    if (tables.length === 2) {
      logger.info('✅ Both tables created successfully:');
      tables.forEach((t: any) => logger.info(`   - ${t.table_name}`));
    } else {
      logger.info('⚠️  Some tables may be missing:');
      tables.forEach((t: any) => logger.info(`   - ${t.table_name}`));
    }

    // Check functions
    const functions = await sql`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name IN ('get_latest_exchange_rates', 'should_fetch_exchange_rates')
      ORDER BY routine_name
    `;

    if (functions.length === 2) {
      logger.info('\n✅ Both functions created successfully:');
      functions.forEach((f: any) => logger.info(`   - ${f.routine_name}()`));
    }

    logger.info(`\n📊 Migration Summary:`);
    logger.info(`   ✅ Successful: ${successCount}`);
    logger.info(`   ❌ Errors: ${errorCount}`);
    
    if (errorCount === 0) {
      logger.info('\n🎉 Exchange Rates migration completed successfully!');
      logger.info('\n📝 Next steps:');
      logger.info('   1. Update exchange rate service to use database');
      logger.info('   2. Set up scheduled job to fetch rates twice daily');
      logger.info('   3. Test the exchange rates endpoint');
    } else {
      logger.info('\n⚠️  Migration completed with some errors. Please review above.');
    }

  } catch (error: any) {
    log.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

