/**
 * Execute Migration for Existing Schema
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync, accessSync } from 'fs';
import logger, { log } from '@/utils/logger';

let envPath = '.env.local';
try {
  accessSync(envPath);
} catch {
  envPath = '.env';
}

const envFile = readFileSync(envPath, 'utf-8');
envFile.split('\n').forEach((line: string) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|[""]$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
});

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;
const sql = neon(DATABASE_URL!);

async function executeMigration() {
  logger.info('🚀 Executing migration for existing schema...\n');

  const migration = readFileSync('sql/migrate-existing-schema.sql', 'utf-8');
  
  // Split into individual statements
  const statements = migration
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let success = 0;
  let skipped = 0;
  let errors = 0;

  for (const stmt of statements) {
    if (!stmt) continue;
    
    try {
      await (sql as any).query(stmt);
      success++;
      logger.info('✅ Executed statement');
    } catch (error: any) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        skipped++;
        logger.info('⚠️  Already exists');
      } else {
        errors++;
        log.error(`❌ Error: ${error.message.substring(0, 100)}`);
      }
    }
  }

  logger.info(`\n📊 Summary: ${success} successful, ${skipped} skipped, ${errors} errors\n`);
}

executeMigration();
