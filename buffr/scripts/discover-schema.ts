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
    process.env[key] = value;
  }
});

const sql = neon(process.env.DATABASE_URL!);

async function discover() {
  const tables = ['users', 'wallets', 'transactions', 'vouchers'];
  for (const table of tables) {
    logger.info(`\n--- ${table} ---`);
    const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ${table}`;
    logger.info(cols.map(c => `${c.column_name} (${c.data_type})`).join(', '));
  }
}

discover();