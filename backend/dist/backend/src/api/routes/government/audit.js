/**
 * Government Audit Routes
 *
 * Purpose: Audit trail and compliance auditing
 * Location: backend/src/api/routes/government/audit.ts
 */
import { Router } from 'express';
import { sql } from '../../../database/connection';
const router = Router();
// Get beneficiary audit trail (aligned with beneficiaries schema: id_number, no email)
router.get('/beneficiaries', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const hasStart = typeof startDate === 'string' && startDate.trim() !== '';
        const hasEnd = typeof endDate === 'string' && endDate.trim() !== '';
        // Build WHERE only when we have filters (avoid empty sql fragments that break parameterization)
        let result;
        if (hasStart && hasEnd) {
            result = await sql `
        SELECT 
          COUNT(*)::bigint as total_records,
          COUNT(CASE WHEN phone IS NULL OR TRIM(phone) = '' THEN 1 END)::bigint as missing_phone,
          COUNT(CASE WHEN id_number IS NULL OR TRIM(id_number) = '' THEN 1 END)::bigint as missing_id_number,
          COUNT(DISTINCT id_number) FILTER (WHERE id_number IS NOT NULL AND TRIM(id_number) != '')::bigint as unique_ids,
          (COUNT(*) - COUNT(DISTINCT id_number) FILTER (WHERE id_number IS NOT NULL AND TRIM(id_number) != ''))::bigint as duplicate_or_null_ids,
          COUNT(*) FILTER (WHERE status = 'deceased')::bigint as deceased_count
        FROM beneficiaries
        WHERE created_at >= ${startDate}::timestamptz AND created_at <= ${endDate}::timestamptz
      `;
        }
        else if (hasStart) {
            result = await sql `
        SELECT 
          COUNT(*)::bigint as total_records,
          COUNT(CASE WHEN phone IS NULL OR TRIM(phone) = '' THEN 1 END)::bigint as missing_phone,
          COUNT(CASE WHEN id_number IS NULL OR TRIM(id_number) = '' THEN 1 END)::bigint as missing_id_number,
          COUNT(DISTINCT id_number) FILTER (WHERE id_number IS NOT NULL AND TRIM(id_number) != '')::bigint as unique_ids,
          (COUNT(*) - COUNT(DISTINCT id_number) FILTER (WHERE id_number IS NOT NULL AND TRIM(id_number) != ''))::bigint as duplicate_or_null_ids,
          COUNT(*) FILTER (WHERE status = 'deceased')::bigint as deceased_count
        FROM beneficiaries
        WHERE created_at >= ${startDate}::timestamptz
      `;
        }
        else if (hasEnd) {
            result = await sql `
        SELECT 
          COUNT(*)::bigint as total_records,
          COUNT(CASE WHEN phone IS NULL OR TRIM(phone) = '' THEN 1 END)::bigint as missing_phone,
          COUNT(CASE WHEN id_number IS NULL OR TRIM(id_number) = '' THEN 1 END)::bigint as missing_id_number,
          COUNT(DISTINCT id_number) FILTER (WHERE id_number IS NOT NULL AND TRIM(id_number) != '')::bigint as unique_ids,
          (COUNT(*) - COUNT(DISTINCT id_number) FILTER (WHERE id_number IS NOT NULL AND TRIM(id_number) != ''))::bigint as duplicate_or_null_ids,
          COUNT(*) FILTER (WHERE status = 'deceased')::bigint as deceased_count
        FROM beneficiaries
        WHERE created_at <= ${endDate}::timestamptz
      `;
        }
        else {
            result = await sql `
        SELECT 
          COUNT(*)::bigint as total_records,
          COUNT(CASE WHEN phone IS NULL OR TRIM(phone) = '' THEN 1 END)::bigint as missing_phone,
          COUNT(CASE WHEN id_number IS NULL OR TRIM(id_number) = '' THEN 1 END)::bigint as missing_id_number,
          COUNT(DISTINCT id_number) FILTER (WHERE id_number IS NOT NULL AND TRIM(id_number) != '')::bigint as unique_ids,
          (COUNT(*) - COUNT(DISTINCT id_number) FILTER (WHERE id_number IS NOT NULL AND TRIM(id_number) != ''))::bigint as duplicate_or_null_ids,
          COUNT(*) FILTER (WHERE status = 'deceased')::bigint as deceased_count
        FROM beneficiaries
      `;
        }
        const row = result[0];
        res.json({
            success: true,
            data: {
                total_records: Number(row?.total_records ?? 0),
                missing_phone: Number(row?.missing_phone ?? 0),
                missing_id_number: Number(row?.missing_id_number ?? 0),
                unique_ids: Number(row?.unique_ids ?? 0),
                duplicate_or_null_ids: Number(row?.duplicate_or_null_ids ?? 0),
                deceased_count: Number(row?.deceased_count ?? 0),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'QUERY_ERROR', message: error.message },
        });
    }
});
// Get transaction audit (uses vouchers when transactions table not present)
router.get('/transactions', async (req, res) => {
    try {
        const { startDate, endDate, minAmount } = req.query;
        const hasMin = typeof minAmount === 'string' && minAmount.trim() !== '' && !Number.isNaN(Number(minAmount));
        const hasStart = typeof startDate === 'string' && startDate.trim() !== '';
        const hasEnd = typeof endDate === 'string' && endDate.trim() !== '';
        let result;
        if (hasMin && hasStart && hasEnd) {
            result = await sql `
        SELECT id, amount, status, redeemed_at as timestamp, beneficiary_id
        FROM vouchers
        WHERE status = 'redeemed'
          AND amount >= ${Number(minAmount)}
          AND redeemed_at >= ${startDate}::timestamptz
          AND redeemed_at <= ${endDate}::timestamptz
        ORDER BY redeemed_at DESC
        LIMIT 100
      `;
        }
        else if (hasStart && hasEnd) {
            result = await sql `
        SELECT id, amount, status, redeemed_at as timestamp, beneficiary_id
        FROM vouchers
        WHERE status = 'redeemed'
          AND redeemed_at >= ${startDate}::timestamptz
          AND redeemed_at <= ${endDate}::timestamptz
        ORDER BY redeemed_at DESC
        LIMIT 100
      `;
        }
        else if (hasMin) {
            result = await sql `
        SELECT id, amount, status, redeemed_at as timestamp, beneficiary_id
        FROM vouchers
        WHERE status = 'redeemed' AND amount >= ${Number(minAmount)}
        ORDER BY redeemed_at DESC
        LIMIT 100
      `;
        }
        else if (hasStart) {
            result = await sql `
        SELECT id, amount, status, redeemed_at as timestamp, beneficiary_id
        FROM vouchers
        WHERE status = 'redeemed' AND redeemed_at >= ${startDate}::timestamptz
        ORDER BY redeemed_at DESC
        LIMIT 100
      `;
        }
        else if (hasEnd) {
            result = await sql `
        SELECT id, amount, status, redeemed_at as timestamp, beneficiary_id
        FROM vouchers
        WHERE status = 'redeemed' AND redeemed_at <= ${endDate}::timestamptz
        ORDER BY redeemed_at DESC
        LIMIT 100
      `;
        }
        else {
            result = await sql `
        SELECT id, amount, status, redeemed_at as timestamp, beneficiary_id
        FROM vouchers
        WHERE status = 'redeemed'
        ORDER BY redeemed_at DESC
        LIMIT 100
      `;
        }
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'QUERY_ERROR', message: error.message },
        });
    }
});
// Get compliance audit (PSD-3 trust account; table from optional 006 migration)
router.get('/compliance', async (req, res) => {
    try {
        const complianceData = await sql `
      SELECT 
        'Trust Account' as check_type,
        coverage_percentage,
        status,
        reconciliation_date as check_date
      FROM trust_account_reconciliation
      ORDER BY reconciliation_date DESC
      LIMIT 30
    `;
        res.json({ success: true, data: complianceData });
    }
    catch (error) {
        // Table may not exist if optional PSD migration (006) not run
        if (error?.message?.includes('does not exist')) {
            return res.json({ success: true, data: [] });
        }
        res.status(500).json({
            success: false,
            error: { code: 'QUERY_ERROR', message: error.message },
        });
    }
});
export default router;
//# sourceMappingURL=audit.js.map