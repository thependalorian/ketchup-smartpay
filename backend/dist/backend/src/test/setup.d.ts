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
/**
 * Clean test data from database
 */
export declare function cleanTestData(): Promise<void>;
/**
 * Setup test database
 */
export declare function setupTestDatabase(): Promise<void>;
//# sourceMappingURL=setup.d.ts.map