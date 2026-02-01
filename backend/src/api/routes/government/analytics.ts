/**
 * Government Analytics Routes
 * 
 * Purpose: Financial analytics endpoints for Government
 * Location: backend/src/api/routes/government/analytics.ts
 */

import { Router } from 'express';
import { sql } from '../../../database/connection';

const router = Router();

// Get financial summary
router.get('/financial', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const hasStart = typeof startDate === 'string' && startDate.trim() !== '';
    const hasEnd = typeof endDate === 'string' && endDate.trim() !== '';

    let result;
    if (hasStart && hasEnd) {
      result = await sql`
        SELECT 
          SUM(amount) as total_disbursed,
          COUNT(*) as total_transactions,
          AVG(amount) as avg_transaction_amount,
          COUNT(DISTINCT beneficiary_id) as unique_beneficiaries
        FROM vouchers
        WHERE status = 'redeemed'
          AND redeemed_at >= ${startDate}::timestamptz
          AND redeemed_at <= ${endDate}::timestamptz
      `;
    } else if (hasStart) {
      result = await sql`
        SELECT 
          SUM(amount) as total_disbursed,
          COUNT(*) as total_transactions,
          AVG(amount) as avg_transaction_amount,
          COUNT(DISTINCT beneficiary_id) as unique_beneficiaries
        FROM vouchers
        WHERE status = 'redeemed'
          AND redeemed_at >= ${startDate}::timestamptz
      `;
    } else if (hasEnd) {
      result = await sql`
        SELECT 
          SUM(amount) as total_disbursed,
          COUNT(*) as total_transactions,
          AVG(amount) as avg_transaction_amount,
          COUNT(DISTINCT beneficiary_id) as unique_beneficiaries
        FROM vouchers
        WHERE status = 'redeemed'
          AND redeemed_at <= ${endDate}::timestamptz
      `;
    } else {
      result = await sql`
        SELECT 
          SUM(amount) as total_disbursed,
          COUNT(*) as total_transactions,
          AVG(amount) as avg_transaction_amount,
          COUNT(DISTINCT beneficiary_id) as unique_beneficiaries
        FROM vouchers
        WHERE status = 'redeemed'
      `;
    }

    res.json({ success: true, data: result[0] });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'QUERY_ERROR', message: error.message },
    });
  }
});

// Get spend trend (monthly)
router.get('/spend-trend', async (req, res) => {
  try {
    const result = await sql`
      SELECT 
        DATE_TRUNC('month', redeemed_at) as month,
        SUM(amount) as total_spend,
        COUNT(*) as total_transactions
      FROM vouchers
      WHERE status = 'redeemed'
        AND redeemed_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', redeemed_at)
      ORDER BY month ASC
    `;
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'QUERY_ERROR', message: error.message },
    });
  }
});

// Get grant type breakdown
router.get('/grant-types', async (req, res) => {
  try {
    const result = await sql`
      SELECT 
        b.grant_type,
        COUNT(*) as total_vouchers,
        SUM(v.amount) as total_amount,
        COUNT(DISTINCT v.beneficiary_id) as unique_beneficiaries
      FROM vouchers v
      JOIN beneficiaries b ON v.beneficiary_id = b.id
      WHERE v.status = 'redeemed'
      GROUP BY b.grant_type
      ORDER BY total_amount DESC
    `;

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'QUERY_ERROR', message: error.message },
    });
  }
});

/**
 * Drill-down: paginated list of individual redeemed vouchers (smallest data point).
 * Query: page, limit, region, grantType, startDate, endDate, month (YYYY-MM).
 */
router.get('/transactions', async (req, res) => {
  try {
    const { page = '1', limit = '50', region, grantType, startDate, endDate, month } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Neon serverless driver has no sql.join; build WHERE with conditional fragments
    const countResult = await sql`
      SELECT COUNT(*)::bigint as total
      FROM vouchers v
      JOIN beneficiaries b ON b.id = v.beneficiary_id
      WHERE v.status = 'redeemed'
        ${region ? sql`AND v.region = ${String(region)}` : sql``}
        ${grantType ? sql`AND b.grant_type = ${String(grantType)}` : sql``}
        ${startDate ? sql`AND v.redeemed_at >= ${String(startDate)}::timestamptz` : sql``}
        ${endDate ? sql`AND v.redeemed_at <= ${String(endDate)}::timestamptz` : sql``}
        ${month ? sql`AND TO_CHAR(v.redeemed_at, 'YYYY-MM') = ${String(month)}` : sql``}
    `;
    const total = Number((countResult as any[])[0]?.total ?? 0);

    const rows = await sql`
      SELECT 
        v.id,
        v.voucher_code,
        v.beneficiary_id,
        v.beneficiary_name,
        v.amount,
        v.redeemed_at,
        v.redemption_method,
        v.region,
        b.grant_type
      FROM vouchers v
      JOIN beneficiaries b ON b.id = v.beneficiary_id
      WHERE v.status = 'redeemed'
        ${region ? sql`AND v.region = ${String(region)}` : sql``}
        ${grantType ? sql`AND b.grant_type = ${String(grantType)}` : sql``}
        ${startDate ? sql`AND v.redeemed_at >= ${String(startDate)}::timestamptz` : sql``}
        ${endDate ? sql`AND v.redeemed_at <= ${String(endDate)}::timestamptz` : sql``}
        ${month ? sql`AND TO_CHAR(v.redeemed_at, 'YYYY-MM') = ${String(month)}` : sql``}
      ORDER BY v.redeemed_at DESC NULLS LAST
      LIMIT ${Number(limit)} OFFSET ${offset}
    `;

    const data = (rows as any[]).map((row) => ({
      id: row.id,
      voucher_code: row.voucher_code ?? null,
      beneficiary_id: row.beneficiary_id,
      beneficiary_name: row.beneficiary_name ?? null,
      amount: Number(row.amount ?? 0),
      redeemed_at: row.redeemed_at ?? null,
      redemption_method: row.redemption_method ?? null,
      region: row.region,
      grant_type: row.grant_type,
    }));

    res.json({
      success: true,
      data: { transactions: data, total, page: Number(page), limit: Number(limit) },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'QUERY_ERROR', message: error.message },
    });
  }
});

export default router;
