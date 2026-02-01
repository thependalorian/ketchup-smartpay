/**
 * Test Column Addition
 * Directly test adding a column to see if it works
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync, accessSync } from 'fs';
import logger from '@/utils/logger';

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
const sql = neon(DATABASE_URL!);

async function test() {
  logger.info('Testing column addition...\n');
  
  // Test 1: Check if users.status exists
  try {
    const check = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'status'
    `;
    logger.info('Before: users.status exists?', { exists: check.length > 0 });
  } catch (e) {
    logger.info('Error checking:', { e });
  }
  
  // Test 2: Try to add the column
  try {
    await (sql as any).query('ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT \'active\'');
    logger.info('✅ ALTER TABLE statement executed');
  } catch (e: any) {
    logger.info('❌ Error executing ALTER TABLE:', { message: e.message });
  }
  
  // Test 3: Check again
  try {
    const check = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'status'
    `;
    logger.info('After: users.status exists?', { exists: check.length > 0 });
    if (check.length > 0) {
      logger.info('✅ Column was added successfully!');
    } else {
      logger.info('❌ Column still missing - migration may not be working');
    }
  } catch (e) {
    logger.info('Error checking after:', { e });
  }
}

test().catch(console.error);
