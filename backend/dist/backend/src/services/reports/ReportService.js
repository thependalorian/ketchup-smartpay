/**
 * Report Service
 *
 * Purpose: Generate government compliance and analytics reports
 * Location: backend/src/services/reports/ReportService.ts
 */
import { sql } from '../../database/connection';
import { VoucherRepository } from '../voucher/VoucherRepository';
import { log, logError } from '../../utils/logger';
export class ReportService {
    voucherRepository;
    constructor() {
        this.voucherRepository = new VoucherRepository();
    }
    /**
     * Generate monthly compliance report
     */
    async generateMonthlyReport(month) {
        try {
            log('Generating monthly report', { month });
            const [year, monthNum] = month.split('-').map(Number);
            const startDate = new Date(year, monthNum - 1, 1).toISOString();
            const endDate = new Date(year, monthNum, 0, 23, 59, 59).toISOString();
            // Query vouchers for the month (using Buffr vouchers table)
            const vouchers = await sql `
        SELECT 
          COUNT(*) as total_vouchers,
          COALESCE(SUM(amount), 0) as total_disbursement,
          COUNT(CASE WHEN status = 'redeemed' THEN 1 END) as vouchers_redeemed,
          COUNT(CASE WHEN status = 'expired' THEN 1 END) as vouchers_expired
        FROM vouchers
        WHERE created_at >= ${startDate}::timestamp
          AND created_at <= ${endDate}::timestamp
      `;
            const stats = vouchers[0];
            const totalVouchers = Number(stats.total_vouchers) || 0;
            const totalDisbursement = Number(stats.total_disbursement) || 0;
            const vouchersRedeemed = Number(stats.vouchers_redeemed) || 0;
            const redemptionRate = totalVouchers > 0 ? (vouchersRedeemed / totalVouchers) * 100 : 0;
            // Beneficiary count (SmartPay schema: beneficiary_id)
            const beneficiaries = await sql `
        SELECT COUNT(DISTINCT beneficiary_id) as total_beneficiaries
        FROM vouchers
        WHERE created_at >= ${startDate}::timestamp
          AND created_at <= ${endDate}::timestamp
      `;
            const totalBeneficiaries = Number(beneficiaries[0]?.total_beneficiaries) || 0;
            // Deceased beneficiaries count (for reporting)
            const deceasedCount = await sql `
        SELECT COUNT(*) as c FROM beneficiaries WHERE status = 'deceased'
      `;
            const deceasedBeneficiaries = Number(deceasedCount[0]?.c ?? 0);
            // Regional breakdown (vouchers.region)
            const byRegion = await sql `
        SELECT 
          region,
          COUNT(*) as vouchers_issued,
          COALESCE(SUM(amount), 0) as amount_disbursed,
          COUNT(CASE WHEN status = 'redeemed' THEN 1 END) as vouchers_redeemed
        FROM vouchers
        WHERE created_at >= ${startDate}::timestamp
          AND created_at <= ${endDate}::timestamp
        GROUP BY region
        ORDER BY vouchers_issued DESC
      `;
            // Grant type breakdown
            const byGrantType = await sql `
        SELECT 
          grant_type as grant_type,
          COUNT(*) as vouchers_issued,
          COALESCE(SUM(amount), 0) as amount_disbursed,
          COUNT(CASE WHEN status = 'redeemed' THEN 1 END) as vouchers_redeemed
        FROM vouchers
        WHERE created_at >= ${startDate}::timestamp
          AND created_at <= ${endDate}::timestamp
        GROUP BY grant_type
        ORDER BY vouchers_issued DESC
      `;
            return {
                report_period: month,
                generated_at: new Date().toISOString(),
                summary: {
                    total_beneficiaries: totalBeneficiaries,
                    total_vouchers_issued: totalVouchers,
                    total_disbursement: totalDisbursement,
                    vouchers_redeemed: vouchersRedeemed,
                    vouchers_expired: Number(stats.vouchers_expired) || 0,
                    redemption_rate: Math.round(redemptionRate * 100) / 100,
                    deceased_beneficiaries: deceasedBeneficiaries,
                },
                by_region: byRegion.map((row) => ({
                    region: row.region,
                    vouchers_issued: Number(row.vouchers_issued),
                    amount_disbursed: Number(row.amount_disbursed),
                    vouchers_redeemed: Number(row.vouchers_redeemed),
                })),
                by_grant_type: byGrantType.map((row) => ({
                    grant_type: row.grant_type,
                    vouchers_issued: Number(row.vouchers_issued),
                    amount_disbursed: Number(row.amount_disbursed),
                    vouchers_redeemed: Number(row.vouchers_redeemed),
                })),
            };
        }
        catch (error) {
            logError('Failed to generate monthly report', error);
            throw error;
        }
    }
    /**
     * Generate voucher distribution summary
     */
    async generateVoucherDistributionReport(month) {
        try {
            log('Generating voucher distribution report', { month });
            const [year, monthNum] = month.split('-').map(Number);
            const startDate = new Date(year, monthNum - 1, 1).toISOString();
            const endDate = new Date(year, monthNum, 0, 23, 59, 59).toISOString();
            const distribution = await sql `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as vouchers_issued,
          COALESCE(SUM(amount), 0) as amount_disbursed
        FROM vouchers
        WHERE created_at >= ${startDate}::timestamp
          AND created_at <= ${endDate}::timestamp
        GROUP BY DATE(created_at)
        ORDER BY date
      `;
            return {
                report_period: month,
                generated_at: new Date().toISOString(),
                daily_breakdown: distribution.map((row) => ({
                    date: row.date,
                    vouchers_issued: Number(row.vouchers_issued),
                    amount_disbursed: Number(row.amount_disbursed),
                })),
            };
        }
        catch (error) {
            logError('Failed to generate voucher distribution report', error);
            throw error;
        }
    }
    /**
     * Generate redemption analytics report
     */
    async generateRedemptionAnalyticsReport(month) {
        try {
            log('Generating redemption analytics report', { month });
            const [year, monthNum] = month.split('-').map(Number);
            const startDate = new Date(year, monthNum - 1, 1).toISOString();
            const endDate = new Date(year, monthNum, 0, 23, 59, 59).toISOString();
            const analytics = await sql `
        SELECT 
          redemption_method,
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as total_amount
        FROM vouchers
        WHERE status = 'redeemed'
          AND redeemed_at >= ${startDate}::timestamp
          AND redeemed_at <= ${endDate}::timestamp
        GROUP BY redemption_method
      `;
            return {
                report_period: month,
                generated_at: new Date().toISOString(),
                by_redemption_method: analytics.map((row) => ({
                    method: row.redemption_method || 'unknown',
                    count: Number(row.count),
                    total_amount: Number(row.total_amount),
                })),
            };
        }
        catch (error) {
            logError('Failed to generate redemption analytics report', error);
            throw error;
        }
    }
    /**
     * Generate agent network performance report from agents table
     */
    async generateAgentNetworkReport(month) {
        try {
            log('Generating agent network report', { month });
            const [year, monthNum] = month.split('-').map(Number);
            const startDate = new Date(year, monthNum - 1, 1).toISOString();
            const endDate = new Date(year, monthNum, 0, 23, 59, 59).toISOString();
            const agentsSummary = await sql `
        SELECT 
          COUNT(*) as total_agents,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_agents
        FROM agents
        WHERE created_at >= ${startDate}::timestamp
          AND created_at <= ${endDate}::timestamp
      `;
            const summaryRow = agentsSummary[0];
            const totalAgents = Number(summaryRow?.total_agents) || 0;
            const activeAgents = Number(summaryRow?.active_agents) || 0;
            const byAgentType = await sql `
        SELECT 
          type,
          COUNT(*) as count,
          COALESCE(SUM(liquidity_balance + cash_on_hand), 0) as total_balance
        FROM agents
        WHERE created_at >= ${startDate}::timestamp
          AND created_at <= ${endDate}::timestamp
        GROUP BY type
      `;
            const byRegion = await sql `
        SELECT 
          location as region,
          COUNT(*) as agent_count
        FROM agents
        WHERE created_at >= ${startDate}::timestamp
          AND created_at <= ${endDate}::timestamp
        GROUP BY location
        ORDER BY agent_count DESC
      `;
            return {
                report_period: month,
                generated_at: new Date().toISOString(),
                summary: {
                    total_agents: totalAgents,
                    active_agents: activeAgents,
                    total_transactions: 0,
                    total_volume: 0,
                },
                by_agent_type: Object.fromEntries(byAgentType.map((row) => [
                    row.type,
                    { count: Number(row.count), total_balance: Number(row.total_balance) },
                ])),
                by_region: byRegion.map((row) => ({
                    region: row.region,
                    agent_count: Number(row.agent_count),
                })),
            };
        }
        catch (error) {
            logError('Failed to generate agent network report', error);
            throw error;
        }
    }
}
//# sourceMappingURL=ReportService.js.map