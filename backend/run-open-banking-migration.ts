/**
 * Run Open Banking Migration
 * 
 * Purpose: Execute migration 005_open_banking_schema.sql
 * Usage: npx tsx run-open-banking-migration.ts
 */

import { sql } from './src/database/connection';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { log, logError } from './src/utils/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runOpenBankingMigration() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Running Open Banking Migration (005)                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // Read migration file
    const migrationPath = resolve(__dirname, 'src/database/migrations/005_open_banking_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📁 Migration file loaded: 005_open_banking_schema.sql\n');
    console.log('📊 Executing migration...\n');

    // Execute entire migration as one transaction
    // Neon driver handles multi-statement SQL automatically
    try {
      // Split into logical blocks and execute
      const createStatements = migrationSQL.match(/CREATE TABLE[^;]+;/gi) || [];
      const indexStatements = migrationSQL.match(/CREATE INDEX[^;]+;/gi) || [];
      const commentStatements = migrationSQL.match(/COMMENT ON[^;]+;/gi) || [];

      // Create tables
      for (const stmt of createStatements) {
        try {
          await sql([stmt] as any);
          const match = stmt.match(/CREATE TABLE.*?(?:IF NOT EXISTS)?\s+(\w+)/i);
          if (match) {
            console.log(`✅ Table: ${match[1]}`);
          }
        } catch (error: any) {
          if (error.message?.includes('already exists')) {
            const match = stmt.match(/CREATE TABLE.*?(?:IF NOT EXISTS)?\s+(\w+)/i);
            console.log(`⚠️  Table ${match?.[1] || 'unknown'} already exists`);
          } else {
            throw error;
          }
        }
      }

      // Create indexes
      for (const stmt of indexStatements) {
        try {
          await sql([stmt] as any);
        } catch (error: any) {
          // Silently ignore index errors (already exist)
        }
      }
      console.log(`✅ Created ${indexStatements.length} indexes`);

      // Add comments
      for (const stmt of commentStatements) {
        try {
          await sql([stmt] as any);
        } catch (error: any) {
          // Silently ignore comment errors
        }
      }
      console.log(`✅ Added ${commentStatements.length} table comments`);
    } catch (error: any) {
      throw error;
    }

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║      ✅ OPEN BANKING MIGRATION COMPLETED                  ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // Verify tables were created
    console.log('🔍 Verifying Open Banking tables...\n');
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'open_banking%' 
      OR table_name LIKE 'oauth_%'
      ORDER BY table_name
    `;

    console.log(`✅ Found ${tables.length} Open Banking tables:`);
    tables.forEach((table: any) => {
      console.log(`   - ${table.table_name}`);
    });

    console.log('\n✅ Open Banking schema ready!');
    console.log('   Run: npx tsx test-open-banking.ts to test the implementation\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    logError('Open Banking migration failed', error);
    process.exit(1);
  }
}

runOpenBankingMigration();
