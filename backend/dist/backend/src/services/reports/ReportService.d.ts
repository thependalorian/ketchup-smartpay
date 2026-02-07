/**
 * Report Service
 *
 * Purpose: Generate government compliance and analytics reports
 * Location: backend/src/services/reports/ReportService.ts
 */
export declare class ReportService {
    private voucherRepository;
    constructor();
    /**
     * Generate monthly compliance report
     */
    generateMonthlyReport(month: string): Promise<any>;
    /**
     * Generate voucher distribution summary
     */
    generateVoucherDistributionReport(month: string): Promise<any>;
    /**
     * Generate redemption analytics report
     */
    generateRedemptionAnalyticsReport(month: string): Promise<any>;
    /**
     * Generate agent network performance report from agents table
     */
    generateAgentNetworkReport(month: string): Promise<any>;
}
//# sourceMappingURL=ReportService.d.ts.map