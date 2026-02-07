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

// ============================================================
// PARTICIPANTS (Section 7.2.3)
// ============================================================

export type ParticipantRole = 'DP' | 'TPP';
export type ParticipantStatus = 'active' | 'suspended' | 'revoked';
export type Sector = 'banking' | 'common';
export type Service = 'AIS' | 'PIS' | 'Common';
export type OperationType = 'AIS.Read' | 'PIS.Write' | 'PIS.Read';

export interface OpenBankingParticipant {
  participantId: string; // Format: APInnnnnn
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

// ============================================================
// CONSENT & OAUTH 2.0 (Section 9.5)
// ============================================================

export type ConsentScope = 
  | 'banking:accounts.basic.read'
  | 'banking:payments.write'
  | 'banking:payments.read'
  | 'consent:authorisationcode.write'
  | 'consent:authorisationtoken.write';

export interface PushedAuthorizationRequest {
  participantId: string;
  beneficiaryId: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  scope: string; // Space-separated scopes
  redirectUri: string;
  state?: string;
  nonce?: string;
}

export interface PushedAuthorizationResponse {
  requestUri: string;
  expiresIn: number; // Seconds
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
  code?: string; // For authorization_code grant
  refreshToken?: string; // For refresh_token grant
  redirectUri: string;
  codeVerifier: string; // PKCE verifier
  participantId: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // Seconds
  refreshToken?: string; // Only for long-term consent
  scope: string;
}

export interface ConsentRevocationRequest {
  token: string; // Refresh token to revoke
  tokenTypeHint: 'refresh_token';
}

// ============================================================
// BANKING RESOURCE OBJECTS (Section 9.2.4)
// ============================================================

// Account Types (Section 9.2.4: Supported Account Types)
export type AccountType = 'e-wallet' | 'current' | 'savings' | 'credit_card' | 'loan';
export type AccountStatus = 'open' | 'closed';

export interface Account {
  accountId: string;
  beneficiaryId: string;
  accountType: AccountType;
  accountNumber: string;
  accountName: string;
  currency: string; // ISO 4217
  status: AccountStatus;
  openedDate?: string;
  closedDate?: string;
}

// Balance Types (Section 9.2.4)
export type BalanceType = 'current' | 'available' | 'credit_limit' | 'opening' | 'closing';

export interface Balance {
  balanceId: string;
  accountId: string;
  balanceType: BalanceType;
  amount: string; // Decimal with 2 places: "100.00"
  currency: string;
  asOfDate: string;
}

// Transaction Types (Section 9.2.4)
export type TransactionType = 'debit' | 'credit' | 'fee' | 'interest' | 'transfer';
export type TransactionStatus = 'pending' | 'posted' | 'reversed';

export interface Transaction {
  transactionId: string;
  accountId: string;
  transactionType: TransactionType;
  transactionReference?: string;
  description?: string;
  amount: string; // Decimal with 2 places
  currency: string;
  postingDate: string;
  valueDate?: string;
  balanceAfter?: string;
  status: TransactionStatus;
  merchantName?: string;
  merchantCategory?: string;
}

// Payment Types (Section 9.2.4: Supported Payment Types)
export type PaymentType = 'on-us' | 'eft-enhanced' | 'eft-nrtc';
export type PaymentStatus = 
  | 'pending' 
  | 'accepted' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'rejected';

export interface Payment {
  paymentId: string;
  participantId: string;
  beneficiaryId: string; // Payer
  debtorAccountId: string;
  paymentType: PaymentType;
  creditorName: string;
  creditorAccount: string;
  creditorBankCode?: string;
  amount: string; // Decimal with 2 places
  currency: string;
  reference?: string;
  description?: string;
  status: PaymentStatus;
  statusReason?: string;
  instructionId?: string; // TPP's reference
  endToEndId?: string; // Payment system reference
  initiatedAt: string;
  acceptedAt?: string;
  completedAt?: string;
  failedAt?: string;
}

export interface Beneficiary {
  beneficiaryPayeeId: string;
  beneficiaryId: string; // Account Holder
  accountId: string;
  payeeName: string;
  payeeAccount: string;
  payeeBankCode?: string;
  payeeReference?: string;
  isFavorite: boolean;
}

// ============================================================
// API RESPONSE FORMATS (Section 9.1.8)
// ============================================================

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

// ============================================================
// API REQUEST/RESPONSE DTOs
// ============================================================

export interface ListAccountsRequest {
  beneficiaryId: string;
  status?: AccountStatus; // Filter by open/closed
}

export interface GetAccountBalanceRequest {
  accountId: string;
}

export interface ListTransactionsRequest {
  accountId: string;
  fromDate?: string; // ISO date
  toDate?: string; // ISO date
  page?: number;
  pageSize?: number; // Max 1000 per standards
}

export interface MakePaymentRequest {
  debtorAccountId: string;
  paymentType: PaymentType;
  creditorName: string;
  creditorAccount: string;
  creditorBankCode?: string;
  amount: string; // Format: "100.00"
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

// ============================================================
// API AUDIT & LOGGING
// ============================================================

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
