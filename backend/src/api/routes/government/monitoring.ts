/**
 * Government Monitoring Routes
 * 
 * Purpose: Read-only monitoring endpoints for Government oversight
 * Location: backend/src/api/routes/government/monitoring.ts
 */

import { Router } from 'express';
import { sql } from '../../../database/connection';

const router: Router = Router();

// Get voucher statistics (aggregate)
router.get('/vouchers', async (req, res) => {
  try {
    const result = await sql`
      SELECT 
        COUNT(*)::bigint as total,
        COUNT(CASE WHEN status = 'distributed' THEN 1 END)::bigint as distributed,
        COUNT(CASE WHEN status = 'redeemed' THEN 1 END)::bigint as redeemed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::bigint as pending,
        COUNT(CASE WHEN status = 'failed' THEN 1 END)::bigint as failed,
        COALESCE(SUM(amount), 0) as total_amount
      FROM vouchers
      WHERE 1=1
    `;

    res.json({
      success: true,
      data: result[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error.message,
      },
    });
  }
});

// Single voucher by id (drill-down to smallest unit)
router.get('/vouchers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await sql`
      SELECT 
        v.id,
        v.voucher_code,
        v.beneficiary_id,
        v.beneficiary_name,
        v.amount,
        v.grant_type,
        v.status,
        v.issued_at,
        v.expiry_date,
        v.redeemed_at,
        v.redemption_method,
        v.region
      FROM vouchers v
      WHERE v.id = ${id}
      LIMIT 1
    `;
    const row = (result as any[])[0];
    if (!row) {
      return res.status(404).json({ success: false, error: 'Voucher not found' });
    }
    res.json({
      success: true,
      data: {
        id: row.id,
        voucher_code: row.voucher_code ?? null,
        beneficiary_id: row.beneficiary_id,
        beneficiary_name: row.beneficiary_name ?? null,
        amount: Number(row.amount ?? 0),
        grant_type: row.grant_type,
        status: row.status,
        issued_at: row.issued_at ?? null,
        expiry_date: row.expiry_date ?? null,
        redeemed_at: row.redeemed_at ?? null,
        redemption_method: row.redemption_method ?? null,
        region: row.region,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'QUERY_ERROR', message: error.message },
    });
  }
});

// Get beneficiary registry (read-only). Optional filters: region, grantType, status (e.g. deceased).
router.get('/beneficiaries', async (req, res) => {
  try {
    const { page = 1, limit = 20, region, grantType, status, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const result = await sql`
      SELECT * FROM beneficiaries
      WHERE 1=1
      ${region ? sql`AND region = ${region}` : sql``}
      ${grantType ? sql`AND grant_type = ${grantType}` : sql``}
      ${status ? sql`AND status = ${status}` : sql``}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'QUERY_ERROR', message: error.message },
    });
  }
});

