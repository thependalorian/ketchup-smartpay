/**
 * Open Banking API Service
 * 
 * Location: src/services/openBankingAPI.ts
 * Purpose: Frontend service for calling Open Banking APIs
 * Standards: Namibian Open Banking Standards v1.0
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';

interface APIResponse<T> {
  data?: T;
  errors?: Array<{
    code: string;
    title: string;
    detail: string;
  }>;
  links?: Record<string, string>;
  meta?: Record<string, any>;
}

// ============================================================
// OAuth & Consent Services
// ============================================================

export interface PARRequest {
  participantId: string;
  beneficiaryId: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  scope: string;
  redirectUri: string;
  state?: string;
  nonce?: string;
}

export interface PARResponse {
  requestUri: string;
  expiresIn: number;
}

export interface TokenRequest {
  grantType: 'authorization_code' | 'refresh_token';
  code?: string;
  refreshToken?: string;
  codeVerifier?: string;
  participantId: string;
  redirectUri?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

/**
 * Create Pushed Authorization Request
 */
export async function createPAR(request: PARRequest): Promise<PARResponse> {
  const response = await fetch(`${API_BASE_URL}/bon/v1/common/par`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const data: APIResponse<PARResponse> = await response.json();

  if (!response.ok || data.errors) {
    throw new Error(data.errors?.[0]?.detail || 'Failed to create PAR');
  }

  return data.data!;
}

/**
 * Create Authorization Code
 */
export async function createAuthorizationCode(
  requestUri: string,
  beneficiaryId: string
): Promise<{ code: string; state?: string }> {
  const response = await fetch(`${API_BASE_URL}/bon/v1/common/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestUri, beneficiaryId }),
  });

  const data: APIResponse<{ code: string; state?: string }> = await response.json();

  if (!response.ok || data.errors) {
    throw new Error(data.errors?.[0]?.detail || 'Failed to create authorization code');
  }

  return data.data!;
}

/**
 * Exchange code for tokens or refresh access token
 */
export async function exchangeToken(request: TokenRequest): Promise<TokenResponse> {
  const response = await fetch(`${API_BASE_URL}/bon/v1/common/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to exchange token');
  }

  return await response.json();
}

/**
 * Revoke refresh token
 */
export async function revokeToken(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/bon/v1/common/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, tokenTypeHint: 'refresh_token' }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to revoke token');
  }
}

// ============================================================
// Account Information Services (AIS)
// ============================================================

export interface Account {
  accountId: string;
  beneficiaryId: string;
  accountType: string;
  accountNumber: string;
  accountName: string;
  currency: string;
  status: string;
  openedDate?: string;
}

export interface Balance {
  balanceId: string;
  accountId: string;
  balanceType: string;
  amount: string;
  currency: string;
  asOfDate: string;
}

export interface Transaction {
  transactionId: string;
  accountId: string;
  transactionType: string;
  transactionReference?: string;
  description?: string;
  amount: string;
  currency: string;
  postingDate: string;
  valueDate?: string;
  balanceAfter?: string;
  status: string;
  merchantName?: string;
}

/**
 * List Accounts (AIS Use Case #1)
 */
export async function listAccounts(
  accessToken: string,
  participantId: string,
  status?: 'open' | 'closed'
): Promise<Account[]> {
  const url = new URL(`${API_BASE_URL}/bon/v1/banking/accounts`);
  if (status) url.searchParams.set('status', status);

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'ParticipantId': participantId,
      'x-v': '1',
    },
  });

  const data: APIResponse<Account[]> = await response.json();

  if (!response.ok || data.errors) {
    throw new Error(data.errors?.[0]?.detail || 'Failed to list accounts');
  }

  return data.data!;
}

/**
 * Get Account Balance (AIS Use Case #2)
 */
export async function getAccountBalance(
  accessToken: string,
  participantId: string,
  accountId: string
): Promise<Balance[]> {
  const response = await fetch(
    `${API_BASE_URL}/bon/v1/banking/accounts/${accountId}/balance`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'ParticipantId': participantId,
        'x-v': '1',
      },
    }
  );

  const data: APIResponse<Balance[]> = await response.json();

  if (!response.ok || data.errors) {
    throw new Error(data.errors?.[0]?.detail || 'Failed to get balance');
  }

  return data.data!;
}

