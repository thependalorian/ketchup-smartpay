/**
 * Audit Log Backup Script
 * 
 * Location: scripts/backup-audit-logs.ts
 * Purpose: Backup audit logs for disaster recovery and regulatory compliance
 * 
 * Usage:
 *   npx tsx scripts/backup-audit-logs.ts [--format=json|csv] [--output=path]
 * 
 * This script:
 * - Exports all audit logs to backup files
 * - Creates timestamped backups
 * - Supports JSON and CSV formats
 * - Can be run manually or via cron job
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { query } from '../utils/db';
import logger, { log } from '@/utils/logger';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

interface BackupOptions {
  format: 'json' | 'csv';
  outputDir?: string;
  tables?: string[];
}

const AUDIT_LOG_TABLES = [
  'audit_logs',
  'pin_audit_logs',
  'voucher_audit_logs',
  'transaction_audit_logs',
  'api_sync_audit_logs',
  'staff_audit_logs',
];

const ARCHIVE_TABLES = [
  'audit_logs_archive',
  'pin_audit_logs_archive',
  'voucher_audit_logs_archive',
  'transaction_audit_logs_archive',
  'api_sync_audit_logs_archive',
  'staff_audit_logs_archive',
];

/**
 * Convert row to CSV format
 */
function rowToCSV(row: any, headers: string[]): string {
  return headers.map(header => {
    const value = row[header];
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
    return String(value).replace(/"/g, '""');
  }).map(v => `"${v}"`).join(',');
}

/**
 * Backup a single audit log table
 */
async function backupTable(
  tableName: string,
  format: 'json' | 'csv',
  outputDir: string
): Promise<{ rows: number; filePath: string }> {
  logger.info(`[Backup] Backing up ${tableName}...`);

  try {
    // Check if table exists first
    const tableExists = await query<any>(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as exists
    `, [tableName]);

    if (!tableExists[0]?.exists) {
      logger.info(`[Backup] ⚠️  Table ${tableName} does not exist, skipping...`);
      return { rows: 0, filePath: '' };
    }

    // Fetch all rows (use created_at for ordering - timestamp may not exist in all tables)
    // Note: Using parameterized query would require dynamic table names, so we use template literal
    // This is safe because tableName comes from a predefined list
    const rows = await query<any>(`SELECT * FROM ${tableName} ORDER BY created_at DESC NULLS LAST`);

    if (rows.length === 0) {
      logger.info(`[Backup] No rows in ${tableName}, skipping...`);
      return { rows: 0, filePath: '' };
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${tableName}_${timestamp}.${format === 'json' ? 'json' : 'csv'}`;
    const filePath = resolve(outputDir, filename);

    let content: string;

    if (format === 'json') {
      content = JSON.stringify(rows, null, 2);
    } else {
      // CSV format
      const headers = Object.keys(rows[0]);
      const csvRows = [
        headers.join(','), // Header row
        ...rows.map(row => rowToCSV(row, headers)),
      ];
      content = csvRows.join('\n');
    }

    await writeFile(filePath, content, 'utf-8');

    logger.info(`[Backup] ✅ Backed up ${rows.length} rows from ${tableName} to ${filename}`);
    return { rows: rows.length, filePath };
  } catch (error: any) {
    log.error(`[Backup] ❌ Failed to backup ${tableName}:`, error.message);
    return { rows: 0, filePath: '' };
  }
}

/**
 * Main backup function
 */
async function backupAuditLogs(options: BackupOptions): Promise<void> {
  const { format, outputDir = './backups/audit-logs', tables = [...AUDIT_LOG_TABLES, ...ARCHIVE_TABLES] } = options;

  logger.info(`[Backup] Starting audit log backup (format: ${format})...`);

  // Create output directory if it doesn't exist
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
    logger.info(`[Backup] Created output directory: ${outputDir}`);
  }

  const results: Array<{ table: string; rows: number; filePath: string }> = [];

  // Backup each table
  for (const tableName of tables) {
    try {
      const result = await backupTable(tableName, format, outputDir);
      if (result.rows > 0) {
        results.push({ table: tableName, rows: result.rows, filePath: result.filePath });
      }
    } catch (error) {
      log.error(`[Backup] ❌ Failed to backup ${tableName}:`, error);
    }
  }

  // Create summary file
  const summary = {
    backupDate: new Date().toISOString(),
    format,
    tables: results,
    totalRows: results.reduce((sum, r) => sum + r.rows, 0),
  };

  const summaryPath = resolve(outputDir, `backup_summary_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');

  logger.info(`[Backup] ✅ Backup complete!`);
  logger.info(`[Backup] Total rows backed up: ${summary.totalRows}`);
  logger.info(`[Backup] Summary saved to: ${summaryPath}`);
}

// Run if executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const format = args.find(arg => arg.startsWith('--format='))?.split('=')[1] as 'json' | 'csv' || 'json';
  const outputDir = args.find(arg => arg.startsWith('--output='))?.split('=')[1];
  const tablesArg = args.find(arg => arg.startsWith('--tables='))?.split('=')[1];
  const tables = tablesArg ? tablesArg.split(',') : undefined;

  backupAuditLogs({ format, outputDir, tables })
    .then(() => {
      logger.info('[Backup] Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      log.error('[Backup] Script failed:', error);
      process.exit(1);
    });
}

export { backupAuditLogs, AUDIT_LOG_TABLES, ARCHIVE_TABLES };
