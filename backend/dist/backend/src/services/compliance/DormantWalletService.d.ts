/**
 * Dormant Wallet Service
 *
 * Purpose: Manage dormant e-wallets per PSD-3 requirements
 * Regulation: PSD-3 Section 11.4 - Unclaimed Funds and Dormant Wallets
 * Location: backend/src/services/compliance/DormantWalletService.ts
 *
 * Requirements:
 * - Wallet becomes dormant after 6 months of no activity
 * - Notify customer 1 month before dormancy (at 5 months)
 * - No fees can be charged on dormant wallets
 * - Funds cannot be intermediated or treated as income
 * - Must process dormant funds per Section 11.4.5
 *
 * PSD-3 Section 11.4.1: "A customer's e-money wallet must be considered dormant
 * if it does not register a transaction for a consecutive period of six (6) months."
 */
interface DormantWallet {
    id: string;
    beneficiaryId: string;
    walletBalance: number;
    lastTransactionDate: Date;
    dormancyDate: Date | null;
    status: string;
    customerNotified: boolean;
}
interface DormancyCheckResult {
    approachingDormancy: number;
    nowDormant: number;
    notificationsToSend: number;
}
export declare class DormantWalletService {
    private static readonly DORMANCY_PERIOD_MONTHS;
    private static readonly NOTIFICATION_PERIOD_MONTHS;
    private static readonly SEPARATE_ACCOUNT_PERIOD_YEARS;
    /**
     * Identify wallets approaching dormancy (5 months inactive)
     * PSD-3 Section 11.4.2: Notify 1 month before dormancy
     */
    static identifyApproachingDormancy(): Promise<DormantWallet[]>;
    /**
     * Mark wallets as dormant (6 months inactive)
     * PSD-3 Section 11.4.1: Dormant after 6 months
     */
    static markWalletsAsDormant(): Promise<DormantWallet[]>;
    /**
     * Send dormancy notifications
     * PSD-3 Section 11.4.2: Notify 1 month before dormancy
     */
    static sendDormancyNotifications(): Promise<number>;
    /**
     * Process dormant funds
     * PSD-3 Section 11.4.5: Specific procedures for fund resolution
     */
    static processDormantFunds(dormantWalletId: string): Promise<void>;
    /**
     * Get dormancy statistics for reporting
     * PSD-3 Section 11.4.6: Report in monthly returns
     */
    static getDormancyStatistics(): Promise<{
        totalDormantWallets: number;
        totalDormantBalance: number;
        approachingDormancy: number;
        fundsInSeparateAccount: number;
        fundsReturned: number;
    }>;
    /**
     * Send notification to customer
     * PSD-3 Section 11.4.2: Notify before dormancy
     */
    private static sendNotification;
    /**
     * Run daily dormancy check
     * Should be scheduled to run daily
     */
    static runDailyDormancyCheck(): Promise<DormancyCheckResult>;
    /**
     * Get dormant wallets list
     */
    static getDormantWallets(status?: string): Promise<DormantWallet[]>;
}
export {};
//# sourceMappingURL=DormantWalletService.d.ts.map