/**
 * Shared Types for Ketchup SmartPay
 *
 * Location: shared/types/index.ts
 * Purpose: Common TypeScript types shared between frontend and backend
 */
export declare const NAMIBIAN_REGIONS: readonly ["Khomas", "Erongo", "Oshana", "Omusati", "Ohangwena", "Oshikoto", "Kavango East", "Kavango West", "Zambezi", "Kunene", "Otjozondjupa", "Omaheke", "Hardap", "Karas"];
export type Region = typeof NAMIBIAN_REGIONS[number];
export interface Beneficiary {
    id: string;
    name: string;
    phone: string;
    region: Region;
    grantType: 'social_grant' | 'subsidy' | 'pension' | 'disability';
    status: 'active' | 'suspended' | 'pending';
    enrolledAt: string;
    lastPayment: string;
}
export interface CreateBeneficiaryDTO {
    name: string;
    phone: string;
    region: Region;
    grantType: 'social_grant' | 'subsidy' | 'pension' | 'disability';
    status?: 'active' | 'suspended' | 'pending';
}
export interface UpdateBeneficiaryDTO {
    name?: string;
    phone?: string;
    region?: Region;
    grantType?: 'social_grant' | 'subsidy' | 'pension' | 'disability';
    status?: 'active' | 'suspended' | 'pending';
}
export interface BeneficiaryFilters {
    region?: Region;
    grantType?: 'social_grant' | 'subsidy' | 'pension' | 'disability';
    status?: 'active' | 'suspended' | 'pending';
    search?: string;
}
export interface Voucher {
    id: string;
    beneficiaryId: string;
    beneficiaryName: string;
    amount: number;
    grantType: string;
    status: 'issued' | 'delivered' | 'redeemed' | 'expired' | 'cancelled';
    issuedAt: string;
    expiryDate: string;
    redeemedAt?: string;
    redemptionMethod?: 'wallet' | 'cash_out' | 'merchant_payment';
    region: Region;
    voucherCode?: string;
    qrCode?: string;
}
export interface IssueVoucherDTO {
    beneficiaryId: string;
    amount: number;
    grantType: string;
    expiryDays?: number;
}
export interface IssueBatchDTO {
    vouchers: IssueVoucherDTO[];
    batchId?: string;
}
export interface VoucherFilters {
    beneficiaryId?: string;
    region?: Region;
    grantType?: string;
    status?: 'issued' | 'delivered' | 'redeemed' | 'expired' | 'cancelled';
    search?: string;
}
export interface Agent {
    id: string;
    name: string;
    type: 'small' | 'medium' | 'large';
    region: Region;
    status: 'active' | 'inactive' | 'low_liquidity';
    liquidity: number;
    transactionsToday: number;
    volumeToday: number;
    successRate: number;
}
export interface AgentFilters {
    region?: Region;
    type?: 'small' | 'medium' | 'large';
    status?: 'active' | 'inactive' | 'low_liquidity';
    search?: string;
}
export interface DistributionResult {
    success: boolean;
    voucherId: string;
    channel: 'buffr_api' | 'sms' | 'ussd';
    deliveryId?: string;
    error?: string;
    timestamp: string;
}
export interface BatchResult {
    total: number;
    successful: number;
    failed: number;
    results: DistributionResult[];
}
export type VoucherStatus = 'issued' | 'delivered' | 'redeemed' | 'expired' | 'cancelled';
export interface StatusEvent {
    voucherId: string;
    status: VoucherStatus;
    timestamp: string;
    metadata?: Record<string, any>;
}
export interface AnalyticsFilters {
    region?: Region;
    startDate?: string;
    endDate?: string;
    grantType?: string;
}
export interface RegionalAnalytics {
    region: Region;
    totalVouchers: number;
    redeemed: number;
    expired: number;
    totalAmount: number;
}
export interface RedemptionAnalytics {
    totalRedemptions: number;
    byMethod: {
        wallet: number;
        cash_out: number;
        merchant_payment: number;
    };
    byRegion: RegionalAnalytics[];
}
export interface DashboardMetrics {
    totalBeneficiaries: number;
    activeBeneficiaries: number;
    totalVouchersIssued: number;
    vouchersRedeemed: number;
    vouchersExpired: number;
    totalDisbursement: number;
    monthlyDisbursement: number;
    activeAgents: number;
    totalAgents: number;
    networkHealthScore: number;
}
export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
//# sourceMappingURL=index.d.ts.map