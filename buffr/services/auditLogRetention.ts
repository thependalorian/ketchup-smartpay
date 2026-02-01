/**
 * Audit Log Retention Management Service
 * 
 * Location: services/auditLogRetention.ts
 * Purpose: Implement 5-year retention policies for audit logs (Regulatory Requirement)
 * 
 * PSD-12 & Payment System Management Act Requirements:
 * - Minimum 5-year retention for all audit logs
 * - Secure archival of logs older than retention period
 * - Automated cleanup of logs beyond retention period
 * - Backup procedures for archived logs
 */

import { query } from '../utils/db';
import { logAuditEvent } from '../utils/auditLogger';
import logger, { log } from '@/utils/logger';

/**
 * Retention period in years (regulatory requirement: 5 years minimum)
 */
const RETENTION_YEARS = 5;

/**
 * Get the cutoff date for logs to retain
 * Logs older than this date can be archived/deleted
 */
function getRetentionCutoffDate(): Date {
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - RETENTION_YEARS);
  return cutoffDate;
}

/**
 * Archive audit logs older than retention period
 * Moves logs to archive table instead of deleting (for compliance)
 */
export async function archiveOldAuditLogs(): Promise<{
  archived: number;
  errors: string[];
}> {
  const cutoffDate = getRetentionCutoffDate();
  const errors: string[] = [];
  let totalArchived = 0;

  try {
    // Archive main audit_logs (use created_at as primary column)
    const auditLogsResult = await query<{ count: number }>(
      `INSERT INTO audit_logs_archive 
       SELECT * FROM audit_logs 
       WHERE created_at < $1
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [cutoffDate]
    );
    const auditLogsArchived = auditLogsResult.length;

    // Delete archived logs from main table
    await query(
      `DELETE FROM audit_logs 
       WHERE created_at < $1 
       AND id IN (SELECT id FROM audit_logs_archive WHERE created_at < $1)`,
      [cutoffDate]
    );

    totalArchived += auditLogsArchived;

    // Archive PIN audit logs (use created_at as primary column)
    const pinLogsResult = await query<{ count: number }>(
      `INSERT INTO pin_audit_logs_archive 
       SELECT * FROM pin_audit_logs 
       WHERE created_at < $1
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [cutoffDate]
    );
    const pinLogsArchived = pinLogsResult.length;

    await query(
      `DELETE FROM pin_audit_logs 
       WHERE created_at < $1 
       AND id IN (SELECT id FROM pin_audit_logs_archive WHERE created_at < $1)`,
      [cutoffDate]
    );

    totalArchived += pinLogsArchived;

    // Archive voucher audit logs (use created_at as primary column)
    const voucherLogsResult = await query<{ count: number }>(
      `INSERT INTO voucher_audit_logs_archive 
       SELECT * FROM voucher_audit_logs 
       WHERE created_at < $1
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [cutoffDate]
    );
    const voucherLogsArchived = voucherLogsResult.length;

    await query(
      `DELETE FROM voucher_audit_logs 
       WHERE created_at < $1 
       AND id IN (SELECT id FROM voucher_audit_logs_archive WHERE created_at < $1)`,
      [cutoffDate]
    );

    totalArchived += voucherLogsArchived;

    // Archive transaction audit logs (use created_at as primary column)
    const transactionLogsResult = await query<{ count: number }>(
      `INSERT INTO transaction_audit_logs_archive 
       SELECT * FROM transaction_audit_logs 
       WHERE created_at < $1
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [cutoffDate]
    );
    const transactionLogsArchived = transactionLogsResult.length;

    await query(
      `DELETE FROM transaction_audit_logs 
       WHERE created_at < $1 
       AND id IN (SELECT id FROM transaction_audit_logs_archive WHERE created_at < $1)`,
      [cutoffDate]
    );

    totalArchived += transactionLogsArchived;

    // Archive API sync audit logs (use created_at as primary column)
    const apiSyncLogsResult = await query<{ count: number }>(
      `INSERT INTO api_sync_audit_logs_archive 
       SELECT * FROM api_sync_audit_logs 
       WHERE created_at < $1
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [cutoffDate]
    );
    const apiSyncLogsArchived = apiSyncLogsResult.length;

    await query(
      `DELETE FROM api_sync_audit_logs 
       WHERE created_at < $1 
       AND id IN (SELECT id FROM api_sync_audit_logs_archive WHERE created_at < $1)`,
      [cutoffDate]
    );

    totalArchived += apiSyncLogsArchived;

    // Archive staff audit logs (use created_at as primary column)
    const staffLogsResult = await query<{ count: number }>(
      `INSERT INTO staff_audit_logs_archive 
       SELECT * FROM staff_audit_logs 
       WHERE created_at < $1
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [cutoffDate]
    );
    const staffLogsArchived = staffLogsResult.length;

    await query(
      `DELETE FROM staff_audit_logs 
       WHERE created_at < $1 
       AND id IN (SELECT id FROM staff_audit_logs_archive WHERE created_at < $1)`,
      [cutoffDate]
    );

    totalArchived += staffLogsArchived;

    // Log the archival operation
    await logAuditEvent({
      event_type: 'audit_log_archival',
      entity_type: 'audit_log',
      entity_id: 'system',
      user_id: null,
      action: 'archive',
      metadata: {
        cutoffDate: cutoffDate.toISOString(),
        totalArchived,
        retentionYears: RETENTION_YEARS,
      },
      ip_address: 'system',
      user_agent: 'audit-retention-service',
      request_id: `retention-${Date.now()}`,
      response_status: 200,
    }).catch(err => {
      errors.push(`Failed to log archival operation: ${err.message}`);
    });

    logger.info(`[Audit Retention] Archived ${totalArchived} audit log entries older than ${RETENTION_YEARS} years`);

    return { archived: totalArchived, errors };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Archival failed: ${errorMessage}`);
    log.error('[Audit Retention] Error archiving audit logs:', error);
    return { archived: totalArchived, errors };
  }
}

/**
 * Get statistics about audit log retention
 */
export async function getRetentionStats(): Promise<{
  totalLogs: number;
  logsInRetention: number;
  logsToArchive: number;
  oldestLogDate: string | null;
  cutoffDate: string;
}> {
  const cutoffDate = getRetentionCutoffDate();

  try {
    // Count total logs across all audit log tables
    const totalResult = await query<{ count: number }>(
      `SELECT 
        (SELECT COUNT(*) FROM audit_logs) +
        (SELECT COUNT(*) FROM pin_audit_logs) +
        (SELECT COUNT(*) FROM voucher_audit_logs) +
        (SELECT COUNT(*) FROM transaction_audit_logs) +
        (SELECT COUNT(*) FROM api_sync_audit_logs) +
        (SELECT COUNT(*) FROM staff_audit_logs) as count`
    );
    const totalLogs = parseInt(totalResult[0]?.count?.toString() || '0');

    // Count logs within retention period (use created_at as primary, timestamp as fallback)
    const inRetentionResult = await query<{ count: number }>(
      `SELECT 
        (SELECT COUNT(*) FROM audit_logs WHERE created_at >= $1) +
        (SELECT COUNT(*) FROM pin_audit_logs WHERE created_at >= $1) +
        (SELECT COUNT(*) FROM voucher_audit_logs WHERE created_at >= $1) +
        (SELECT COUNT(*) FROM transaction_audit_logs WHERE created_at >= $1) +
        (SELECT COUNT(*) FROM api_sync_audit_logs WHERE created_at >= $1) +
        (SELECT COUNT(*) FROM staff_audit_logs WHERE created_at >= $1) as count`,
      [cutoffDate]
    );
    const logsInRetention = parseInt(inRetentionResult[0]?.count?.toString() || '0');

    // Get oldest log date (use created_at as primary column)
    const oldestResult = await query<{ oldest: Date }>(
      `SELECT MIN(oldest_date) as oldest FROM (
        SELECT created_at as oldest_date FROM audit_logs
        UNION ALL
        SELECT created_at as oldest_date FROM pin_audit_logs
        UNION ALL
        SELECT created_at as oldest_date FROM voucher_audit_logs
        UNION ALL
        SELECT created_at as oldest_date FROM transaction_audit_logs
        UNION ALL
        SELECT created_at as oldest_date FROM api_sync_audit_logs
        UNION ALL
        SELECT created_at as oldest_date FROM staff_audit_logs
      ) as all_logs`
    );
    const oldestLogDate = oldestResult[0]?.oldest?.toISOString() || null;

    return {
      totalLogs,
      logsInRetention,
      logsToArchive: totalLogs - logsInRetention,
      oldestLogDate,
      cutoffDate: cutoffDate.toISOString(),
    };
  } catch (error) {
    log.error('[Audit Retention] Error getting retention stats:', error);
    return {
      totalLogs: 0,
      logsInRetention: 0,
      logsToArchive: 0,
      oldestLogDate: null,
      cutoffDate: cutoffDate.toISOString(),
    };
  }
}
