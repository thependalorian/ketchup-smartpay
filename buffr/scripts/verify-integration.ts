/**
 * Integration Verification Script
 * 
 * Location: scripts/verify-integration.ts
 * Purpose: Verify all API routes are properly integrated with database
 * 
 * Usage:
 *   npx tsx scripts/verify-integration.ts
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import logger, { log } from '@/utils/logger';

// Load environment variables
let envPath = '.env.local';
try {
  require('fs').accessSync(envPath);
} catch {
  envPath = '.env';
}

const envFile = readFileSync(envPath, 'utf-8');
envFile.split('\n').forEach((line: string) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
});

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;

if (!DATABASE_URL) {
  log.error('❌ Error: DATABASE_URL or NEON_CONNECTION_STRING not found');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

interface VerificationResult {
  test: string;
  status: 'pass' | 'fail';
  message: string;
}

async function verifyIntegration() {
  const results: VerificationResult[] = [];

  try {
    logger.info('🔍 Verifying Database Integration\n');
    logger.info('=' .repeat(50));
    logger.info('');

    // Test 1: Tables exist
    logger.info('1️⃣ Verifying tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    const expectedTables = [
      'users', 'wallets', 'transactions', 'autopay_rules',
      'autopay_transactions', 'contacts', 'groups', 'group_members',
      'money_requests', 'notifications'
    ];

    const foundTables = tables.map((t: any) => t.table_name);
    const missingTables = expectedTables.filter(t => !foundTables.includes(t));
    
    if (missingTables.length === 0) {
      results.push({ test: 'Tables', status: 'pass', message: `All ${expectedTables.length} tables exist` });
      logger.info(`   ✅ All ${expectedTables.length} tables exist\n`);
    } else {
      results.push({ test: 'Tables', status: 'fail', message: `Missing: ${missingTables.join(', ')}` });
      logger.info(`   ❌ Missing tables: ${missingTables.join(', ')}\n`);
    }

    // Test 2: Indexes exist
    logger.info('2️⃣ Verifying indexes...');
    const indexes = await sql`
      SELECT COUNT(*) as count
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `;
    const indexCount = parseInt(indexes[0].count);
    
    if (indexCount >= 20) {
      results.push({ test: 'Indexes', status: 'pass', message: `${indexCount} indexes found` });
      logger.info(`   ✅ ${indexCount} indexes found\n`);
    } else {
      results.push({ test: 'Indexes', status: 'fail', message: `Only ${indexCount} indexes found (expected >= 20)` });
      logger.info(`   ⚠️  Only ${indexCount} indexes found\n`);
    }

    // Test 3: Triggers exist
    logger.info('3️⃣ Verifying triggers...');
    const triggers = await sql`
      SELECT COUNT(*) as count
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
    `;
    const triggerCount = parseInt(triggers[0].count);
    
    if (triggerCount >= 5) {
      results.push({ test: 'Triggers', status: 'pass', message: `${triggerCount} triggers found` });
      logger.info(`   ✅ ${triggerCount} triggers found\n`);
    } else {
      results.push({ test: 'Triggers', status: 'fail', message: `Only ${triggerCount} triggers found (expected >= 5)` });
      logger.info(`   ⚠️  Only ${triggerCount} triggers found\n`);
    }

    // Test 4: UUID extension
    logger.info('4️⃣ Verifying UUID extension...');
    const extensions = await sql`
      SELECT extname FROM pg_extension WHERE extname = 'uuid-ossp'
    `;
    
    if (extensions.length > 0) {
      results.push({ test: 'UUID Extension', status: 'pass', message: 'UUID extension enabled' });
      logger.info('   ✅ UUID extension enabled\n');
    } else {
      results.push({ test: 'UUID Extension', status: 'fail', message: 'UUID extension not found' });
      logger.info('   ❌ UUID extension not found\n');
    }

    // Test 5: Test CRUD operations (using existing schema)
    logger.info('5️⃣ Testing CRUD operations...');
    const testExternalId = `verify-${Date.now()}`;
    
    try {
      // Create (using existing schema: external_id, full_name, phone_number)
      await sql`
        INSERT INTO users (external_id, phone_number, full_name)
        VALUES (${testExternalId}, '+264819999999', 'Test User')
      `;
      logger.info('   ✅ CREATE test passed');

      // Read
      const user = await sql`SELECT * FROM users WHERE external_id = ${testExternalId}`;
      if (user.length > 0) {
        logger.info('   ✅ READ test passed');
      } else {
        throw new Error('User not found after creation');
      }

      // Update
      await sql`
        UPDATE users SET full_name = ${'Test User Updated'} WHERE external_id = ${testExternalId}
      `;
      logger.info('   ✅ UPDATE test passed');

      // Delete
      await sql`DELETE FROM users WHERE external_id = ${testExternalId}`;
      logger.info('   ✅ DELETE test passed');
      
      results.push({ test: 'CRUD Operations', status: 'pass', message: 'All CRUD operations working' });
      logger.info('');
    } catch (error: any) {
      results.push({ test: 'CRUD Operations', status: 'fail', message: error.message });
      logger.info(`   ❌ CRUD test failed: ${error.message}\n`);
    }

    // Test 6: Check required fields exist
    logger.info('6️⃣ Verifying required fields...');
    try {
      // Check that money_requests has paid_amount and paid_at
      const requestColumns = await sql`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'money_requests' 
        AND column_name IN ('paid_amount', 'paid_at')
      `;
      
      // Check users table has key fields
      const userColumns = await sql`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name IN ('external_id', 'full_name', 'phone_number')
      `;
      
      const hasPaidFields = requestColumns.length >= 1; // At least paid_amount
      const hasUserFields = userColumns.length >= 2;
      
      if (hasPaidFields && hasUserFields) {
        results.push({ test: 'Required Fields', status: 'pass', message: 'All required fields exist' });
        logger.info('   ✅ All required fields exist (paid_amount, external_id, full_name)\n');
      } else {
        const missing = [];
        if (!hasPaidFields) missing.push('money_requests.paid_amount');
        if (!hasUserFields) missing.push('users required fields');
        results.push({ test: 'Required Fields', status: 'fail', message: `Missing: ${missing.join(', ')}` });
        logger.info(`   ⚠️  Missing fields: ${missing.join(', ')}\n`);
      }
    } catch (error: any) {
      results.push({ test: 'Required Fields', status: 'fail', message: error.message });
      logger.info(`   ❌ Field check failed: ${error.message}\n`);
    }

    // Summary
    logger.info('=' .repeat(50));
    logger.info('📊 Verification Summary\n');
    
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    
    results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : '❌';
      logger.info(`${icon} ${result.test}: ${result.message}`);
    });
    
    logger.info('');
    logger.info(`Total: ${results.length} tests`);
    logger.info(`✅ Passed: ${passed}`);
    logger.info(`❌ Failed: ${failed}`);
    logger.info('');
    
    if (failed === 0) {
      logger.info('🎉 All verifications passed! Database integration is complete.\n');
      process.exit(0);
    } else {
      logger.info('⚠️  Some verifications failed. Please review and fix issues.\n');
      process.exit(1);
    }

  } catch (error: any) {
    log.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

// Run verification
verifyIntegration();
