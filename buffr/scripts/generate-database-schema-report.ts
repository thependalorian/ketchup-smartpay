/**
 * Generate Comprehensive Database Schema Report
 * 
 * Creates a detailed report of all database tables, columns, indexes, and relationships
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFile } from 'fs/promises';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

interface TableInfo {
  table_name: string;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  foreignKeys: ForeignKeyInfo[];
  rowCount: number;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  ordinal_position: number;
}

interface IndexInfo {
  indexname: string;
  indexdef: string;
}

interface ForeignKeyInfo {
  constraint_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
}

async function getTableInfo(tableName: string): Promise<TableInfo> {
  // Get columns
  const columns = await sql`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default,
      ordinal_position
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = ${tableName}
    ORDER BY ordinal_position
  ` as ColumnInfo[];

  // Get indexes
  const indexes = await sql`
    SELECT 
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = ${tableName}
    ORDER BY indexname
  ` as IndexInfo[];

  // Get foreign keys
  const foreignKeys = await sql`
    SELECT
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = ${tableName}
    AND tc.table_schema = 'public'
  ` as ForeignKeyInfo[];

  // Get row count
  let rowCount = 0;
  try {
    const countResult = await sql.unsafe(`SELECT COUNT(*) as count FROM ${tableName}`);
    rowCount = parseInt(countResult[0]?.count || '0');
  } catch (error) {
    rowCount = 0;
  }

  return {
    table_name: tableName,
    columns: columns as ColumnInfo[],
    indexes: indexes as IndexInfo[],
    foreignKeys: foreignKeys as ForeignKeyInfo[],
    rowCount,
  };
}

async function generateReport() {
  console.log('📊 Generating Database Schema Report...\n');

  const ecosystemTables = [
    'nampost_branches',
    'nampost_staff',
    'nampost_branch_load',
    'recommendations',
    'recommendation_effectiveness',
    'concentration_alerts',
    'liquidity_recommendations',
    'leaderboard_rankings',
    'leaderboard_incentives',
    'bottleneck_metrics',
    'merchant_onboarding',
    'agent_onboarding',
    'onboarding_documents',
    'beneficiary_clusters',
    'agent_clusters',
    'demand_hotspots',
    'coverage_gaps',
  ];

  const report: { [key: string]: TableInfo } = {};

  for (const tableName of ecosystemTables) {
    try {
      const tableInfo = await getTableInfo(tableName);
      report[tableName] = tableInfo;
      console.log(`✅ ${tableName} (${tableInfo.columns.length} cols, ${tableInfo.indexes.length} idx, ${tableInfo.foreignKeys.length} FK)`);
    } catch (error: any) {
      console.log(`❌ ${tableName} - ${error.message.substring(0, 50)}`);
    }
  }

  // Generate markdown report
  let markdown = `# Database Schema Report - Ecosystem Tables
**Generated:** ${new Date().toISOString()}
**Total Tables:** ${ecosystemTables.length}

---

`;

  for (const [tableName, tableInfo] of Object.entries(report)) {
    markdown += `## ${tableName}\n\n`;
    markdown += `**Rows:** ${tableInfo.rowCount} | **Columns:** ${tableInfo.columns.length} | **Indexes:** ${tableInfo.indexes.length} | **Foreign Keys:** ${tableInfo.foreignKeys.length}\n\n`;

    // Columns
    markdown += `### Columns\n\n`;
    markdown += `| Column | Type | Nullable | Default |\n`;
    markdown += `|--------|------|----------|----------|\n`;
    for (const col of tableInfo.columns) {
      markdown += `| \`${col.column_name}\` | ${col.data_type} | ${col.is_nullable} | ${col.column_default || 'NULL'} |\n`;
    }
    markdown += `\n`;

    // Indexes
    if (tableInfo.indexes.length > 0) {
      markdown += `### Indexes\n\n`;
      for (const idx of tableInfo.indexes) {
        markdown += `- \`${idx.indexname}\`: ${idx.indexdef}\n`;
      }
      markdown += `\n`;
    }

    // Foreign Keys
    if (tableInfo.foreignKeys.length > 0) {
      markdown += `### Foreign Keys\n\n`;
      for (const fk of tableInfo.foreignKeys) {
        markdown += `- \`${fk.column_name}\` → \`${fk.foreign_table_name}.${fk.foreign_column_name}\`\n`;
      }
      markdown += `\n`;
    }

    markdown += `---\n\n`;
  }

  // Summary
  markdown += `## Summary\n\n`;
  markdown += `| Metric | Count |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Total Tables | ${Object.keys(report).length} |\n`;
  markdown += `| Total Columns | ${Object.values(report).reduce((sum, t) => sum + t.columns.length, 0)} |\n`;
  markdown += `| Total Indexes | ${Object.values(report).reduce((sum, t) => sum + t.indexes.length, 0)} |\n`;
  markdown += `| Total Foreign Keys | ${Object.values(report).reduce((sum, t) => sum + t.foreignKeys.length, 0)} |\n`;
  markdown += `| Total Rows | ${Object.values(report).reduce((sum, t) => sum + t.rowCount, 0)} |\n`;

  // Write report
  const reportPath = resolve(process.cwd(), 'docs/DATABASE_SCHEMA_REPORT.md');
  await writeFile(reportPath, markdown);
  console.log(`\n✅ Report generated: ${reportPath}`);

  return report;
}

async function main() {
  try {
    const report = await generateReport();
    console.log('\n🎉 Database schema report generated successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
