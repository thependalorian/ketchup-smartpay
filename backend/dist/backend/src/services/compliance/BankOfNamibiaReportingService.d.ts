/**
 * Bank of Namibia Reporting Service
 *
 * Purpose: Generate and submit monthly reports to Bank of Namibia
 * Regulation: PSD-3 Section 23, PSD-1 Section 16.15
 * Location: backend/src/services/compliance/BankOfNamibiaReportingService.ts
 *
 * Requirements:
 * - Monthly statistics required
 * - Due by 10th of following month
 * - Must include: e-money statistics, trust account attestation, transaction data
 * - Agent annual return by January 31 (Table 1 format)
 *
 * PSD-3 Section 23.2: "The statistics for the reporting month must reach the
 * Bank within ten (10) days of the following month. For example, statistics
 * for October must reach the Bank before or on the 10th of November."
 */
interface MonthlyReport {
    reportId: string;
    reportMonth: string;
    reportType: string;
    generatedAt: Date;
    submittedToBoN: boolean;
    dueDate: string;
    data: MonthlyReportData;
}
interface MonthlyReportData {
    totalRegisteredUsers: number;
    totalActiveWallets: number;
    totalDormantWallets: number;
    outstandingEmoneyLiabilities: number;
    trustAccountBalance: number;
    trustAccountInterest: number;
    totalTransactionsVolume: number;
    totalTransactionsValue: number;
    cashInVolume: number;
    cashInValue: number;
    cashOutVolume: number;
    cashOutValue: number;
    p2pVolume: number;
    p2pValue: number;
    capitalHeld: number;
    capitalRequirement: number;
    complianceStatus: string;
    ipsTransactionVolume?: number;
    ipsTransactionValue?: number;
    namqrMerchantPaymentsVolume?: number;
    namqrMerchantPaymentsValue?: number;
    multiBankPaymentVolume?: number;
    multiBankParticipantCount?: number;
}
interface AgentAnnualReturn {
    agentNumber: number;
    agentName: string;
    locationCity: string;
    locationRegion: string;
    servicesOffered: string[];
    status: 'active' | 'inactive';
    poolAccountBalance: number;
    transactionVolume: number;
    transactionValue: number;
}
export declare class BankOfNamibiaReportingService {
    /**
     * Generate monthly PSP return
     * PSD-3 Section 23: Monthly statistics
     */
    static generateMonthlyReport(reportMonth: Date): Promise<MonthlyReport>;
    /**
     * Submit report to Bank of Namibia
     * PSD-3 Section 23.2: Must reach BoN by 10th of following month
     */
    static submitReportToBoN(reportId: string, submittedBy: string): Promise<void>;
    /**
     * Generate Agent Annual Return (Table 1)
     * PSD-1 Section 16.15: Due by January 31 annually
     * Uses agents and agent_float tables; per-agent transaction volume/value require agent_id on vouchers (not yet in schema).
     */
    static generateAgentAnnualReturn(year: number): Promise<AgentAnnualReturn[]>;
    /**
     * Get pending reports (not yet submitted)
     * PSD-3: Must be submitted by 10th of following month
     */
    static getPendingReports(): Promise<MonthlyReport[]>;
    /**
     * Get report history
     */
    static getReportHistory(months?: number): Promise<MonthlyReport[]>;
    /**
     * Export report in Bank of Namibia format
     * PSD-3: Specific format required
     */
    static exportReportForBoN(reportId: string): Promise<string>;
}
export {};
//# sourceMappingURL=BankOfNamibiaReportingService.d.ts.map