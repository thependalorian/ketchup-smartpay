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
interface ReconciliationResult {
    id: string;
    reconciliationDate: string;
    trustAccountBalance: number;
    outstandingLiabilities: number;
    coveragePercentage: number;
    deficiencyAmount: number | null;
    status: 'compliant' | 'deficient' | 'resolved';
    interestEarned?: number;
    interestWithdrawn?: number;
}
interface TrustAccountBalance {
    balance: number;
    lastUpdated: Date;
}
interface OutstandingLiabilities {
    totalLiabilities: number;
    activeWallets: number;
    dormantWallets: number;
}
export declare class TrustAccountService {
    /**
     * Perform daily reconciliation
     * PSD-3 Section 11.2.4: Daily reconciliation required
     */
    static performDailyReconciliation(reconciledBy?: string): Promise<ReconciliationResult>;
    /**
     * Get trust account balance
     * In production, this would query the actual bank account via API
     * For now, we calculate from wallet balances
     */
    static getTrustAccountBalance(): Promise<TrustAccountBalance>;
    /**
     * Calculate outstanding e-money liabilities
     * PSD-3 Definition: "Outstanding electronic money liabilities" means the aggregate
     * of all unredeemed e-money funds held in individual wallets, business and agent wallets.
     */
    static calculateOutstandingLiabilities(): Promise<OutstandingLiabilities>;
    /**
     * Resolve deficiency
     * PSD-3 Section 11.2.4: Deficiencies must be addressed within 1 business day
     */
    static resolveDeficiency(reconciliationId: string, resolutionNotes: string, resolvedBy: string): Promise<void>;
    /**
     * Track interest earned on trust account
     * PSD-3 Section 11.3: Interest management
     */
    static trackInterest(date: Date, interestEarned: number, interestWithdrawn?: number): Promise<void>;
    /**
     * Get reconciliation history
     */
    static getReconciliationHistory(days?: number): Promise<ReconciliationResult[]>;
    /**
     * Check current compliance status
     */
    static checkComplianceStatus(): Promise<{
        isCompliant: boolean;
        coveragePercentage: number;
        deficiencyAmount: number | null;
        lastReconciliationDate: string | null;
    }>;
    /**
     * Get pending deficiencies (older than 1 business day)
     * PSD-3 Requirement: Must be resolved within 1 business day
     */
    static getPendingDeficiencies(): Promise<ReconciliationResult[]>;
}
export {};
//# sourceMappingURL=TrustAccountService.d.ts.map