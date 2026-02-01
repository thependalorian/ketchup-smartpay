/**
 * Check Actual Database Columns
 *
 * Location: scripts/check-actual-columns.ts
 * Purpose: Check what columns actually exist in the database
 * Usage: npx tsx scripts/check-actual-columns.ts
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync, accessSync } from 'fs';
import logger, { log } from '@/utils/logger';

// Load environment variables
function loadEnv(): void {
  const envPaths = ['.env.local', '.env'];
  for (const envPath of envPaths) {
    try {
      accessSync(envPath);
      const envFile = readFileSync(envPath, 'utf-8');
      envFile.split('\n').forEach((line: string) => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          value = value.replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
      return;
    } catch {
      // Continue
    }
  }
}

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;

if (!DATABASE_URL) {
  log.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function checkColumns(tableName: string, expectedColumns: string[]) {
  try {
    const columns = await sql<{ column_name: string }[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${tableName}
      ORDER BY column_name
    `;
    
    const existing = columns.map(c => c.column_name);
    const missing = expectedColumns.filter(col => !existing.includes(col));
    const found = expectedColumns.filter(col => existing.includes(col));
    
    return { existing, missing, found };
  } catch (error) {
    log.error(`Error checking ${tableName}:`, error);
    return { existing: [], missing: expectedColumns, found: [] };
  }
}

async function main() {
  logger.info('='.repeat(60));
  logger.info('ACTUAL DATABASE COLUMNS CHECK');
  logger.info('='.repeat(60));
  logger.info('');

  const checks = [
    {
      table: 'users',
      columns: ['status', 'first_name', 'last_name', 'currency', 'avatar']
    },
    {
      table: 'contacts',
      columns: ['phone_number', 'avatar', 'bank_code', 'metadata']
    },
    {
      table: 'groups',
      columns: ['type', 'avatar', 'is_active', 'metadata']
    },
    {
      table: 'transactions',
      columns: ['wallet_id', 'type', 'description', 'category', 'date', 'recipient_id', 'recipient_name']
    },
    {
      table: 'money_requests',
      columns: ['description', 'expires_at', 'metadata']
    },
    {
      table: 'notifications',
      columns: ['data', 'read_at']
    }
  ];

  for (const { table, columns } of checks) {
    logger.info(`\n📋 Table: ${table}`);
    logger.info('-'.repeat(40));
    const { found, missing } = await checkColumns(table, columns);
    
    if (found.length > 0) {
      logger.info('   ✅ Found:');
      found.forEach(col => logger.info(`      - ${col}`));
    }
    
    if (missing.length > 0) {
      logger.info('   ⚠️  Missing:');
      missing.forEach(col => logger.info(`      - ${col}`));
    }
  }

  logger.info('\n');
  logger.info('='.repeat(60));
}

main().catch(console.error);
