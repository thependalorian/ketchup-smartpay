/**
 * Capital Requirements Service
 *
 * Purpose: Track and monitor capital requirements for PSD-3 compliance
 * Regulation: PSD-3 Section 11.5 - Minimum Capital Requirements
 * Location: backend/src/services/compliance/CapitalRequirementsService.ts
 *
 * Requirements:
 * - Initial Capital: N$1.5 million at time of licensing
 * - Ongoing Capital: Average of outstanding e-money liabilities (6-month rolling)
 * - Form: Cash or liquid assets (govt bonds, short-term instruments)
 * - Must remain unencumbered
 *
 * PSD-3 Section 11.5.2: "At the time of licensing, a non-bank e-money issuer
 * is required to have an initial capital amount of N$1.5 million."
 *
 * PSD-3 Section 11.5.3: "Non-bank e-money issuers are required to maintain
 * ongoing capital, either in the form of cash or other liquid assets equal
 * to the average of outstanding e-money liabilities, calculated over the
 * previous six (6) months."
 */
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
export class CapitalRequirementsService {
    static INITIAL_CAPITAL_REQUIRED = 1_500_000; // N$1.5 million (PSD-3 Section 11.5.2)
    /**
     * Calculate ongoing capital requirement
     * PSD-3 Section 11.5.3: 6-month average of outstanding e-money liabilities
     */
    static async calculateOngoingCapitalRequirement() {
        try {
            // Get average of outstanding e-money liabilities over last 6 months
            const result = await sql `
        SELECT 
          COALESCE(AVG(outstanding_emoney_liabilities), 0) as avg_liabilities,
          COUNT(*) as record_count
        FROM trust_account_reconciliation
        WHERE reconciliation_date >= CURRENT_DATE - INTERVAL '6 months'
      `;
            const avgLiabilities = parseFloat(result[0].avg_liabilities || '0');
            const recordCount = parseInt(result[0].record_count);
            // If less than 6 months of data, use current liabilities
            if (recordCount < 30) {
                console.warn(`⚠️ Insufficient history for 6-month average (${recordCount} days). Using current liabilities.`);
                const currentLiabilities = await sql `
          SELECT COALESCE(SUM(current_balance), 0) as total
          FROM ewallet_balances
          WHERE wallet_status IN ('active', 'dormant')
        `;
                return parseFloat(currentLiabilities[0].total);
            }
            // PSD-3 Section 11.5.3: Ongoing capital = 6-month average of liabilities
            return avgLiabilities;
        }
        catch (error) {
            console.error('❌ Failed to calculate ongoing capital requirement:', error.message);
            throw error;
        }
    }
    /**
     * Track daily capital requirements
     * PSD-3: Continuous monitoring
     */
    static async trackDailyCapital(liquidAssets, initialCapitalHeld) {
        try {
            const ongoingCapitalRequired = await this.calculateOngoingCapitalRequirement();
            const liquidAssetsTotal = liquidAssets.cash +
                liquidAssets.governmentBonds +
                liquidAssets.shortTermInstruments +
                liquidAssets.otherApprovedAssets;
            const ongoingCapitalHeld = liquidAssetsTotal;
            // Check compliance
            const initialCapitalCompliant = initialCapitalHeld >= this.INITIAL_CAPITAL_REQUIRED;
            const ongoingCapitalCompliant = ongoingCapitalHeld >= ongoingCapitalRequired;
            const isCompliant = initialCapitalCompliant && ongoingCapitalCompliant;
            const complianceStatus = isCompliant ? 'compliant' : 'deficient';
            // Calculate deficiency
            let deficiencyAmount = null;
            if (!initialCapitalCompliant) {
                deficiencyAmount = this.INITIAL_CAPITAL_REQUIRED - initialCapitalHeld;
            }
            else if (!ongoingCapitalCompliant) {
                deficiencyAmount = ongoingCapitalRequired - ongoingCapitalHeld;
            }
            // Insert tracking record
            const result = await sql `
        INSERT INTO capital_requirements_tracking (
          tracking_date,
          initial_capital_required,
          initial_capital_held,
          outstanding_liabilities_avg_6mo,
          ongoing_capital_required,
          ongoing_capital_held,
          liquid_assets,
          liquid_assets_total,
          compliance_status,
          deficiency_amount
        ) VALUES (
          CURRENT_DATE,
          ${this.INITIAL_CAPITAL_REQUIRED},
          ${initialCapitalHeld},
          ${ongoingCapitalRequired},
          ${ongoingCapitalRequired},
          ${ongoingCapitalHeld},
          ${JSON.stringify(liquidAssets)},
          ${liquidAssetsTotal},
          ${complianceStatus},
          ${deficiencyAmount}
        )
        ON CONFLICT (tracking_date)
        DO UPDATE SET
          initial_capital_held = ${initialCapitalHeld},
          outstanding_liabilities_avg_6mo = ${ongoingCapitalRequired},
          ongoing_capital_required = ${ongoingCapitalRequired},
          ongoing_capital_held = ${ongoingCapitalHeld},
          liquid_assets = ${JSON.stringify(liquidAssets)},
          liquid_assets_total = ${liquidAssetsTotal},
          compliance_status = ${complianceStatus},
          deficiency_amount = ${deficiencyAmount},
          updated_at = NOW()
        RETURNING *
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
          'capital_tracking',
          'PSD-3',
          '11.5',
          'Daily capital requirements tracked',
          'System',
          ${complianceStatus},
          ${JSON.stringify({
                ongoingRequired: ongoingCapitalRequired,
                ongoingHeld: ongoingCapitalHeld,
                deficiency: deficiencyAmount,
            })}
        )
      `;
            if (!isCompliant) {
                console.warn(`🚨 PSD-3 CAPITAL VIOLATION: Deficiency of N$${deficiencyAmount?.toFixed(2)}`);
                console.warn(`   Initial Capital: N$${initialCapitalHeld.toLocaleString()} (Required: N$${this.INITIAL_CAPITAL_REQUIRED.toLocaleString()})`);
                console.warn(`   Ongoing Capital: N$${ongoingCapitalHeld.toLocaleString()} (Required: N$${ongoingCapitalRequired.toLocaleString()})`);
            }
            return {
                trackingDate: result[0].tracking_date,
                initialCapitalRequired: this.INITIAL_CAPITAL_REQUIRED,
                initialCapitalHeld,
                ongoingCapitalRequired,
                ongoingCapitalHeld,
                liquidAssetsTotal,
                liquidAssetsBreakdown: liquidAssets,
                complianceStatus,
                deficiencyAmount,
            };
        }
        catch (error) {
            console.error('❌ Failed to track capital:', error.message);
            throw error;
        }
    }
    /**
     * Get capital compliance status
     */
    static async getCapitalComplianceStatus() {
        try {
            const result = await sql `
        SELECT * FROM capital_requirements_tracking
        ORDER BY tracking_date DESC
        LIMIT 1
      `;
            if (result.length === 0) {
                return {
                    isCompliant: false,
                    initialCapitalCompliant: false,
                    ongoingCapitalCompliant: false,
                    deficiencyAmount: this.INITIAL_CAPITAL_REQUIRED,
                    lastCheckDate: null,
                };
            }
            const latest = result[0];
            const initialCompliant = parseFloat(latest.initial_capital_held) >= this.INITIAL_CAPITAL_REQUIRED;
            const ongoingCompliant = parseFloat(latest.ongoing_capital_held) >= parseFloat(latest.ongoing_capital_required);
            return {
                isCompliant: latest.compliance_status === 'compliant',
                initialCapitalCompliant: initialCompliant,
                ongoingCapitalCompliant: ongoingCompliant,
                deficiencyAmount: latest.deficiency_amount ? parseFloat(latest.deficiency_amount) : null,
                lastCheckDate: latest.tracking_date,
            };
        }
        catch (error) {
            console.error('❌ Failed to get capital compliance status:', error.message);
            throw error;
        }
    }
    /**
     * Generate capital report
     */
    static async generateCapitalReport(months = 6) {
        try {
            const result = await sql `
        SELECT * FROM capital_requirements_tracking
        ORDER BY tracking_date DESC
        LIMIT ${months * 30}
      `;
            return result.map((row) => ({
                trackingDate: row.tracking_date,
                initialCapitalRequired: parseFloat(row.initial_capital_required),
                initialCapitalHeld: parseFloat(row.initial_capital_held),
                ongoingCapitalRequired: parseFloat(row.ongoing_capital_required),
                ongoingCapitalHeld: parseFloat(row.ongoing_capital_held),
                liquidAssetsTotal: parseFloat(row.liquid_assets_total),
                liquidAssetsBreakdown: row.liquid_assets,
                complianceStatus: row.compliance_status,
                deficiencyAmount: row.deficiency_amount ? parseFloat(row.deficiency_amount) : null,
            }));
        }
        catch (error) {
            console.error('❌ Failed to generate capital report:', error.message);
            throw error;
        }
    }
}
//# sourceMappingURL=CapitalRequirementsService.js.map