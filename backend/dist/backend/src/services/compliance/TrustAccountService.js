/**
 * Trust Account Service
 *
 * Purpose: Manage trust account reconciliation for PSD-3 compliance
 * Regulation: PSD-3 Section 11.2 - Safe Storage of Customer Funds
 * Location: backend/src/services/compliance/TrustAccountService.ts
 *
 * Requirements:
 * - Trust account must hold 100% of outstanding e-money liabilities at all times
 * - Daily reconciliation required
 * - Deficiencies must be resolved within 1 business day
 * - Interest can only be withdrawn if remaining balance >= 100% liabilities
 *
 * PSD-3 Section 11.2.4: "At all times, the aggregate value of the pooled funds
 * must equal at least 100% of the value of all outstanding e-money liabilities.
 * These funds must be reconciled on a daily basis, with any deficiencies
 * addressed within one (1) business day."
 */
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
export class TrustAccountService {
    /**
     * Perform daily reconciliation
     * PSD-3 Section 11.2.4: Daily reconciliation required
     */
    static async performDailyReconciliation(reconciledBy = 'System') {
        try {
            // Step 1: Get trust account balance
            const trustBalance = await this.getTrustAccountBalance();
            // Step 2: Calculate outstanding e-money liabilities
            const liabilities = await this.calculateOutstandingLiabilities();
            // Step 3: Calculate coverage percentage
            const coveragePercentage = (trustBalance.balance / liabilities.totalLiabilities) * 100;
            // Step 4: Determine status and deficiency
            const isCompliant = coveragePercentage >= 100;
            const status = isCompliant ? 'compliant' : 'deficient';
            const deficiencyAmount = isCompliant ? null : liabilities.totalLiabilities - trustBalance.balance;
            // Step 5: Insert reconciliation record
            const result = await sql `
        INSERT INTO trust_account_reconciliation (
          reconciliation_date,
          trust_account_balance,
          outstanding_emoney_liabilities,
          coverage_percentage,
          deficiency_amount,
          status,
          reconciled_by
        ) VALUES (
          CURRENT_DATE,
          ${trustBalance.balance},
          ${liabilities.totalLiabilities},
          ${coveragePercentage},
          ${deficiencyAmount},
          ${status},
          ${reconciledBy}
        )
        ON CONFLICT (reconciliation_date)
        DO UPDATE SET
          trust_account_balance = ${trustBalance.balance},
          outstanding_emoney_liabilities = ${liabilities.totalLiabilities},
          coverage_percentage = ${coveragePercentage},
          deficiency_amount = ${deficiencyAmount},
          status = ${status},
          reconciled_by = ${reconciledBy},
          updated_at = NOW()
        RETURNING *
      `;
            // Step 6: Log to audit trail
            await sql `
        INSERT INTO compliance_audit_trail (
          audit_type,
          regulation,
          section,
          action_taken,
          performed_by,
          result,
          after_state
        ) VALUES (
          'reconciliation',
          'PSD-3',
          '11.2.4',
          'Daily trust account reconciliation performed',
          ${reconciledBy},
          ${status},
          ${JSON.stringify({ coveragePercentage, deficiencyAmount, liabilities: liabilities.totalLiabilities })}
        )
      `;
            // Step 7: If deficient, create alert/notification (handled by monitoring service)
            if (!isCompliant) {
                console.warn(`🚨 PSD-3 VIOLATION: Trust account deficiency of N$${deficiencyAmount?.toFixed(2)}`);
                console.warn(`   Coverage: ${coveragePercentage.toFixed(2)}% (Required: 100%)`);
                console.warn(`   Action: Deficiency must be resolved within 1 business day`);
            }
            return {
                id: result[0].id,
                reconciliationDate: result[0].reconciliation_date,
                trustAccountBalance: parseFloat(result[0].trust_account_balance),
                outstandingLiabilities: parseFloat(result[0].outstanding_emoney_liabilities),
                coveragePercentage: parseFloat(result[0].coverage_percentage),
                deficiencyAmount: result[0].deficiency_amount ? parseFloat(result[0].deficiency_amount) : null,
                status: result[0].status,
            };
        }
        catch (error) {
            console.error('❌ Daily reconciliation failed:', error.message);
            throw error;
        }
    }
    /**
     * Get trust account balance
     * In production, this would query the actual bank account via API
     * For now, we calculate from wallet balances
     */
    static async getTrustAccountBalance() {
        try {
            // Get sum of all wallet balances (this represents trust account)
            const result = await sql `
        SELECT 
          COALESCE(SUM(current_balance), 0) as balance,
          NOW() as last_updated
        FROM ewallet_balances
      `;
            return {
                balance: parseFloat(result[0].balance),
                lastUpdated: new Date(result[0].last_updated),
            };
        }
        catch (error) {
            console.error('❌ Failed to get trust account balance:', error.message);
            throw error;
        }
    }
    /**
     * Calculate outstanding e-money liabilities
     * PSD-3 Definition: "Outstanding electronic money liabilities" means the aggregate
     * of all unredeemed e-money funds held in individual wallets, business and agent wallets.
     */
    static async calculateOutstandingLiabilities() {
        try {
            const result = await sql `
        SELECT 
          COALESCE(SUM(current_balance), 0) as total_liabilities,
          COUNT(CASE WHEN wallet_status = 'active' THEN 1 END) as active_wallets,
          COUNT(CASE WHEN wallet_status = 'dormant' THEN 1 END) as dormant_wallets
        FROM ewallet_balances
        WHERE wallet_status IN ('active', 'dormant')
      `;
            return {
                totalLiabilities: parseFloat(result[0].total_liabilities),
                activeWallets: parseInt(result[0].active_wallets),
                dormantWallets: parseInt(result[0].dormant_wallets),
            };
        }
        catch (error) {
            console.error('❌ Failed to calculate outstanding liabilities:', error.message);
            throw error;
        }
    }
    /**
     * Resolve deficiency
     * PSD-3 Section 11.2.4: Deficiencies must be addressed within 1 business day
     */
    static async resolveDeficiency(reconciliationId, resolutionNotes, resolvedBy) {
        try {
            // Update reconciliation record
            await sql `
        UPDATE trust_account_reconciliation
        SET 
          status = 'resolved',
          resolution_date = NOW(),
          resolution_notes = ${resolutionNotes},
          updated_at = NOW()
        WHERE id = ${reconciliationId}
      `;
            // Log resolution to audit trail
            await sql `
        INSERT INTO compliance_audit_trail (
          audit_type,
          regulation,
          section,
          action_taken,
          performed_by,
          result,
          notes
        ) VALUES (
          'deficiency_resolution',
          'PSD-3',
          '11.2.4',
          'Trust account deficiency resolved',
          ${resolvedBy},
          'resolved',
          ${resolutionNotes}
        )
      `;
            console.log('✅ Trust account deficiency resolved');
        }
        catch (error) {
            console.error('❌ Failed to resolve deficiency:', error.message);
            throw error;
        }
    }
    /**
     * Track interest earned on trust account
     * PSD-3 Section 11.3: Interest management
     */
    static async trackInterest(date, interestEarned, interestWithdrawn = 0) {
        try {
            // Verify remaining balance still covers 100% liabilities
            const liabilities = await this.calculateOutstandingLiabilities();
            const trustBalance = await this.getTrustAccountBalance();
            const remainingAfterWithdrawal = trustBalance.balance - interestWithdrawn;
            if (remainingAfterWithdrawal < liabilities.totalLiabilities) {
                throw new Error(`PSD-3 VIOLATION: Cannot withdraw interest. Remaining balance (N$${remainingAfterWithdrawal}) ` +
                    `would be less than liabilities (N$${liabilities.totalLiabilities}). ` +
                    `PSD-3 Section 11.3.1 requires 100% coverage after withdrawal.`);
            }
            // Update reconciliation with interest data
            await sql `
        UPDATE trust_account_reconciliation
        SET 
          interest_earned = ${interestEarned},
          interest_withdrawn = ${interestWithdrawn},
          updated_at = NOW()
        WHERE reconciliation_date = ${date.toISOString().split('T')[0]}
      `;
            // Log to audit trail
            await sql `
        INSERT INTO compliance_audit_trail (
          audit_type,
          regulation,
          section,
          action_taken,
          performed_by,
          result,
          notes
        ) VALUES (
          'interest_management',
          'PSD-3',
          '11.3',
          'Trust account interest tracked',
          'System',
          'compliant',
          ${`Earned: N$${interestEarned}, Withdrawn: N$${interestWithdrawn}, Remaining: N$${remainingAfterWithdrawal}`}
        )
      `;
            console.log(`✅ Interest tracked: Earned N$${interestEarned}, Withdrawn N$${interestWithdrawn}`);
        }
        catch (error) {
            console.error('❌ Failed to track interest:', error.message);
            throw error;
        }
    }
    /**
     * Get reconciliation history
     */
    static async getReconciliationHistory(days = 30) {
        try {
            const result = await sql `
        SELECT * FROM trust_account_reconciliation
        ORDER BY reconciliation_date DESC
        LIMIT ${days}
      `;
            return result.map((row) => ({
                id: row.id,
                reconciliationDate: row.reconciliation_date,
                trustAccountBalance: parseFloat(row.trust_account_balance),
                outstandingLiabilities: parseFloat(row.outstanding_emoney_liabilities),
                coveragePercentage: parseFloat(row.coverage_percentage),
                deficiencyAmount: row.deficiency_amount ? parseFloat(row.deficiency_amount) : null,
                status: row.status,
                interestEarned: row.interest_earned ? parseFloat(row.interest_earned) : undefined,
                interestWithdrawn: row.interest_withdrawn ? parseFloat(row.interest_withdrawn) : undefined,
            }));
        }
        catch (error) {
            console.error('❌ Failed to get reconciliation history:', error.message);
            throw error;
        }
    }
    /**
     * Check current compliance status
     */
    static async checkComplianceStatus() {
        try {
            const result = await sql `
        SELECT * FROM trust_account_reconciliation
        ORDER BY reconciliation_date DESC
        LIMIT 1
      `;
            if (result.length === 0) {
                return {
                    isCompliant: false,
                    coveragePercentage: 0,
                    deficiencyAmount: null,
                    lastReconciliationDate: null,
                };
            }
            const latest = result[0];
            return {
                isCompliant: latest.status === 'compliant' || latest.status === 'resolved',
                coveragePercentage: parseFloat(latest.coverage_percentage),
                deficiencyAmount: latest.deficiency_amount ? parseFloat(latest.deficiency_amount) : null,
                lastReconciliationDate: latest.reconciliation_date,
            };
        }
        catch (error) {
            console.error('❌ Failed to check compliance status:', error.message);
            throw error;
        }
    }
    /**
     * Get pending deficiencies (older than 1 business day)
     * PSD-3 Requirement: Must be resolved within 1 business day
     */
    static async getPendingDeficiencies() {
        try {
            const result = await sql `
        SELECT * FROM trust_account_reconciliation
        WHERE status = 'deficient'
          AND reconciliation_date < CURRENT_DATE - INTERVAL '1 day'
        ORDER BY reconciliation_date ASC
      `;
            return result.map((row) => ({
                id: row.id,
                reconciliationDate: row.reconciliation_date,
                trustAccountBalance: parseFloat(row.trust_account_balance),
                outstandingLiabilities: parseFloat(row.outstanding_emoney_liabilities),
                coveragePercentage: parseFloat(row.coverage_percentage),
                deficiencyAmount: parseFloat(row.deficiency_amount),
                status: row.status,
            }));
        }
        catch (error) {
            console.error('❌ Failed to get pending deficiencies:', error.message);
            throw error;
        }
    }
}
//# sourceMappingURL=TrustAccountService.js.map