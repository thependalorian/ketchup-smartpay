/**
 * Test Setup
 *
 * Purpose: Database setup and teardown for integration tests. Uses actual
 * implementation and real database (Neon PostgreSQL via DATABASE_URL).
 * Location: backend/src/test/setup.ts
 *
 * Required: DATABASE_URL in .env.local or .env.test. Run migrations and
 * optionally seed before tests: pnpm run migrate && pnpm run seed
 */
import { beforeAll, beforeEach } from 'vitest';
import { sql } from '../database/connection';
import dotenv from 'dotenv';
import { resolve } from 'path';
// Load test environment variables (order: .env, .env.local, .env.test)
dotenv.config();
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env.test') });
/**
 * Clean test data from database
 */
export async function cleanTestData() {
    try {
        // Delete test data in reverse order of dependencies
        // Clean up test UUIDs (550e8400-e29b-41d4-a716-446655440000-446655440099 range)
        const testUuidStart = '550e8400-e29b-41d4-a716-446655440000';
        const testUuidEnd = '550e8400-e29b-41d4-a716-446655440099';
        await sql `
      DELETE FROM reconciliation_records 
      WHERE voucher_id::text LIKE '550e8400-e29b-41d4-a716-44665544%'
    `.catch(() => { });
        await sql `
      DELETE FROM status_events 
      WHERE voucher_id::text LIKE '550e8400-e29b-41d4-a716-44665544%'
    `.catch(() => { });
        // Use text pattern so cleanup works whether voucher_id is VARCHAR or UUID
        await sql `
      DELETE FROM webhook_events 
      WHERE voucher_id::text LIKE '550e8400-e29b-41d4-a716-44665544%'
        OR id::text LIKE '550e8400-e29b-41d4-a716-44665544%'
    `.catch(() => { });
    }
    catch (error) {
        // Ignore errors if tables don't exist yet
        // This is expected in some test scenarios
    }
}
/**
 * Setup test database
 */
export async function setupTestDatabase() {
    try {
        // Ensure tables exist (migrations should have run)
        await sql `SELECT 1 FROM webhook_events LIMIT 1`.catch(() => {
            throw new Error('webhook_events table does not exist. Run migrations first.');
        });
        await sql `SELECT 1 FROM reconciliation_records LIMIT 1`.catch(() => {
            throw new Error('reconciliation_records table does not exist. Run migrations first.');
        });
        await sql `SELECT 1 FROM status_events LIMIT 1`.catch(() => {
            throw new Error('status_events table does not exist. Run migrations first.');
        });
    }
    catch (error) {
        console.error('Test database setup failed:', error);
        throw error;
    }
}
// Setup database before all tests
beforeAll(async () => {
    try {
        await setupTestDatabase();
    }
    catch (error) {
        console.warn('Database setup warning (may be expected):', error);
        // Continue even if setup fails - tests will handle missing tables
    }
});
// Clean test data before each test
beforeEach(async () => {
    await cleanTestData();
});
//# sourceMappingURL=setup.js.map