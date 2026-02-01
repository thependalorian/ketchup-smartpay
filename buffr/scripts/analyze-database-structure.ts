/**
 * Database Structure Analysis Script
 * 
 * Analyzes the current database structure and compares it with expected schema
 * to identify missing tables, columns, indexes, and constraints.
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

interface TableInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface IndexInfo {
  indexname: string;
  tablename: string;
  indexdef: string;
}

interface ConstraintInfo {
  constraint_name: string;
  table_name: string;
  constraint_type: string;
}

async function getAllTables(): Promise<string[]> {
  const result = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;
  return result.map((r: any) => r.table_name);
}

async function getTableColumns(tableName: string): Promise<TableInfo[]> {
  const result = await sql`
    SELECT 
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = ${tableName}
    ORDER BY ordinal_position;
  `;
  return result as TableInfo[];
}

async function getTableIndexes(tableName: string): Promise<IndexInfo[]> {
  const result = await sql`
    SELECT 
      indexname,
      tablename,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' 
      AND tablename = ${tableName}
    ORDER BY indexname;
  `;
  return result as IndexInfo[];
}

async function getTableConstraints(tableName: string): Promise<ConstraintInfo[]> {
  const result = await sql`
    SELECT 
      tc.constraint_name,
      tc.table_name,
      tc.constraint_type
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public' 
      AND tc.table_name = ${tableName}
    ORDER BY tc.constraint_type, tc.constraint_name;
  `;
  return result as ConstraintInfo[];
}

async function getTableRowCount(tableName: string): Promise<number> {
  try {
    const result = await sql`SELECT COUNT(*) as count FROM ${sql(tableName)}`;
    return parseInt((result[0] as any).count || '0');
  } catch (e) {
    return 0;
  }
}

async function analyzeDatabase() {
  console.log('🔍 Analyzing Database Structure...\n');
  console.log(`📊 Database: ${DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown'}\n`);

  // Get all tables
  const tables = await getAllTables();
  console.log(`📋 Found ${tables.length} tables in database\n`);

  // Analyze each table
  const analysis: any[] = [];

  for (const table of tables) {
    const columns = await getTableColumns(table);
    const indexes = await getTableIndexes(table);
    const constraints = await getTableConstraints(table);
    const rowCount = await getTableRowCount(table);

    analysis.push({
      table,
      columns: columns.length,
      indexes: indexes.length,
      constraints: constraints.length,
      rowCount,
      columnDetails: columns,
      indexDetails: indexes,
      constraintDetails: constraints,
    });

    console.log(`✅ ${table}`);
    console.log(`   Columns: ${columns.length} | Indexes: ${indexes.length} | Constraints: ${constraints.length} | Rows: ${rowCount}`);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 DATABASE SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tables: ${tables.length}`);
  console.log(`Total Columns: ${analysis.reduce((sum, t) => sum + t.columns, 0)}`);
  console.log(`Total Indexes: ${analysis.reduce((sum, t) => sum + t.indexes, 0)}`);
  console.log(`Total Constraints: ${analysis.reduce((sum, t) => sum + t.constraints, 0)}`);
  console.log(`Total Rows: ${analysis.reduce((sum, t) => sum + t.rowCount, 0)}`);

  // Check for critical tables
  console.log('\n' + '='.repeat(80));
  console.log('🔍 CRITICAL TABLES CHECK');
  console.log('='.repeat(80));

  const criticalTables = [
    'users',
    'wallets',
    'transactions',
    'vouchers',
    'conversations',
    'exchange_rates',
    'exchange_rate_fetch_log',
    'audit_logs',
    'fineract_sync_logs',
    'split_bills',
    'transaction_analytics',
  ];

  const missingTables: string[] = [];
  const existingTables: string[] = [];

  for (const critical of criticalTables) {
    if (tables.includes(critical)) {
      existingTables.push(critical);
      console.log(`✅ ${critical}`);
    } else {
      missingTables.push(critical);
      console.log(`❌ ${critical} - MISSING`);
    }
  }

  if (missingTables.length > 0) {
    console.log('\n⚠️  Missing Critical Tables:');
    missingTables.forEach(t => console.log(`   - ${t}`));
  }

  // Detailed table information
  console.log('\n' + '='.repeat(80));
  console.log('📋 DETAILED TABLE INFORMATION');
  console.log('='.repeat(80));

  for (const tableInfo of analysis.slice(0, 20)) { // Show first 20 tables
    console.log(`\n📊 ${tableInfo.table.toUpperCase()}`);
    console.log(`   Rows: ${tableInfo.rowCount}`);
    console.log(`   Columns (${tableInfo.columns}):`);
    tableInfo.columnDetails.forEach((col: TableInfo) => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`     - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
    });
    
    if (tableInfo.indexes > 0) {
      console.log(`   Indexes (${tableInfo.indexes}):`);
      tableInfo.indexDetails.forEach((idx: IndexInfo) => {
        console.log(`     - ${idx.indexname}`);
      });
    }
  }

  if (analysis.length > 20) {
    console.log(`\n... and ${analysis.length - 20} more tables`);
  }

  // Save detailed report
  const reportPath = join(process.cwd(), 'database_structure_report.json');
  const report = {
    timestamp: new Date().toISOString(),
    database: DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown',
    summary: {
      totalTables: tables.length,
      totalColumns: analysis.reduce((sum, t) => sum + t.columns, 0),
      totalIndexes: analysis.reduce((sum, t) => sum + t.indexes, 0),
      totalConstraints: analysis.reduce((sum, t) => sum + t.constraints, 0),
      totalRows: analysis.reduce((sum, t) => sum + t.rowCount, 0),
    },
    criticalTables: {
      existing: existingTables,
      missing: missingTables,
    },
    tables: analysis.map(t => ({
      table: t.table,
      columns: t.columns,
      indexes: t.indexes,
      constraints: t.constraints,
      rowCount: t.rowCount,
      columnNames: t.columnDetails.map((c: TableInfo) => c.column_name),
    })),
  };

  require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Detailed report saved to: ${reportPath}`);

  return { analysis, missingTables, existingTables };
}

// Run analysis
analyzeDatabase()
  .then(() => {
    console.log('\n✅ Database analysis complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error analyzing database:', error);
    process.exit(1);
  });
