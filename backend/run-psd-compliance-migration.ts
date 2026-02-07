/**
 * PSD Compliance Migration Runner
 * 
 * Purpose: Execute the PSD compliance database migration
 * Regulation: PSD-1, PSD-3, PSD-12
 * Location: backend/run-psd-compliance-migration.ts
 * 
 * This script runs the 006_psd_compliance_schema.sql migration
 * for Namibian Payment System Determinations compliance
 */

import { neon } from '@neondatabase/serverless';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigration() {
  console.log('🏛️  Running PSD Compliance Migration...\n');
  console.log('📋 Regulations: PSD-1, PSD-3, PSD-12');
  console.log('🎯 Purpose: Namibian Payment System Determinations Compliance\n');

  try {
    // Read the migration file
    const migrationPath = join(__dirname, 'src', 'database', 'migrations', '006_psd_compliance_schema.sql');
    console.log(`📂 Reading migration: ${migrationPath}`);
    
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        // Filter out empty statements and comment-only blocks
        if (!stmt) return false;
        const withoutComments = stmt.replace(/--.*$/gm, '').trim();
        return withoutComments.length > 0;
      });

    console.log(`\n📊 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;

      // Extract table/index name for logging
      let objectName = 'unknown';
      if (statement.includes('CREATE TABLE')) {
        const match = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
        objectName = match ? match[1] : 'table';
      } else if (statement.includes('CREATE INDEX')) {
        const match = statement.match(/CREATE INDEX IF NOT EXISTS (\w+)/i);
        objectName = match ? match[1] : 'index';
      } else if (statement.includes('COMMENT ON')) {
        const match = statement.match(/COMMENT ON TABLE (\w+)/i);
        objectName = match ? `${match[1]}_comment` : 'comment';
      } else if (statement.includes('INSERT INTO')) {
        const match = statement.match(/INSERT INTO (\w+)/i);
        objectName = match ? match[1] : 'insert';
      }

      try {
        // Execute using template literal (Neon driver requirement)
        await sql([statement] as any);
        console.log(`  ✅ [${i + 1}/${statements.length}] ${objectName}`);
        successCount++;
      } catch (error: any) {
        // Gracefully handle "already exists" errors
        if (
          error.message?.includes('already exists') ||
          error.message?.includes('duplicate key') ||
          error.message?.includes('relation') && error.message?.includes('already')
        ) {
          console.log(`  ⏭️  [${i + 1}/${statements.length}] ${objectName} (already exists)`);
          skipCount++;
        } else {
          console.error(`  ❌ [${i + 1}/${statements.length}] ${objectName}`);
          console.error(`     Error: ${error.message}`);
          errorCount++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successful:        ${successCount}`);
    console.log(`⏭️  Skipped (exists): ${skipCount}`);
    console.log(`❌ Errors:           ${errorCount}`);
    console.log('='.repeat(60));

    if (errorCount === 0) {
      console.log('\n🎉 PSD Compliance Migration completed successfully!');
      console.log('\n📋 Created Compliance Tables:');
      console.log('  • trust_account_reconciliation (PSD-3)');
      console.log('  • system_uptime_logs (PSD-12)');
      console.log('  • system_availability_summary (PSD-12)');
      console.log('  • cybersecurity_incidents (PSD-12)');
      console.log('  • dormant_wallets (PSD-3)');
      console.log('  • bon_monthly_reports (PSD-3 & PSD-1)');
      console.log('  • agent_annual_returns (PSD-1)');
      console.log('  • two_factor_auth_logs (PSD-12)');
      console.log('  • capital_requirements_tracking (PSD-3)');
      console.log('  • ewallet_balances (PSD-3)');
      console.log('  • ewallet_transactions (PSD-3 & PSD-12)');
      console.log('  • backup_recovery_logs (PSD-12)');
      console.log('  • compliance_audit_trail (All PSDs)');
      console.log('  • compliance_dashboard_metrics (Dashboard)');
      console.log('\n🏛️  Ketchup SmartPay is now PSD-compliant ready!');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Please review above.');
    }

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
