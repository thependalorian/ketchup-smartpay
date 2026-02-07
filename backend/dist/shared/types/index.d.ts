/**
 * Shared Types for Ketchup SmartPay
 *
 * Location: shared/types/index.ts
 * Purpose: Common TypeScript types shared between frontend and backend
 */
export declare const NAMIBIAN_REGIONS: readonly ["Khomas", "Erongo", "Oshana", "Omusati", "Ohangwena", "Oshikoto", "Kavango East", "Kavango West", "Zambezi", "Kunene", "Otjozondjupa", "Omaheke", "Hardap", "Karas"];
export type Region = typeof NAMIBIAN_REGIONS[number];
/** Proxy relationship to beneficiary (authorised collector; account stays with beneficiary). */
export type ProxyRelationship = 'family' | 'caregiver' | 'guardian';
export interface Beneficiary {
    id: string;
    name: string;
    phone: string;
    /** National ID number (e.g. Namibian 11-digit ID). */
    idNumber?: string;
    region: Region;
    grantType: 'social_grant' | 'subsidy' | 'pension' | 'disability';
    status: 'active' | 'suspended' | 'pending' | 'deceased';
    enrolledAt: string;
    lastPayment: string;
    /** ISO date when beneficiary was marked deceased (if status is deceased). */
    deceasedAt?: string;
    /** Proxy collector (authorised to collect on behalf; account still belongs to beneficiary). */
    proxyName?: string;
    proxyIdNumber?: string;
    proxyPhone?: string;
    proxyRelationship?: ProxyRelationship;
    proxyAuthorisedAt?: string;
}
/** Dependant relationship to beneficiary. */
export type DependantRelationship = 'child' | 'spouse' | 'guardian' | 'other';
export interface Dependant {
    id: string;
    beneficiaryId: string;
    name: string;
    idNumber?: string;
    phone?: string;
    relationship: DependantRelationship;
    dateOfBirth?: string;
    isProxy: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface CreateDependantDTO {
    name: string;
    idNumber?: string;
    phone?: string;
    relationship: DependantRelationship;
    dateOfBirth?: string;
    isProxy?: boolean;
}
export interface UpdateDependantDTO {
    name?: string;
    idNumber?: string;
    phone?: string;
    relationship?: DependantRelationship;
    dateOfBirth?: string;
    isProxy?: boolean;
}
export interface CreateBeneficiaryDTO {
    name: string;
    phone: string;
    /** National ID number (e.g. Namibian 11-digit ID). */
    idNumber?: string;
    region: Region;
    grantType: 'social_grant' | 'subsidy' | 'pension' | 'disability';
    status?: 'active' | 'suspended' | 'pending';
    /** Optional proxy collector (authorised to collect on behalf). */
    proxyName?: string;
    proxyIdNumber?: string;
    proxyPhone?: string;
    proxyRelationship?: ProxyRelationship;
}
export interface UpdateBeneficiaryDTO {
    name?: string;
    phone?: string;
    idNumber?: string;
    region?: Region;
    grantType?: 'social_grant' | 'subsidy' | 'pension' | 'disability';
    status?: 'active' | 'suspended' | 'pending' | 'deceased';
    /** ISO date when beneficiary was marked deceased (required when status is deceased). */
    deceasedAt?: string;
    proxyName?: string;
    proxyIdNumber?: string;
    proxyPhone?: string;
    proxyRelationship?: ProxyRelationship;
}
export interface BeneficiaryFilters {
    region?: Region;
    grantType?: 'social_grant' | 'subsidy' | 'pension' | 'disability';
    status?: 'active' | 'suspended' | 'pending';
    search?: string;
    /** Search by ID number (partial or full). */
    idNumber?: string;
}
export interface Voucher {
    id: string;
    beneficiaryId: string;
    beneficiaryName: string;
    /** Buffr wallet/user UUID – voucher is issued to this Buffr account when distributing. */
    buffrUserId?: string;
    amount: number;
    grantType: string;
    status: VoucherStatus;
    issuedAt: string;
    expiryDate: string;
    redeemedAt?: string;
    redemptionMethod?: 'wallet' | 'cash_out' | 'merchant_payment';
    region: Region;
    voucherCode?: string;
    qrCode?: string;
}
/** Allowed grant types for voucher issuance */
export declare const VOUCHER_GRANT_TYPES: readonly ["social_grant", "subsidy", "pension", "disability"];
export type VoucherGrantType = (typeof VOUCHER_GRANT_TYPES)[number];
export interface IssueVoucherDTO {
    /** Required. Every voucher is assigned to a beneficiary by Ketchup. */
    beneficiaryId: string;
    /** Required. Must be > 0 (NAD). */
    amount: number;
    /** Required. One of social_grant, subsidy, pension, disability. */
    grantType: string;
    /** Optional. Days until expiry from issue date; default by grant type. Must be > 0 if set. */
    expiryDays?: number;
    /** Optional. ISO date (YYYY-MM-DD) or datetime for scheduled issuance; must not be in the past. */
    scheduledIssueAt?: string;
    /** Optional. Buffr wallet/user UUID – when distributing to Buffr, voucher is credited to this account. */
    buffrUserId?: string;
}
export interface IssueBatchDTO {
    vouchers: IssueVoucherDTO[];
    batchId?: string;
}
export interface VoucherFilters {
    beneficiaryId?: string;
    region?: Region;
    grantType?: string;
    status?: VoucherStatus;
    search?: string;
    /** YYYY-MM-DD: only vouchers issued on this date (for reconciliation) */
    issuedDate?: string;
}
export interface Agent {
    id: string;
    name: string;
    type: 'small' | 'medium' | 'large' | 'mobile_unit';
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
export type VoucherStatus = 'issued' | 'delivered' | 'redeemed' | 'expired' | 'cancelled' | 'failed';
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
    /** Count of beneficiaries with status deceased (for reporting). */
    deceasedBeneficiaries?: number;
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
export * from './entities';
export * from './compliance';
export * from './openBanking';
//# sourceMappingURL=index.d.ts.map