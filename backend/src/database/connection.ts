/**
 * Database Connection
 *
 * Location: backend/src/database/connection.ts
 * Purpose: Neon PostgreSQL database connection for SmartPay Connect
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { log } from '../utils/logger';

// Load environment variables early (supports .env.local for development)
dotenv.config();
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create Neon serverless connection
export const sql = neon(DATABASE_URL);

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await sql`SELECT NOW() as current_time`;
    log('Database connection successful', { time: result[0]?.current_time });
    return true;
  } catch (error) {
    log('Database connection failed', { error });
    throw error;
  }
}
