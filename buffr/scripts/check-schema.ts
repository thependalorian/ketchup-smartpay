/**
 * Check Existing Database Schema
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import logger from '@/utils/logger';

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
const sql = neon(DATABASE_URL!);

async function checkSchema() {
  const tables = ['users', 'wallets', 'transactions', 'contacts', 'groups', 'money_requests', 'notifications'];
  
  for (const table of tables) {
    logger.info(`\n📋 ${table.toUpperCase()} table:`);
    const cols = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = ${table}
      ORDER BY ordinal_position
    `;
    cols.forEach((c: any) => {
      logger.info(`   ${c.column_name}: ${c.data_type} ${c.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
  }
}

checkSchema();
