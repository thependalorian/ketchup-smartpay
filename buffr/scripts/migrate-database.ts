/**
 * Database Migration Script
 * 
 * Location: scripts/migrate-database.ts
 * Purpose: Execute database schema migration
 * 
 * Usage:
 *   npx tsx scripts/migrate-database.ts
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync, accessSync } from 'fs';
import { join } from 'path';
import logger, { log } from '@/utils/logger';

// Load environment variables
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
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
});

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;

if (!DATABASE_URL) {
  log.error('❌ Error: DATABASE_URL or NEON_CONNECTION_STRING not found in environment');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function executeMigration() {
  try {
    logger.info('🚀 Starting database migration...\n');

    // Check existing tables first
    const existingTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'wallets', 'transactions', 'autopay_rules', 
                         'autopay_transactions', 'contacts', 'groups', 
                         'group_members', 'money_requests', 'notifications')
      ORDER BY table_name
    `;
    
    const existingTableNames = existingTables.map((t: any) => t.table_name);
    logger.info(`📋 Existing tables: ${existingTableNames.length > 0 ? existingTableNames.join(', ') : 'None'}\n`);

    // Read schema file
    const schemaPath = join(process.cwd(), 'sql', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Execute extension
    logger.info('1️⃣ Creating UUID extension...');
    try {
      await (sql as any).query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      successCount++;
      logger.info('   ✅ UUID extension\n');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        skippedCount++;
        logger.info('   ⚠️  UUID extension (already exists)\n');
      } else {
        errorCount++;
        log.error(`   ❌ Error: ${error.message}\n`);
      }
    }

    // Execute tables
    logger.info('2️⃣ Creating tables...\n');
    const tablePatterns = [
      { name: 'users', pattern: /CREATE TABLE[^;]+users[^;]+;/is },
      { name: 'wallets', pattern: /CREATE TABLE[^;]+wallets[^;]+;/is },
      { name: 'transactions', pattern: /CREATE TABLE[^;]+transactions[^;]+;/is },
      { name: 'autopay_rules', pattern: /CREATE TABLE[^;]+autopay_rules[^;]+;/is },
      { name: 'autopay_transactions', pattern: /CREATE TABLE[^;]+autopay_transactions[^;]+;/is },
      { name: 'contacts', pattern: /CREATE TABLE[^;]+contacts[^;]+;/is },
      { name: 'groups', pattern: /CREATE TABLE[^;]+groups[^;]+;/is },
      { name: 'group_members', pattern: /CREATE TABLE[^;]+group_members[^;]+;/is },
      { name: 'money_requests', pattern: /CREATE TABLE[^;]+money_requests[^;]+;/is },
      { name: 'notifications', pattern: /CREATE TABLE[^;]+notifications[^;]+;/is },
    ];

    for (const { name, pattern } of tablePatterns) {
      const match = schema.match(pattern);
      if (match) {
        try {
          await (sql as any).query(match[0]);
          successCount++;
          logger.info(`   ✅ ${name}`);
        } catch (error: any) {
          if (error.message.includes('already exists')) {
            skippedCount++;
            logger.info(`   ⚠️  ${name} (already exists)`);
          } else {
            errorCount++;
            log.error(`   ❌ ${name}: ${error.message}`);
          }
        }
      }
    }
    logger.info('');

    // Execute indexes
    logger.info('3️⃣ Creating indexes...\n');
    const indexStatements = schema.match(/CREATE INDEX[^;]+;/gi) || [];
    
    for (const statement of indexStatements) {
      try {
        await (sql as any).query(statement);
        successCount++;
        const match = statement.match(/CREATE INDEX[^;]+ON\s+([^\s(]+)/i);
        const tableName = match ? match[1] : 'unknown';
        logger.info(`   ✅ Index on ${tableName}`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          skippedCount++;
          const match = statement.match(/CREATE INDEX[^;]+ON\s+([^\s(]+)/i);
          const tableName = match ? match[1] : 'unknown';
          logger.info(`   ⚠️  Index on ${tableName} (already exists)`);
        } else if (error.message.includes('does not exist')) {
          // Column doesn't exist - might be from old schema
          skippedCount++;
          logger.info(`   ⚠️  Index skipped (column not found)`);
        } else {
          errorCount++;
          log.error(`   ❌ Index error: ${error.message.substring(0, 80)}`);
        }
      }
    }
    logger.info('');

    // Execute function
    logger.info('4️⃣ Creating trigger function...\n');
    const functionMatch = schema.match(/CREATE OR REPLACE FUNCTION[^;]+END[^;]+language[^;]+;/is);
    if (functionMatch) {
      try {
        await (sql as any).query(functionMatch[0]);
        successCount++;
        logger.info('   ✅ Trigger function created\n');
      } catch (error: any) {
        if (!error.message.includes('syntax error')) {
          successCount++;
          logger.info('   ⚠️  Trigger function (may already exist)\n');
        } else {
          errorCount++;
          log.error(`   ❌ Function error: ${error.message}\n`);
        }
      }
    }

    // Execute triggers
    logger.info('5️⃣ Creating triggers...\n');
    const triggerStatements = schema.match(/CREATE TRIGGER[^;]+;/gi) || [];
    
    for (const statement of triggerStatements) {
      try {
        await (sql as any).query(statement);
        successCount++;
        const match = statement.match(/CREATE TRIGGER[^;]+ON\s+([^\s(]+)/i);
        const tableName = match ? match[1] : 'unknown';
        logger.info(`   ✅ Trigger on ${tableName}`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          skippedCount++;
          const match = statement.match(/CREATE TRIGGER[^;]+ON\s+([^\s(]+)/i);
          const tableName = match ? match[1] : 'unknown';
          logger.info(`   ⚠️  Trigger on ${tableName} (already exists)`);
        } else {
          errorCount++;
          log.error(`   ❌ Trigger error: ${error.message.substring(0, 80)}`);
        }
      }
    }
    logger.info('');

    // Run migration for new fields
    logger.info('6️⃣ Adding new fields to existing tables...\n');
    const migrationPath = join(process.cwd(), 'sql', 'migration_add_fields.sql');
    try {
      const migration = readFileSync(migrationPath, 'utf-8');
      const migrationStatements = migration
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of migrationStatements) {
        try {
          await (sql as any).query(statement);
          successCount++;
          const match = statement.match(/ALTER TABLE[^;]+ADD COLUMN[^;]+([^\s]+)/i);
          const columnName = match ? match[1] : 'column';
          logger.info(`   ✅ Added ${columnName}`);
        } catch (error: any) {
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            skippedCount++;
            logger.info(`   ⚠️  Column (already exists)`);
          } else {
            errorCount++;
            log.error(`   ❌ Error: ${error.message.substring(0, 80)}`);
          }
        }
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        logger.info('   ⚠️  Migration file not found (skipping)\n');
      } else {
        log.error(`   ❌ Migration error: ${error.message}\n`);
      }
    }
    logger.info('');

    // Summary
    logger.info('='.repeat(50));
    logger.info('📊 Migration Summary:\n');
    logger.info(`   ✅ Successful: ${successCount}`);
    logger.info(`   ⚠️  Skipped (already exists): ${skippedCount}`);
    logger.info(`   ❌ Errors: ${errorCount}`);
    logger.info('');

    if (errorCount === 0) {
      logger.info('✅ Migration completed successfully!\n');
      
      // Verify tables
      logger.info('🔍 Verifying tables...\n');
      const finalTables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'wallets', 'transactions', 'autopay_rules',
                           'autopay_transactions', 'contacts', 'groups',
                           'group_members', 'money_requests', 'notifications')
        ORDER BY table_name
      `;
      
      logger.info('📋 Required tables:');
      finalTables.forEach((table: any) => {
        logger.info(`   ✅ ${table.table_name}`);
      });
      
      const missing = ['users', 'wallets', 'transactions', 'autopay_rules',
                       'autopay_transactions', 'contacts', 'groups',
                       'group_members', 'money_requests', 'notifications']
        .filter(t => !finalTables.some((ft: any) => ft.table_name === t));
      
      if (missing.length > 0) {
        logger.info(`\n   ⚠️  Missing tables: ${missing.join(', ')}`);
      } else {
        logger.info(`\n   ✅ All 10 required tables exist!\n`);
      }
    } else {
      logger.info('⚠️  Migration completed with errors. Some objects may already exist.\n');
    }

  } catch (error: any) {
    log.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
executeMigration();