// Vouchers for a single beneficiary (drill-down; define before /beneficiaries/:id)
router.get('/beneficiaries/:id/vouchers', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50', status: statusFilter } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const countResult = await sql`
      SELECT COUNT(*)::bigint as total FROM vouchers
      WHERE beneficiary_id = ${id}
      ${statusFilter ? sql`AND status = ${String(statusFilter)}` : sql``}
    `;
    const total = Number((countResult as any[])[0]?.total ?? 0);

    const rows = await sql`
      SELECT id, voucher_code, beneficiary_id, beneficiary_name, amount, grant_type, status,
        issued_at, expiry_date, redeemed_at, redemption_method, region
      FROM vouchers
      WHERE beneficiary_id = ${id}
      ${statusFilter ? sql`AND status = ${String(statusFilter)}` : sql``}
      ORDER BY issued_at DESC
      LIMIT ${Number(limit)} OFFSET ${offset}
    `;

    const data = (rows as any[]).map((row) => ({
      id: row.id,
      voucher_code: row.voucher_code ?? null,
      beneficiary_id: row.beneficiary_id,
      beneficiary_name: row.beneficiary_name ?? null,
      amount: Number(row.amount ?? 0),
      grant_type: row.grant_type,
      status: row.status,
      issued_at: row.issued_at ?? null,
      expiry_date: row.expiry_date ?? null,
      redeemed_at: row.redeemed_at ?? null,
      redemption_method: row.redemption_method ?? null,
      region: row.region,
    }));

    res.json({
      success: true,
      data: { vouchers: data, total, page: Number(page), limit: Number(limit) },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'QUERY_ERROR', message: error.message },
    });
  }
});

// Single beneficiary by id (drill-down to smallest unit)
router.get('/beneficiaries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await sql`
      SELECT id, name, phone, region, grant_type, status, enrolled_at, last_payment, created_at, updated_at,
        id_number, proxy_name, proxy_id_number, proxy_phone, proxy_relationship, proxy_authorised_at, deceased_at
      FROM beneficiaries
      WHERE id = ${id}
      LIMIT 1
    `;
    const row = (result as any[])[0];
    if (!row) {
      return res.status(404).json({ success: false, error: 'Beneficiary not found' });
    }
    res.json({ success: true, data: row });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'QUERY_ERROR', message: error.message },
    });
  }
});

// Get agent network status
router.get('/agents', async (req, res) => {
  try {
    const result = await sql`
      SELECT 
        id, name, location, region, status,
        liquidity_balance, success_rate
      FROM agents
      ORDER BY success_rate DESC
    `;
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'QUERY_ERROR', message: error.message },
    });
  }
});

// Country-level summary: totals + status breakdown
router.get('/regions/summary', async (req, res) => {
  try {
    const result = await sql`
      SELECT 
        COUNT(DISTINCT beneficiary_id)::bigint as total_beneficiaries,
        COUNT(*)::bigint as total_vouchers,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) FILTER (WHERE status = 'issued')::bigint as issued,
        COUNT(*) FILTER (WHERE status = 'delivered')::bigint as delivered,
        COUNT(*) FILTER (WHERE status = 'redeemed')::bigint as redeemed,
        COUNT(*) FILTER (WHERE status = 'expired')::bigint as expired,
        COUNT(*) FILTER (WHERE status = 'failed')::bigint as failed,
        COUNT(*) FILTER (WHERE status IN ('pending', 'issued'))::bigint as pending
      FROM vouchers
    `;
    const row = (result as any[])[0];
    const redemptionRate =
      (Number(row?.total_vouchers) || 0) > 0
        ? ((Number(row?.redeemed) || 0) / Number(row.total_vouchers)) * 100
        : 0;
    res.json({
      success: true,
      data: {
        ...row,
        redemption_rate: Math.round(redemptionRate * 10) / 10,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'QUERY_ERROR', message: error.message },
    });
  }
});

// Regional performance with status breakdown (issued, delivered, redeemed, expired, failed, pending)
router.get('/regions', async (req, res) => {
  try {
    const result = await sql`
      SELECT 
        region,
        COUNT(DISTINCT beneficiary_id)::bigint as total_beneficiaries,
        COUNT(*)::bigint as total_vouchers,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) FILTER (WHERE status = 'issued')::bigint as issued,
        COUNT(*) FILTER (WHERE status = 'delivered')::bigint as delivered,
        COUNT(*) FILTER (WHERE status = 'redeemed')::bigint as redeemed,
        COUNT(*) FILTER (WHERE status = 'expired')::bigint as expired,
        COUNT(*) FILTER (WHERE status = 'failed')::bigint as failed,
        COUNT(*) FILTER (WHERE status IN ('pending', 'issued'))::bigint as pending,
        (AVG(CASE WHEN status = 'redeemed' THEN 1.0 ELSE 0 END) * 100)::numeric(5,2) as redemption_rate
      FROM vouchers
      GROUP BY region
      ORDER BY total_vouchers DESC
    `;

    const data = (result as any[]).map((row) => ({
      region: row.region,
      total_beneficiaries: Number(row.total_beneficiaries ?? 0),
      total_vouchers: Number(row.total_vouchers ?? 0),
      total_amount: Number(row.total_amount ?? 0),
      issued: Number(row.issued ?? 0),
      delivered: Number(row.delivered ?? 0),
      redeemed: Number(row.redeemed ?? 0),
      expired: Number(row.expired ?? 0),
      failed: Number(row.failed ?? 0),
      pending: Number(row.pending ?? 0),
      redemption_rate: Number(row.redemption_rate ?? 0),
    }));

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'QUERY_ERROR', message: error.message },
    });
  }
});

// Vouchers in a region: for drill-down (id, status, time, location/redemption_method)
router.get('/regions/:region/vouchers', async (req, res) => {
  try {
    const { region } = req.params;
    const { status: statusFilter, page = '1', limit = '50' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const countResult = await sql`
      SELECT COUNT(*)::bigint as total
      FROM vouchers
      WHERE region = ${region}
      ${statusFilter ? sql`AND status = ${String(statusFilter)}` : sql``}
    `;
    const total = Number((countResult as any[])[0]?.total ?? 0);

    const rows = await sql`
      SELECT 
        id,
        voucher_code,
        beneficiary_id,
        beneficiary_name,
        status,
        amount,
        issued_at,
        redeemed_at,
        redemption_method,
        region,
        expiry_date
      FROM vouchers
      WHERE region = ${region}
      ${statusFilter ? sql`AND status = ${String(statusFilter)}` : sql``}
      ORDER BY COALESCE(redeemed_at, issued_at, created_at) DESC NULLS LAST
      LIMIT ${Number(limit)} OFFSET ${offset}
    `;

    const data = (rows as any[]).map((row) => ({
      id: row.id,
      voucher_code: row.voucher_code ?? null,
      beneficiary_id: row.beneficiary_id,
      beneficiary_name: row.beneficiary_name ?? null,
      status: row.status,
      amount: Number(row.amount ?? 0),
      issued_at: row.issued_at ?? null,
      redeemed_at: row.redeemed_at ?? null,
      redemption_method: row.redemption_method ?? null,
      region: row.region,
      expiry_date: row.expiry_date ?? null,
    }));

    res.json({
      success: true,
      data: { vouchers: data, total, page: Number(page), limit: Number(limit) },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'QUERY_ERROR', message: error.message },
    });
  }
});

export default router;
