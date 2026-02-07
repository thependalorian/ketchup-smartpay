/**
 * Database Connection
 *
 * Location: backend/src/database/connection.ts
 * Purpose: Neon PostgreSQL database connection for Ketchup SmartPay
 * Serverless: Lazy init so we don't throw at import time (Vercel env may not be ready).
 */
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { log } from '../utils/logger';
// Load dotenv only when DATABASE_URL is missing (local dev). On Vercel env is injected.
if (!process.env.DATABASE_URL) {
    dotenv.config();
    dotenv.config({ path: resolve(process.cwd(), '.env.local') });
}
let _sql = null;
function getSql() {
    if (_sql)
        return _sql;
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error('DATABASE_URL environment variable is required. Set it in Vercel project env or .env.local.');
    }
    _sql = neon(url);
    return _sql;
}
/** Lazy Neon client: first use initializes; avoids throw-at-import in serverless. */
export const sql = new Proxy({}, {
    get(_, prop) {
        return getSql()[prop];
    },
});
/**
 * Test database connection
 */
export async function testConnection() {
    try {
        const result = await sql `SELECT NOW() as current_time`;
        log('Database connection successful', { time: result[0]?.current_time });
        return true;
    }
    catch (error) {
        log('Database connection failed', { error });
        throw error;
    }
}
//# sourceMappingURL=connection.js.map