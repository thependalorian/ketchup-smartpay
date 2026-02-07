/**
 * Namibian Open Banking Types
 *
 * Location: shared/types/openBanking.ts
 * Purpose: TypeScript types for Namibian Open Banking Standards v1.0
 *
 * Standards Reference:
 * - Section 7: Definitions & Terminology
 * - Section 9.2: API Use Cases
 * - Section 9.5: Consent Standards
 */
export type ParticipantRole = 'DP' | 'TPP';
export type ParticipantStatus = 'active' | 'suspended' | 'revoked';
export type Sector = 'banking' | 'common';
export type Service = 'AIS' | 'PIS' | 'Common';
export type OperationType = 'AIS.Read' | 'PIS.Write' | 'PIS.Read';
export interface OpenBankingParticipant {
    participantId: string;
    participantName: string;
    participantRole: ParticipantRole;
    status: ParticipantStatus;
    sectors: Sector[];
    services: Service[];
    contactEmail?: string;
    contactUrl?: string;
    certificateThumbprint?: string;
    registeredAt: string;
    lastActive?: string;
}
export type ConsentScope = 'banking:accounts.basic.read' | 'banking:payments.write' | 'banking:payments.read' | 'consent:authorisationcode.write' | 'consent:authorisationtoken.write';
export interface PushedAuthorizationRequest {
    participantId: string;
    beneficiaryId: string;
    codeChallenge: string;
    codeChallengeMethod: 'S256';
    scope: string;
    redirectUri: string;
    state?: string;
    nonce?: string;
}
export interface PushedAuthorizationResponse {
    requestUri: string;
    expiresIn: number;
}
export interface AuthorizationCode {
    code: string;
    requestUri: string;
    participantId: string;
    beneficiaryId: string;
    scope: string;
    expiresAt: string;
}
export interface TokenRequest {
    grantType: 'authorization_code' | 'refresh_token';
    code?: string;
    refreshToken?: string;
    redirectUri: string;
    codeVerifier: string;
    participantId: string;
}
export interface TokenResponse {
    accessToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
    refreshToken?: string;
    scope: string;
}
export interface ConsentRevocationRequest {
    token: string;
    tokenTypeHint: 'refresh_token';
}
export type AccountType = 'e-wallet' | 'current' | 'savings' | 'credit_card' | 'loan';
export type AccountStatus = 'open' | 'closed';
export interface Account {
    accountId: string;
    beneficiaryId: string;
    accountType: AccountType;
    accountNumber: string;
    accountName: string;
    currency: string;
    status: AccountStatus;
    openedDate?: string;
    closedDate?: string;
}
export type BalanceType = 'current' | 'available' | 'credit_limit' | 'opening' | 'closing';
export interface Balance {
    balanceId: string;
    accountId: string;
    balanceType: BalanceType;
    amount: string;
    currency: string;
    asOfDate: string;
}
export type TransactionType = 'debit' | 'credit' | 'fee' | 'interest' | 'transfer';
export type TransactionStatus = 'pending' | 'posted' | 'reversed';
export interface Transaction {
    transactionId: string;
    accountId: string;
    transactionType: TransactionType;
    transactionReference?: string;
    description?: string;
    amount: string;
    currency: string;
    postingDate: string;
    valueDate?: string;
    balanceAfter?: string;
    status: TransactionStatus;
    merchantName?: string;
    merchantCategory?: string;
}
export type PaymentType = 'on-us' | 'eft-enhanced' | 'eft-nrtc';
export type PaymentStatus = 'pending' | 'accepted' | 'processing' | 'completed' | 'failed' | 'rejected';
export interface Payment {
    paymentId: string;
    participantId: string;
    beneficiaryId: string;
    debtorAccountId: string;
    paymentType: PaymentType;
    creditorName: string;
    creditorAccount: string;
    creditorBankCode?: string;
    amount: string;
    currency: string;
    reference?: string;
    description?: string;
    status: PaymentStatus;
    statusReason?: string;
    instructionId?: string;
    endToEndId?: string;
    initiatedAt: string;
    acceptedAt?: string;
    completedAt?: string;
    failedAt?: string;
}
export interface Beneficiary {
    beneficiaryPayeeId: string;
    beneficiaryId: string;
    accountId: string;
    payeeName: string;
    payeeAccount: string;
    payeeBankCode?: string;
    payeeReference?: string;
    isFavorite: boolean;
}
export interface OpenBankingAPIResponse<T> {
    data: T;
    links?: {
        first?: string;
        last?: string;
        prev?: string;
        next?: string;
    };
    meta?: {
        totalRecords?: number;
        totalPages?: number;
    };
}
export interface OpenBankingErrorResponse {
    errors: Array<{
        code: string;
        title: string;
        detail: string;
        source?: {
            pointer?: string;
            parameter?: string;
        };
    }>;
}
export interface ListAccountsRequest {
    beneficiaryId: string;
    status?: AccountStatus;
}
export interface GetAccountBalanceRequest {
    accountId: string;
}
export interface ListTransactionsRequest {
    accountId: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
}
export interface MakePaymentRequest {
    debtorAccountId: string;
    paymentType: PaymentType;
    creditorName: string;
    creditorAccount: string;
    creditorBankCode?: string;
    amount: string;
    currency: string;
    reference?: string;
    description?: string;
    instructionId?: string;
}
export interface GetPaymentStatusRequest {
    paymentId: string;
}
export interface ListBeneficiariesRequest {
    accountId: string;
}
export interface APILogEntry {
    participantId?: string;
    beneficiaryId?: string;
    endpoint: string;
    httpMethod: string;
    httpStatus: number;
    responseTimeMs: number;
    errorCode?: string;
    ipAddress?: string;
    userAgent?: string;
}
//# sourceMappingURL=openBanking.d.ts.map