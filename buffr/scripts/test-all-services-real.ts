/**
 * Real Database Testing Script
 * 
 * Location: scripts/test-all-services-real.ts
 * Purpose: Test all services with real database connections and data
 * 
 * Usage:
 *   npx tsx scripts/test-all-services-real.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const results: Array<{ category: string; test: string; status: 'pass' | 'fail'; details?: any; error?: string }> = [];

async function test(name: string, category: string, fn: () => Promise<any>) {
  try {
    const result = await fn();
    results.push({ category, test: name, status: 'pass', details: result });
    console.log(`✅ ${name}`);
    return result;
  } catch (error: any) {
    results.push({ category, test: name, status: 'fail', error: error.message });
    console.error(`❌ ${name}: ${error.message}`);
    throw error;
  }
}

async function main() {
  console.log('\n🧪 REAL DATABASE TESTING\n');
  console.log('='.repeat(60));

  // Test 1: Database Connection
  await test('Database Connection', 'Connection', async () => {
    const { query } = await import('../utils/db');
    try {
      // Test with a simple query that always returns a result
      const result = await query('SELECT 1 as test_value, NOW() as current_time');
      if (!Array.isArray(result)) {
        throw new Error('Database connection failed - result is not an array');
      }
      // Even if empty, connection worked - check if we can query
      const testResult = await query('SELECT $1 as value', [42]);
      if (!Array.isArray(testResult) || testResult.length === 0 || testResult[0]?.value !== 42) {
        throw new Error('Database connection failed - parameterized query failed');
      }
      return { connected: true, testValue: testResult[0]?.value };
    } catch (error: any) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  });

  // Test 2: Table Existence
  await test('Audit Log Tables Exist', 'Database', async () => {
    const { query } = await import('../utils/db');
    const tables = ['audit_logs', 'pin_audit_logs', 'voucher_audit_logs', 
                    'transaction_audit_logs', 'api_sync_audit_logs', 'staff_audit_logs'];
    const missing: string[] = [];
    
    for (const table of tables) {
      const result = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) as exists
      `, [table]);
      
      if (!result[0]?.exists) {
        missing.push(table);
      }
    }
    
    if (missing.length > 0) {
      throw new Error(`Missing tables: ${missing.join(', ')}`);
    }
    
    return { tables: tables.length, allExist: true };
  });

  // Test 3: Archive Tables
  await test('Archive Tables Exist', 'Database', async () => {
    const { query } = await import('../utils/db');
    const tables = ['audit_logs_archive', 'pin_audit_logs_archive', 
                    'voucher_audit_logs_archive', 'transaction_audit_logs_archive',
                    'api_sync_audit_logs_archive', 'staff_audit_logs_archive'];
    const missing: string[] = [];
    
    for (const table of tables) {
      const result = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) as exists
      `, [table]);
      
      if (!result[0]?.exists) {
        missing.push(table);
      }
    }
    
    if (missing.length > 0) {
      throw new Error(`Missing archive tables: ${missing.join(', ')}`);
    }
    
    return { tables: tables.length, allExist: true };
  });

  // Test 4: Incident Reporting Tables
  await test('Incident Reporting Tables Exist', 'Database', async () => {
    const { query } = await import('../utils/db');
    const tables = ['security_incidents', 'incident_updates', 
                    'incident_notifications', 'incident_metrics'];
    const missing: string[] = [];
    
    for (const table of tables) {
      const result = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) as exists
      `, [table]);
      
      if (!result[0]?.exists) {
        missing.push(table);
      }
    }
    
    if (missing.length > 0) {
      throw new Error(`Missing incident tables: ${missing.join(', ')}`);
    }
    
    return { tables: tables.length, allExist: true };
  });

  // Test 5: Create and Retrieve Incident
  await test('Create and Retrieve Incident', 'Incident Reporting', async () => {
    const { createIncident, getIncident, listIncidents } = await import('../utils/incidentReporting');
    
    // Create incident
    const incident = await createIncident({
      incident_type: 'system_failure',
      severity: 'low',
      title: 'Real Database Test Incident',
      description: 'Testing incident creation with real database',
      created_by: 'test-script',
    });
    
    if (!incident || !incident.incident_number) {
      throw new Error('Failed to create incident');
    }
    
    // Retrieve incident
    const retrieved = await getIncident(incident.id);
    if (!retrieved || retrieved.id !== incident.id) {
      throw new Error('Failed to retrieve incident');
    }
    
    // List incidents
    const incidents = await listIncidents({ limit: 5 });
    if (!Array.isArray(incidents)) {
      throw new Error('Failed to list incidents');
    }
    
    // Clean up
    const { query } = await import('../utils/db');
    await query('DELETE FROM security_incidents WHERE id = $1', [incident.id]);
    
    return {
      created: incident.incident_number,
      retrieved: retrieved.incident_number,
      totalIncidents: incidents.length,
    };
  });

  // Test 6: Incident Reporting Automation
  await test('Incident Reporting Automation', 'Incident Reporting', async () => {
    const { checkPendingNotifications, checkOverdueNotifications } = await import('../services/incidentReportingAutomation');
    
    const pending = await checkPendingNotifications();
    const overdue = await checkOverdueNotifications();
    
    if (!Array.isArray(pending) || !Array.isArray(overdue)) {
      throw new Error('Invalid return types');
    }
    
    return {
      pendingCount: pending.length,
      overdueCount: overdue.length,
    };
  });

  // Test 7: Audit Log Retention Stats
  await test('Audit Log Retention Stats', 'Audit Logs', async () => {
    const { getRetentionStats } = await import('../services/auditLogRetention');
    
    const stats = await getRetentionStats();
    
    if (typeof stats.totalLogs !== 'number' || 
        typeof stats.logsInRetention !== 'number' ||
        typeof stats.logsToArchive !== 'number') {
      throw new Error('Invalid stats structure');
    }
    
    return stats;
  });

  // Test 8: Audit Log Archival (dry run - no actual archival)
  await test('Audit Log Archival Function', 'Audit Logs', async () => {
    const { archiveOldAuditLogs } = await import('../services/auditLogRetention');
    
    // This will return stats even if no logs to archive
    const result = await archiveOldAuditLogs();
    
    if (typeof result.archived !== 'number' || !Array.isArray(result.errors)) {
      throw new Error('Invalid archival result structure');
    }
    
    return {
      archived: result.archived,
      errors: result.errors.length,
    };
  });

  // Test 9: Staff Action Logger
  await test('Staff Action Logger Function', 'Staff Actions', async () => {
    const { logStaffActionWithContext } = await import('../utils/staffActionLogger');
    
    if (typeof logStaffActionWithContext !== 'function') {
      throw new Error('Staff action logger not found');
    }
    
    return { functionExists: true };
  });

  // Test 10: Query Function with Parameters
  await test('Query Function Parameterized Queries', 'Database', async () => {
    const { query } = await import('../utils/db');
    
    // Test with parameters
    const result1 = await query('SELECT $1 as value', [42]);
    if (!Array.isArray(result1) || result1[0]?.value !== 42) {
      throw new Error('Parameterized query failed');
    }
    
    // Test with multiple parameters
    const result2 = await query('SELECT $1 as a, $2 as b WHERE $1 = $2', [100, 100]);
    if (!Array.isArray(result2) || result2.length === 0) {
      throw new Error('Multi-parameter query failed');
    }
    
    return { singleParam: true, multiParam: true };
  });

  // Print summary
  console.log('\n📊 TEST SUMMARY\n');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ${failed > 0 ? '❌' : ''}`);
  
  if (failed > 0) {
    console.log('\nFailed Tests:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`  - ${r.category}: ${r.test}`);
      console.log(`    Error: ${r.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Group by category
  const byCategory: Record<string, Array<typeof results[0]>> = {};
  results.forEach(r => {
    if (!byCategory[r.category]) byCategory[r.category] = [];
    byCategory[r.category].push(r);
  });
  
  console.log('\nBy Category:');
  Object.entries(byCategory).forEach(([category, tests]) => {
    const categoryPassed = tests.filter(t => t.status === 'pass').length;
    console.log(`  ${category}: ${categoryPassed}/${tests.length} passed`);
  });
  
  return { passed, failed, total, results };
}

main().then((summary) => {
  process.exit(summary.failed > 0 ? 1 : 0);
}).catch((error) => {
  console.error('\n❌ Test script error:', error);
  process.exit(1);
});
