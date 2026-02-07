/**
 * Database Connection
 *
 * Location: backend/src/database/connection.ts
 * Purpose: Neon PostgreSQL database connection for Ketchup SmartPay
 * Serverless: Lazy init so we don't throw at import time (Vercel env may not be ready).
 */
import { type NeonQueryFunction } from '@neondatabase/serverless';
/** Lazy Neon client: first use initializes; avoids throw-at-import in serverless. */
export declare const sql: NeonQueryFunction<false, false>;
/**
 * Test database connection
 */
export declare function testConnection(): Promise<boolean>;
//# sourceMappingURL=connection.d.ts.map