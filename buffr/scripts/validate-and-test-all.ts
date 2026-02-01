/**
 * Comprehensive Validation and Testing Script
 * 
 * Location: scripts/validate-and-test-all.ts
 * Purpose: Validate all migrations, test all services, and verify end-to-end functionality
 * 
 * Usage:
 *   npx tsx scripts/validate-and-test-all.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL or NEON_CONNECTION_STRING environment variable is required');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// Test results tracker
const results = {
  migrations: { passed: 0, failed: 0, tests: [] as Array<{ name: string; status: 'pass' | 'fail'; error?: string }> },
  services: { passed: 0, failed: 0, tests: [] as Array<{ name: string; status: 'pass' | 'fail'; error?: string }> },
  endpoints: { passed: 0, failed: 0, tests: [] as Array<{ name: string; status: 'pass' | 'fail'; error?: string }> },
};

// Helper to test a function
async function test(name: string, fn: () => Promise<void>, category: 'migrations' | 'services' | 'endpoints') {
  try {
    await fn();
    results[category].passed++;
    results[category].tests.push({ name, status: 'pass' });
    console.log(`✅ ${name}`);
  } catch (error: any) {
    results[category].failed++;
    results[category].tests.push({ name, status: 'fail', error: error.message });
    console.error(`❌ ${name}: ${error.message}`);
  }
}

// ============================================================================
// MIGRATION VALIDATION
// ============================================================================

async function validateMigrations() {
  console.log('\n📋 VALIDATING MIGRATIONS\n');
  console.log('='.repeat(60));

  // Base audit log tables
  await test('Base Audit Log Tables', async () => {
    const tables = [
      'audit_logs',
      'pin_audit_logs',
      'voucher_audit_logs',
      'transaction_audit_logs',
      'api_sync_audit_logs',
      'staff_audit_logs',
    ];

    for (const table of tables) {
      const result = await sql.unsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table}'
        ) as exists
      `);
      
      if (!result[0]?.exists) {
        throw new Error(`Table ${table} does not exist`);
      }
    }
  }, 'migrations');

  // Archive tables
  await test('Archive Audit Log Tables', async () => {
    const tables = [
      'audit_logs_archive',
      'pin_audit_logs_archive',
      'voucher_audit_logs_archive',
      'transaction_audit_logs_archive',
      'api_sync_audit_logs_archive',
      'staff_audit_logs_archive',
    ];

    for (const table of tables) {
      // Use template literal for proper query execution
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        ) as exists
      `;
      
      const exists = Array.isArray(result) && result.length > 0 ? result[0]?.exists : false;
      if (!exists) {
        throw new Error(`Archive table ${table} does not exist`);
      }
    }
  }, 'migrations');

  // Incident reporting tables
  await test('Incident Reporting Tables', async () => {
    const tables = [
      'security_incidents',
      'incident_updates',
      'incident_notifications',
      'incident_metrics',
    ];

    for (const table of tables) {
      const result = await sql.unsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table}'
        ) as exists
      `);
      
      if (!result[0]?.exists) {
        throw new Error(`Table ${table} does not exist`);
      }
    }
  }, 'migrations');

  // Incident reporting views and functions
  await test('Incident Reporting Views & Functions', async () => {
    const views = ['v_pending_incident_notifications'];
    const functions = ['generate_incident_number'];

    for (const view of views) {
      // Use template literal for proper query execution
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.views 
          WHERE table_schema = 'public' 
          AND table_name = ${view}
        ) as exists
      `;
      
      const exists = Array.isArray(result) && result.length > 0 ? result[0]?.exists : false;
      if (!exists) {
        throw new Error(`View ${view} does not exist`);
      }
    }

    for (const func of functions) {
      // Use template literal for proper query execution
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.routines 
          WHERE routine_schema = 'public' 
          AND routine_name = ${func}
        ) as exists
      `;
      
      const exists = Array.isArray(result) && result.length > 0 ? result[0]?.exists : false;
      if (!exists) {
        throw new Error(`Function ${func} does not exist`);
      }
    }
  }, 'migrations');
}

// ============================================================================
// SERVICE VALIDATION
// ============================================================================

async function validateServices() {
  console.log('\n🔧 VALIDATING SERVICES\n');
  console.log('='.repeat(60));

  // Test query function
  await test('Database Query Function', async () => {
    const { query } = await import('../utils/db');
    const result = await query('SELECT 1 as test WHERE 1 = $1', [1]);
    if (!result || result.length === 0 || result[0].test !== 1) {
      throw new Error('Query function returned incorrect result');
    }
  }, 'services');

  // Test audit log retention
  await test('Audit Log Retention Service', async () => {
    const { getRetentionStats } = await import('../services/auditLogRetention');
    const stats = await getRetentionStats();
    if (typeof stats.totalLogs !== 'number' || typeof stats.logsInRetention !== 'number') {
      throw new Error('Retention stats returned invalid data');
    }
  }, 'services');

  // Test incident reporting automation
  await test('Incident Reporting Automation', async () => {
    const { checkPendingNotifications, checkOverdueNotifications } = await import('../services/incidentReportingAutomation');
    const pending = await checkPendingNotifications();
    const overdue = await checkOverdueNotifications();
    if (!Array.isArray(pending) || !Array.isArray(overdue)) {
      throw new Error('Incident reporting functions returned invalid data');
    }
  }, 'services');

  // Test incident reporting utilities
  await test('Incident Reporting Utilities', async () => {
    const { createIncident, getIncident, listIncidents, getIncidentMetrics, checkComplianceStatus } = await import('../utils/incidentReporting');
    
    // Create a test incident
    const incident = await createIncident({
      incident_type: 'system_failure',
      severity: 'low',
      title: 'Validation Test Incident',
      description: 'This is a test incident created during validation',
      created_by: 'validation-script',
    });

    if (!incident || !incident.incident_number) {
      throw new Error('Failed to create incident');
    }

    // Get the incident
    const retrieved = await getIncident(incident.id);
    if (!retrieved || retrieved.id !== incident.id) {
      throw new Error('Failed to retrieve incident');
    }

    // List incidents
    const incidents = await listIncidents({ limit: 10 });
    if (!Array.isArray(incidents)) {
      throw new Error('Failed to list incidents');
    }

    // Get metrics
    const metrics = await getIncidentMetrics(30);
    if (typeof metrics.total_incidents !== 'number') {
      throw new Error('Failed to get incident metrics');
    }

    // Check compliance
    const compliance = await checkComplianceStatus();
    if (typeof compliance.pendingNotifications !== 'number') {
      throw new Error('Failed to check compliance status');
    }

    // Clean up test incident
    await sql.unsafe(`DELETE FROM security_incidents WHERE id = '${incident.id}'`);
  }, 'services');

  // Test staff action logger
  await test('Staff Action Logger', async () => {
    const { logStaffActionWithContext } = await import('../utils/staffActionLogger');
    // Just verify the function exists and is callable
    if (typeof logStaffActionWithContext !== 'function') {
      throw new Error('Staff action logger function not found');
    }
  }, 'services');
}

// ============================================================================
// ENDPOINT VALIDATION (Structure Only)
// ============================================================================

async function validateEndpoints() {
  console.log('\n🌐 VALIDATING ENDPOINTS (Structure)\n');
  console.log('='.repeat(60));

  const { readFileSync, existsSync } = await import('fs');
  const { join } = await import('path');

  // Check incident reporting endpoint
  await test('Incident Reporting API Endpoint', async () => {
    const endpointPath = join(process.cwd(), 'app/api/compliance/incidents/route.ts');
    if (!existsSync(endpointPath)) {
      throw new Error('Incident reporting endpoint not found');
    }
    const content = readFileSync(endpointPath, 'utf-8');
    if (!content.includes('handleGetIncidents') || !content.includes('handlePostIncidents')) {
      throw new Error('Incident reporting endpoint missing required handlers');
    }
  }, 'endpoints');

  // Check cron endpoint
  await test('Incident Reporting Cron Endpoint', async () => {
    const endpointPath = join(process.cwd(), 'app/api/cron/incident-reporting-check.ts');
    if (!existsSync(endpointPath)) {
      throw new Error('Incident reporting cron endpoint not found');
    }
  }, 'endpoints');

  // Check audit log endpoints
  await test('Audit Log Query Endpoint', async () => {
    const endpointPath = join(process.cwd(), 'app/api/admin/audit-logs/query/route.ts');
    if (!existsSync(endpointPath)) {
      throw new Error('Audit log query endpoint not found');
    }
  }, 'endpoints');

  await test('Audit Log Export Endpoint', async () => {
    const endpointPath = join(process.cwd(), 'app/api/admin/audit-logs/export/route.ts');
    if (!existsSync(endpointPath)) {
      throw new Error('Audit log export endpoint not found');
    }
  }, 'endpoints');

  await test('Audit Log Retention Endpoint', async () => {
    const endpointPath = join(process.cwd(), 'app/api/admin/audit-logs/retention/route.ts');
    if (!existsSync(endpointPath)) {
      throw new Error('Audit log retention endpoint not found');
    }
  }, 'endpoints');
}

// ============================================================================
// CONFIGURATION VALIDATION
// ============================================================================

async function validateConfiguration() {
  console.log('\n⚙️  VALIDATING CONFIGURATION\n');
  console.log('='.repeat(60));

  const { readFileSync, existsSync } = await import('fs');
  const { join } = await import('path');

  // Check vercel.json
  await test('Vercel Cron Configuration', async () => {
    const vercelPath = join(process.cwd(), 'vercel.json');
    if (!existsSync(vercelPath)) {
      throw new Error('vercel.json not found');
    }
    const vercel = JSON.parse(readFileSync(vercelPath, 'utf-8'));
    if (!vercel.crons || !Array.isArray(vercel.crons)) {
      throw new Error('Cron jobs not configured in vercel.json');
    }
    const incidentCron = vercel.crons.find((c: any) => c.path === '/api/cron/incident-reporting-check');
    if (!incidentCron) {
      throw new Error('Incident reporting cron job not configured');
    }
    if (incidentCron.schedule !== '0 * * * *') {
      throw new Error('Incident reporting cron schedule incorrect (should be "0 * * * *")');
    }
  }, 'migrations');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('\n🚀 COMPREHENSIVE VALIDATION AND TESTING\n');
  console.log('='.repeat(60));
  console.log(`Database: ${DATABASE_URL ? 'Connected' : 'Not Connected'}`);
  console.log('='.repeat(60));

  try {
    // Run all validations
    await validateMigrations();
    await validateConfiguration();
    await validateServices();
    await validateEndpoints();

    // Print summary
    console.log('\n📊 VALIDATION SUMMARY\n');
    console.log('='.repeat(60));
    
    const totalPassed = results.migrations.passed + results.services.passed + results.endpoints.passed;
    const totalFailed = results.migrations.failed + results.services.failed + results.endpoints.failed;
    const totalTests = totalPassed + totalFailed;

    console.log(`Migrations: ${results.migrations.passed}/${results.migrations.passed + results.migrations.failed} passed`);
    if (results.migrations.failed > 0) {
      console.log('  Failed:');
      results.migrations.tests.filter(t => t.status === 'fail').forEach(t => {
        console.log(`    - ${t.name}: ${t.error}`);
      });
    }

    console.log(`\nServices: ${results.services.passed}/${results.services.passed + results.services.failed} passed`);
    if (results.services.failed > 0) {
      console.log('  Failed:');
      results.services.tests.filter(t => t.status === 'fail').forEach(t => {
        console.log(`    - ${t.name}: ${t.error}`);
      });
    }

    console.log(`\nEndpoints: ${results.endpoints.passed}/${results.endpoints.passed + results.endpoints.failed} passed`);
    if (results.endpoints.failed > 0) {
      console.log('  Failed:');
      results.endpoints.tests.filter(t => t.status === 'fail').forEach(t => {
        console.log(`    - ${t.name}: ${t.error}`);
      });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`TOTAL: ${totalPassed}/${totalTests} tests passed`);
    
    if (totalFailed === 0) {
      console.log('\n✅ ALL VALIDATIONS PASSED! System is ready for production.\n');
      process.exit(0);
    } else {
      console.log(`\n⚠️  ${totalFailed} test(s) failed. Please review and fix issues.\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Validation script error:', error);
    process.exit(1);
  }
}

main();
