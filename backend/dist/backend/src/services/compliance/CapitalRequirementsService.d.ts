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
interface LiquidAssets {
    cash: number;
    governmentBonds: number;
    shortTermInstruments: number;
    otherApprovedAssets: number;
}
interface CapitalReport {
    trackingDate: string;
    initialCapitalRequired: number;
    initialCapitalHeld: number;
    ongoingCapitalRequired: number;
    ongoingCapitalHeld: number;
    liquidAssetsTotal: number;
    liquidAssetsBreakdown: LiquidAssets;
    complianceStatus: 'compliant' | 'deficient';
    deficiencyAmount: number | null;
}
export declare class CapitalRequirementsService {
    private static readonly INITIAL_CAPITAL_REQUIRED;
    /**
     * Calculate ongoing capital requirement
     * PSD-3 Section 11.5.3: 6-month average of outstanding e-money liabilities
     */
    static calculateOngoingCapitalRequirement(): Promise<number>;
    /**
     * Track daily capital requirements
     * PSD-3: Continuous monitoring
     */
    static trackDailyCapital(liquidAssets: LiquidAssets, initialCapitalHeld: number): Promise<CapitalReport>;
    /**
     * Get capital compliance status
     */
    static getCapitalComplianceStatus(): Promise<{
        isCompliant: boolean;
        initialCapitalCompliant: boolean;
        ongoingCapitalCompliant: boolean;
        deficiencyAmount: number | null;
        lastCheckDate: string | null;
    }>;
    /**
     * Generate capital report
     */
    static generateCapitalReport(months?: number): Promise<CapitalReport[]>;
}
export {};
//# sourceMappingURL=CapitalRequirementsService.d.ts.map