/**
 * List Transactions (AIS Use Case #3)
 */
export async function listTransactions(
  accessToken: string,
  participantId: string,
  accountId: string,
  options?: {
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<{
  transactions: Transaction[];
  totalRecords: number;
  totalPages: number;
}> {
  const url = new URL(`${API_BASE_URL}/bon/v1/banking/accounts/${accountId}/transactions`);
  if (options?.fromDate) url.searchParams.set('fromDate', options.fromDate);
  if (options?.toDate) url.searchParams.set('toDate', options.toDate);
  if (options?.page) url.searchParams.set('page', options.page.toString());
  if (options?.pageSize) url.searchParams.set('pageSize', options.pageSize.toString());

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'ParticipantId': participantId,
      'x-v': '1',
    },
  });

  const data: APIResponse<Transaction[]> = await response.json();

  if (!response.ok || data.errors) {
    throw new Error(data.errors?.[0]?.detail || 'Failed to list transactions');
  }

  return {
    transactions: data.data!,
    totalRecords: data.meta?.totalRecords || 0,
    totalPages: data.meta?.totalPages || 0,
  };
}

// ============================================================
// Payment Initiation Services (PIS)
// ============================================================

export interface PaymentRequest {
  debtorAccountId: string;
  paymentType: 'on-us' | 'eft-enhanced' | 'eft-nrtc';
  creditorName: string;
  creditorAccount: string;
  creditorBankCode?: string;
  amount: string;
  currency?: string;
  reference?: string;
  description?: string;
  instructionId?: string;
}

export interface Payment {
  paymentId: string;
  participantId: string;
  beneficiaryId: string;
  debtorAccountId: string;
  paymentType: string;
  creditorName: string;
  creditorAccount: string;
  amount: string;
  currency: string;
  reference?: string;
  description?: string;
  status: string;
  statusReason?: string;
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
  isFavorite: boolean;
}

/**
 * Make Payment (PIS Use Case #1)
 */
export async function makePayment(
  accessToken: string,
  participantId: string,
  request: PaymentRequest
): Promise<Payment> {
  const response = await fetch(`${API_BASE_URL}/bon/v1/banking/payments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'ParticipantId': participantId,
      'x-v': '1',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data: APIResponse<Payment> = await response.json();

  if (!response.ok || data.errors) {
    throw new Error(data.errors?.[0]?.detail || 'Failed to make payment');
  }

  return data.data!;
}

/**
 * Get Payment Status (PIS Use Case #3)
 */
export async function getPaymentStatus(
  accessToken: string,
  participantId: string,
  paymentId: string
): Promise<Payment> {
  const response = await fetch(
    `${API_BASE_URL}/bon/v1/banking/payments/${paymentId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'ParticipantId': participantId,
        'x-v': '1',
      },
    }
  );

  const data: APIResponse<Payment> = await response.json();

  if (!response.ok || data.errors) {
    throw new Error(data.errors?.[0]?.detail || 'Failed to get payment status');
  }

  return data.data!;
}

/**
 * List Beneficiaries (PIS Use Case #2)
 */
export async function listBeneficiaries(
  accessToken: string,
  participantId: string,
  accountId: string
): Promise<Beneficiary[]> {
  const response = await fetch(
    `${API_BASE_URL}/bon/v1/banking/accounts/${accountId}/beneficiaries`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'ParticipantId': participantId,
        'x-v': '1',
      },
    }
  );

  const data: APIResponse<Beneficiary[]> = await response.json();

  if (!response.ok || data.errors) {
    throw new Error(data.errors?.[0]?.detail || 'Failed to list beneficiaries');
  }

  return data.data!;
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Generate PKCE code verifier
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate PKCE code challenge from verifier
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Format amount with 2 decimal places (Section 9.1.3)
 */
export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Parse amount from string
 */
export function parseAmount(amount: string): number {
  return parseFloat(amount);
}

/**
 * Format currency
 */
export function formatCurrency(amount: string, currency: string = 'NAD'): string {
  return `${currency} ${parseFloat(amount).toLocaleString('en-NA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
