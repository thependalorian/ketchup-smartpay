/**
 * Get Complete Database Schema
 * 
 * Purpose: Query the database to get a complete list of all tables and columns
 * Location: scripts/get-complete-schema.ts
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import logger, { log } from '@/utils/logger';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  log.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
  numeric_precision: number | null;
  numeric_scale: number | null;
}

interface TableInfo {
  table_name: string;
  table_type: string;
}

async function getCompleteSchema() {
  try {
    logger.info('Loading environment from .env.local');
    logger.info('============================================================');
    logger.info('COMPLETE DATABASE SCHEMA');
    logger.info('============================================================\n');

    // Get all tables
    const tables = await sql`
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    ` as TableInfo[];

    logger.info(`📊 Found ${tables.length} tables\n`);

    const schema: Record<string, ColumnInfo[]> = {};

    // Get columns for each table
    for (const table of tables) {
      const columns = await sql`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ${table.table_name}
        ORDER BY ordinal_position;
      ` as ColumnInfo[];

      schema[table.table_name] = columns.map(col => ({
        table_name: table.table_name,
        ...col,
      }));
    }

    // Display schema
    for (const [tableName, columns] of Object.entries(schema)) {
      logger.info(`\n📋 Table: ${tableName}`);
      logger.info('─'.repeat(80));
      logger.info(`   Columns: ${columns.length}\n`);

      for (const col of columns) {
        let typeStr = col.data_type.toUpperCase();
        
        if (col.character_maximum_length) {
          typeStr += `(${col.character_maximum_length})`;
        } else if (col.numeric_precision && col.numeric_scale) {
          typeStr += `(${col.numeric_precision},${col.numeric_scale})`;
        } else if (col.numeric_precision) {
          typeStr += `(${col.numeric_precision})`;
        }

        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        
        logger.info(`   • ${col.column_name.padEnd(30)} ${typeStr.padEnd(20)} ${nullable}${defaultVal}`);
      }
    }

    // Get indexes
    logger.info('\n\n📊 INDEXES');
    logger.info('─'.repeat(80));
    
    const indexes = await sql`
      SELECT
        t.relname AS table_name,
        i.relname AS index_name,
        a.attname AS column_name,
        ix.indisunique AS is_unique,
        ix.indisprimary AS is_primary
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE t.relkind = 'r'
        AND t.relname NOT LIKE 'pg_%'
        AND t.relname NOT LIKE '_prisma%'
      ORDER BY t.relname, i.relname, a.attnum;
    ` as Array<{
      table_name: string;
      index_name: string;
      column_name: string;
      is_unique: boolean;
      is_primary: boolean;
    }>;

    const indexesByTable: Record<string, Array<{ name: string; columns: string[]; unique: boolean; primary: boolean }>> = {};

    for (const idx of indexes) {
      if (!indexesByTable[idx.table_name]) {
        indexesByTable[idx.table_name] = [];
      }

      let indexEntry = indexesByTable[idx.table_name].find(e => e.name === idx.index_name);
      if (!indexEntry) {
        indexEntry = {
          name: idx.index_name,
          columns: [],
          unique: idx.is_unique,
          primary: idx.is_primary,
        };
        indexesByTable[idx.table_name].push(indexEntry);
      }

      if (!indexEntry.columns.includes(idx.column_name)) {
        indexEntry.columns.push(idx.column_name);
      }
    }

    for (const [tableName, tableIndexes] of Object.entries(indexesByTable)) {
      logger.info(`\n📋 ${tableName}:`);
      for (const idx of tableIndexes) {
        const type = idx.primary ? 'PRIMARY KEY' : idx.unique ? 'UNIQUE' : 'INDEX';
        logger.info(`   • ${idx.name.padEnd(40)} ${type.padEnd(15)} ON (${idx.columns.join(', ')})`);
      }
    }

    // Get foreign keys
    logger.info('\n\n🔗 FOREIGN KEYS');
    logger.info('─'.repeat(80));

    const foreignKeys = await sql`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name;
    ` as Array<{
      table_name: string;
      column_name: string;
      foreign_table_name: string;
      foreign_column_name: string;
      delete_rule: string;
    }>;

    for (const fk of foreignKeys) {
      logger.info(`   • ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name} (ON DELETE ${fk.delete_rule})`);
    }

    // Generate markdown documentation
    logger.info('\n\n📝 Generating markdown documentation...');
    
    let markdown = `# Complete Database Schema\n\n`;
    markdown += `**Generated**: ${new Date().toISOString()}\n\n`;
    markdown += `**Total Tables**: ${tables.length}\n\n`;
    markdown += `---\n\n`;

    for (const [tableName, columns] of Object.entries(schema)) {
      markdown += `## Table: \`${tableName}\`\n\n`;
      markdown += `**Columns**: ${columns.length}\n\n`;
      markdown += `| Column Name | Data Type | Nullable | Default | Description |\n`;
      markdown += `|-------------|-----------|----------|---------|-------------|\n`;

      for (const col of columns) {
        let typeStr = col.data_type.toUpperCase();
        
        if (col.character_maximum_length) {
          typeStr += `(${col.character_maximum_length})`;
        } else if (col.numeric_precision && col.numeric_scale) {
          typeStr += `(${col.numeric_precision},${col.numeric_scale})`;
        } else if (col.numeric_precision) {
          typeStr += `(${col.numeric_precision})`;
        }

        const nullable = col.is_nullable === 'YES' ? 'YES' : 'NO';
        const defaultVal = col.column_default ? col.column_default : '-';
        
        markdown += `| \`${col.column_name}\` | ${typeStr} | ${nullable} | ${defaultVal} | |\n`;
      }

      // Add indexes for this table
      if (indexesByTable[tableName] && indexesByTable[tableName].length > 0) {
        markdown += `\n**Indexes**:\n\n`;
        for (const idx of indexesByTable[tableName]) {
          const type = idx.primary ? 'PRIMARY KEY' : idx.unique ? 'UNIQUE' : 'INDEX';
          markdown += `- \`${idx.name}\` (${type}) ON \`${idx.columns.join('`, `')}\`\n`;
        }
      }

      // Add foreign keys for this table
      const tableFKs = foreignKeys.filter(fk => fk.table_name === tableName);
      if (tableFKs.length > 0) {
        markdown += `\n**Foreign Keys**:\n\n`;
        for (const fk of tableFKs) {
          markdown += `- \`${fk.column_name}\` → \`${fk.foreign_table_name}.${fk.foreign_column_name}\` (ON DELETE ${fk.delete_rule})\n`;
        }
      }

      markdown += `\n---\n\n`;
    }

    // Write to file
    const outputPath = path.join(process.cwd(), 'sql', 'COMPLETE_SCHEMA.md');
    fs.writeFileSync(outputPath, markdown);
    logger.info(`✅ Schema documentation written to: ${outputPath}`);

    logger.info('\n============================================================');
    logger.info('SCHEMA EXTRACTION COMPLETE');
    logger.info('============================================================\n');

  } catch (error) {
    log.error('❌ Error getting schema:', error);
    throw error;
  }
}

getCompleteSchema().catch(console.error);
