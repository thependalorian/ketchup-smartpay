/**
 * Ketchup Admin API Routes
 *
 * Purpose: Admin UI endpoints for Ketchup Portal (moved from Buffr per PRD).
 * Location: backend/src/api/routes/ketchup/admin.ts
 *
 * Endpoints: SmartPay monitoring, audit logs, trust account, compliance (monthly stats, generate report).
 * Auth: ketchupAuth (X-API-Key).
 */

import { Router, Request, Response } from 'express';
import { TrustAccountService } from '../../../services/compliance/TrustAccountService';
import { BankOfNamibiaReportingService } from '../../../services/compliance/BankOfNamibiaReportingService';
import { sql } from '../../../database/connection';
import { logError } from '../../../utils/logger';

const router: Router = Router();

// ============================================================================
// SmartPay Monitoring
// ============================================================================

/** GET /smartpay/health - Backend health (Ketchup Portal admin) */
router.get('/smartpay/health', async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        service: 'ketchup-backend',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logError('SmartPay health error', error);
    res.status(500).json({ success: false, error: error?.message ?? 'Health check failed' });
  }
});

/** GET /smartpay/sync-logs - Sync logs from webhook_events (distribution/webhook activity) */
router.get('/smartpay/sync-logs', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const rows = await sql`
      SELECT id, event_type, voucher_id, status, delivery_attempts, last_attempt_at, delivered_at, created_at, idempotency_key
      FROM webhook_events
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    const items = rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      event_type: r.event_type,
      voucher_id: r.voucher_id,
      status: r.status,
      delivery_attempts: r.delivery_attempts,
      last_attempt_at: r.last_attempt_at,
      delivered_at: r.delivered_at,
      created_at: r.created_at,
      idempotency_key: r.idempotency_key ?? null,
    }));
    res.json({ success: true, data: { items, count: items.length } });
  } catch (error: any) {
    logError('Sync logs error', error);
    res.status(500).json({ success: false, error: error?.message ?? 'Failed to get sync logs' });
  }
});

// ============================================================================
// Audit Logs
// ============================================================================

/** GET /audit-logs/query - Query audit/idempotency (idempotency_keys table) */
router.get('/audit-logs/query', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const endpointPrefix = (req.query.endpoint_prefix as string) || undefined;
    let result: unknown[] = [];
    try {
      result = endpointPrefix
        ? await sql`SELECT idempotency_key, endpoint_prefix, response_status, created_at FROM idempotency_keys WHERE endpoint_prefix = ${endpointPrefix} ORDER BY created_at DESC LIMIT ${limit}`
        : await sql`SELECT idempotency_key, endpoint_prefix, response_status, created_at FROM idempotency_keys ORDER BY created_at DESC LIMIT ${limit}`;
    } catch {
      result = [];
    }
    res.json({ success: true, data: { items: result, count: result.length } });
  } catch (error: any) {
    logError('Audit logs query error', error);
    res.status(500).json({ success: false, error: error?.message ?? 'Query failed' });
  }
});

/** GET /audit-logs/export - Export audit from idempotency_keys (database) */
router.get('/audit-logs/export', async (_req: Request, res: Response) => {
  try {
    const limit = 5000;
    const rows = await sql`
      SELECT idempotency_key, endpoint_prefix, response_status, created_at, expires_at
      FROM idempotency_keys
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    const data = rows.map((r: Record<string, unknown>) => ({
      idempotency_key: r.idempotency_key,
      endpoint_prefix: r.endpoint_prefix,
      response_status: r.response_status,
      created_at: r.created_at,
      expires_at: r.expires_at,
    }));
    const exportedAt = new Date().toISOString();
    res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.json"');
    res.json({ success: true, data: { data, exportedAt, count: data.length } });
  } catch (error: any) {
    logError('Audit logs export error', error);
    res.status(500).json({ success: false, error: error?.message ?? 'Export failed' });
  }
});

/** POST /audit-logs/retention - Retention config (audit_retention_config table); prune old idempotency_keys */
router.post('/audit-logs/retention', async (req: Request, res: Response) => {
  try {
    const retention_days = Math.max(1, Math.min(365 * 5, parseInt(String((req.body ?? {}).retention_days), 10) || 90));
    await sql`
      INSERT INTO audit_retention_config (key, value, updated_at)
      VALUES ('audit_retention_days', ${String(retention_days)}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `;
    const deleted = await sql`
      DELETE FROM idempotency_keys
      WHERE created_at < NOW() - ${retention_days} * INTERVAL '1 day'
      RETURNING idempotency_key
    `;
    const deletedCount = Array.isArray(deleted) ? deleted.length : 0;
    res.json({
      success: true,
      data: {
        retention_days,
        message: `Retention policy set to ${retention_days} days. Pruned ${deletedCount} expired idempotency record(s).`,
      },
    });
  } catch (error: any) {
    logError('Audit logs retention error', error);
    res.status(500).json({ success: false, error: error?.message ?? 'Retention update failed' });
  }
});

// ============================================================================
// Trust Account
// ============================================================================

/** GET /trust-account/status */
router.get('/trust-account/status', async (_req: Request, res: Response) => {
  try {
    const status = await TrustAccountService.checkComplianceStatus();
    res.json({
      success: true,
      data: {
        ...status,
        status: status.isCompliant ? 'compliant' : 'deficient',
        coverage_ratio: status.coveragePercentage / 100,
      },
    });
  } catch (error: any) {
    logError('Trust account status error', error);
    res.status(500).json({ success: false, error: error?.message ?? 'Failed to get trust account status' });
  }
});

/** POST /trust-account/reconcile */
router.post('/trust-account/reconcile', async (req: Request, res: Response) => {
  try {
    const reconciledBy = (req.body?.reconciledBy as string) || 'Ketchup Portal';
    const result = await TrustAccountService.performDailyReconciliation(reconciledBy);
    res.json({
      success: true,
      data: result,
      message: result.status === 'compliant'
        ? 'Trust account reconciliation successful.'
        : `Deficiency: N$${result.deficiencyAmount ?? 0}. Resolve within 1 business day.`,
    });
  } catch (error: any) {
    logError('Trust account reconcile error', error);
    res.status(500).json({ success: false, error: error?.message ?? 'Reconciliation failed' });
  }
});

// ============================================================================
// Compliance (monthly stats, generate report)
// ============================================================================

/** GET /compliance/monthly-stats */
router.get('/compliance/monthly-stats', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const reportMonth = new Date(year, month - 1, 1);
    const report = await BankOfNamibiaReportingService.generateMonthlyReport(reportMonth);
    res.json({ success: true, data: report });
  } catch (error: any) {
    logError('Compliance monthly-stats error', error);
    res.status(500).json({ success: false, error: error?.message ?? 'Failed to get monthly stats' });
  }
});

/** POST /compliance/generate-report */
router.post('/compliance/generate-report', async (req: Request, res: Response) => {
  try {
    const { year, month } = req.body ?? {};
    const y = year ?? new Date().getFullYear();
    const m = month ?? new Date().getMonth() + 1;
    const reportMonth = new Date(y, m - 1, 1);
    const report = await BankOfNamibiaReportingService.generateMonthlyReport(reportMonth);
    res.json({ success: true, data: report, message: 'Report generated.' });
  } catch (error: any) {
    logError('Compliance generate-report error', error);
    res.status(500).json({ success: false, error: error?.message ?? 'Report generation failed' });
  }
});

export default router;
