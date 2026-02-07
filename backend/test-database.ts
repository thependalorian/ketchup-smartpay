/**
 * Database Connection Test Script
 * 
 * Purpose: Verify database connectivity and schema
 * Usage: npx tsx test-database.ts
 */

import { sql } from './src/database/connection';
import { log, logError } from './src/utils/logger';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config();
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function testDatabaseConnection() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║     Ketchup SmartPay Database Test Suite         ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  try {
    // Test 1: Basic connectivity
    console.log('Test 1: Testing database connection...');
    const [result] = await sql`SELECT NOW() as current_time, version() as version`;
    console.log('✅ Database connection successful');
    console.log(`   Time: ${result.current_time}`);
    console.log(`   PostgreSQL Version: ${result.version.split(' ')[0]} ${result.version.split(' ')[1]}\n`);

    // Test 2: Check tables exist
    console.log('Test 2: Checking database tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    console.log('✅ Tables found:');
    tables.forEach((table: any) => {
      console.log(`   - ${table.table_name}`);
    });
    console.log('');

    // Test 3: Check indexes
    console.log('Test 3: Checking indexes...');
    const indexes = await sql`
      SELECT 
        tablename, 
        indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      ORDER BY tablename, indexname
    `;
    console.log(`✅ Found ${indexes.length} indexes`);
    console.log('   Sample indexes:');
    indexes.slice(0, 5).forEach((idx: any) => {
      console.log(`   - ${idx.tablename}.${idx.indexname}`);
    });
    console.log('');

    // Test 4: Count records in each table
    console.log('Test 4: Counting records...');
    const beneficiaryCount = await sql`SELECT COUNT(*) as count FROM beneficiaries`;
    const voucherCount = await sql`SELECT COUNT(*) as count FROM vouchers`;
    const statusEventCount = await sql`SELECT COUNT(*) as count FROM status_events`;
    const webhookEventCount = await sql`SELECT COUNT(*) as count FROM webhook_events`;
    const reconciliationCount = await sql`SELECT COUNT(*) as count FROM reconciliation_records`;

    console.log('✅ Record counts:');
    console.log(`   - Beneficiaries: ${beneficiaryCount[0].count}`);
    console.log(`   - Vouchers: ${voucherCount[0].count}`);
    console.log(`   - Status Events: ${statusEventCount[0].count}`);
    console.log(`   - Webhook Events: ${webhookEventCount[0].count}`);
    console.log(`   - Reconciliation Records: ${reconciliationCount[0].count}`);
    console.log('');

    // Test 5: Check foreign key constraints
    console.log('Test 5: Checking foreign key constraints...');
    const foreignKeys = await sql`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    `;
    console.log(`✅ Found ${foreignKeys.length} foreign key constraints`);
    foreignKeys.forEach((fk: any) => {
      console.log(`   - ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    console.log('');

    // Test 6: Test a sample query (Dashboard metrics)
    console.log('Test 6: Testing dashboard metrics query...');
    const [metrics] = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'active') as active_beneficiaries,
        COUNT(*) as total_beneficiaries
      FROM beneficiaries
    `;
    console.log('✅ Dashboard query successful:');
    console.log(`   - Total Beneficiaries: ${metrics.total_beneficiaries}`);
    console.log(`   - Active Beneficiaries: ${metrics.active_beneficiaries}`);
    console.log('');

    // Test 7: Check database size
    console.log('Test 7: Checking database size...');
    const dbSize = await sql`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as database_size
    `;
    console.log('✅ Database size:');
    console.log(`   - Size: ${dbSize[0].database_size}`);
    console.log('');

    // Final summary
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║     ✅ ALL TESTS PASSED - DATABASE READY          ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    // Connection info (masked)
    console.log('Connection Info:');
    const dbUrl = process.env.DATABASE_URL || '';
    const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
    console.log(`   URL: ${maskedUrl}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('╔═══════════════════════════════════════════════════╗');
    console.error('║     ❌ DATABASE TEST FAILED                        ║');
    console.error('╚═══════════════════════════════════════════════════╝\n');
    logError('Database test failed', error);
    
    if (error instanceof Error) {
      console.error('Error Details:');
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}\n`);
    }
    
    console.error('Troubleshooting:');
    console.error('   1. Check DATABASE_URL is set in backend/.env.local');
    console.error('   2. Verify Neon database is accessible');
    console.error('   3. Ensure migrations have been run');
    console.error('   4. Check network connectivity\n');
    
    process.exit(1);
  }
}

// Run tests
testDatabaseConnection();
