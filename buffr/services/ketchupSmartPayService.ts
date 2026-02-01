/**
 * Ketchup SmartPay Service
 * 
 * Location: services/ketchupSmartPayService.ts
 * Purpose: Real-time API integration with Ketchup SmartPay system (Priority 3 - Critical Foundation)
 * 
 * Ketchup SmartPay System:
 * - Holds the beneficiary database (source of truth)
 * - Manages biometric verification
 * - Issues vouchers to beneficiaries
 * - Tracks voucher lifecycle
 * 
 * Real-Time Communication:
 * - SmartPay → Buffr: Voucher issuance, beneficiary data sync
 * - Buffr → SmartPay: Voucher status updates, verification confirmations, redemption status
 * 
 * All API calls are logged to api_sync_audit_logs table for complete traceability.
 */

import { logAPISyncOperation } from '@/utils/auditLogger';
import { generateRequestId } from '@/utils/auditLogger';
import { log } from '@/utils/logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

const KETCHUP_SMARTPAY_API_URL = process.env.KETCHUP_SMARTPAY_API_URL || 'https://api.ketchup.cc';
const KETCHUP_SMARTPAY_API_KEY = process.env.KETCHUP_SMARTPAY_API_KEY || '';
const KETCHUP_SMARTPAY_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// TYPES
// ============================================================================

export interface SmartPayBeneficiary {
  beneficiary_id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  national_id?: string;
  date_of_birth?: string;
  address?: string;
  grant_type?: string;
  enrollment_date?: string;
  biometric_enrolled: boolean;
  account_status: 'active' | 'inactive' | 'suspended';
}

export interface SmartPayVoucher {
  voucher_id: string;
  beneficiary_id: string;
  amount: number;
  grant_type: string;
  batch_id: string;
  expiry_date: string;
  issuer: string;
  verification_required: boolean;
  metadata?: Record<string, any>;
}

export interface SmartPayVoucherStatus {
  voucher_id: string;
  status: 'issued' | 'verified' | 'redeemed' | 'expired' | 'cancelled';
  beneficiary_id: string;
  amount?: number;
  redemption_method?: string;
  settlement_reference?: string;
  timestamp: string;
}

export interface SmartPayVerificationConfirmation {
  beneficiary_id: string;
  voucher_id?: string;
  biometric_verification_id: string;
  verification_status: 'verified' | 'failed';
  verification_location: string;
  staff_id?: string;
  timestamp: string;
}

export interface SmartPayResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// API CLIENT
// ============================================================================

/**
 * Make API call to Ketchup SmartPay
 */
async function callSmartPayAPI<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  payload?: any,
  options?: {
    requestId?: string;
    beneficiaryId?: string;
    voucherId?: string;
    userId?: string;
  }
): Promise<SmartPayResponse<T>> {
  const requestId = options?.requestId || generateRequestId();
  const startTime = Date.now();
  const url = `${KETCHUP_SMARTPAY_API_URL}${endpoint}`;

  let response: Response;
  let responseTime: number;
  let success = false;
  let errorMessage: string | undefined;

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': KETCHUP_SMARTPAY_API_KEY,
      'X-Request-ID': requestId,
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(KETCHUP_SMARTPAY_TIMEOUT),
    };

    if (payload && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = JSON.stringify(payload);
    }

    response = await fetch(url, fetchOptions);
    responseTime = Date.now() - startTime;
    const statusCode = response.status;
    success = response.ok;

    let responseData: any;
    try {
      responseData = await response.json();
    } catch (error) {
      responseData = { message: await response.text() };
    }

    // Log API sync operation (outbound: Buffr → SmartPay)
    await logAPISyncOperation({
      direction: 'outbound',
      endpoint,
      method,
      request_payload: payload,
      response_payload: responseData,
      status_code: statusCode,
      response_time_ms: responseTime,
      success,
      error_message: success ? null : responseData.error || responseData.message || `HTTP ${statusCode}`,
      beneficiary_id: options?.beneficiaryId,
      voucher_id: options?.voucherId,
      user_id: options?.userId,
      request_id: requestId,
    }).catch(err => {
      log.error('Failed to log API sync operation:', err);
    });

    if (!success) {
      errorMessage = responseData.error || responseData.message || `HTTP ${statusCode}`;
      return {
        success: false,
        error: errorMessage,
      };
    }

    return {
      success: true,
      data: responseData.data || responseData,
      message: responseData.message,
    };
  } catch (error) {
    responseTime = Date.now() - startTime;
    errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log failed API sync operation
    await logAPISyncOperation({
      direction: 'outbound',
      endpoint,
      method,
      request_payload: payload,
      response_payload: null,
      status_code: 0,
      response_time_ms: responseTime,
      success: false,
      error_message: errorMessage,
      beneficiary_id: options?.beneficiaryId,
      voucher_id: options?.voucherId,
      user_id: options?.userId,
      request_id: requestId,
    }).catch(err => {
      log.error('Failed to log API sync operation for error:', err);
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ============================================================================
// BENEFICIARY OPERATIONS
// ============================================================================

/**
 * Lookup beneficiary by ID or phone number
 */
export async function lookupBeneficiary(
  identifier: { beneficiaryId?: string; phoneNumber?: string },
  requestId?: string
): Promise<SmartPayResponse<SmartPayBeneficiary>> {
  const endpoint = identifier.beneficiaryId
    ? `/api/v1/beneficiaries/${identifier.beneficiaryId}`
    : `/api/v1/beneficiaries/phone/${identifier.phoneNumber}`;

  return await callSmartPayAPI<SmartPayBeneficiary>(
    endpoint,
    'GET',
    undefined,
    {
      requestId,
      beneficiaryId: identifier.beneficiaryId,
    }
  );
}

/**
 * Verify beneficiary exists and is active
 */
export async function verifyBeneficiary(
  beneficiaryId: string,
  requestId?: string
): Promise<SmartPayResponse<{ verified: boolean; beneficiary: SmartPayBeneficiary }>> {
  const result = await lookupBeneficiary({ beneficiaryId }, requestId);

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error || 'Beneficiary not found',
    };
  }

  return {
    success: true,
    data: {
      verified: result.data.account_status === 'active',
      beneficiary: result.data,
    },
  };
}

// ============================================================================
// VOUCHER STATUS UPDATES (Buffr → SmartPay)
// ============================================================================

/**
 * Update voucher status in SmartPay system (real-time)
 * 
 * Called when voucher status changes in Buffr:
 * - Voucher verified (after NamPost verification)
 * - Voucher redeemed
 * - Voucher expired
 * - Voucher cancelled
 */
export async function updateVoucherStatus(
  status: SmartPayVoucherStatus,
  requestId?: string
): Promise<SmartPayResponse> {
  return await callSmartPayAPI(
    `/api/v1/vouchers/${status.voucher_id}/status`,
    'PUT',
    {
      status: status.status,
      beneficiary_id: status.beneficiary_id,
      amount: status.amount,
      redemption_method: status.redemption_method,
      settlement_reference: status.settlement_reference,
      timestamp: status.timestamp,
    },
    {
      requestId,
      voucherId: status.voucher_id,
      beneficiaryId: status.beneficiary_id,
    }
  );
}

/**
 * Send verification confirmation to SmartPay (real-time)
 * 
 * Called after NamPost verification:
 * - Biometric verification completed
 * - Voucher verification completed
 * - Funds credited to wallet
 */
export async function sendVerificationConfirmation(
  confirmation: SmartPayVerificationConfirmation,
  requestId?: string
): Promise<SmartPayResponse> {
  return await callSmartPayAPI(
    `/api/v1/verifications/confirm`,
    'POST',
    {
      beneficiary_id: confirmation.beneficiary_id,
      voucher_id: confirmation.voucher_id,
      biometric_verification_id: confirmation.biometric_verification_id,
      verification_status: confirmation.verification_status,
      verification_location: confirmation.verification_location,
      staff_id: confirmation.staff_id,
      timestamp: confirmation.timestamp,
    },
    {
      requestId,
      beneficiaryId: confirmation.beneficiary_id,
      voucherId: confirmation.voucher_id,
    }
  );
}

/**
 * Notify SmartPay of account creation (real-time)
 * 
 * Called when Buffr account is created for a beneficiary:
 * - Account linked to SmartPay beneficiary ID
 * - Account status: "active"
 * - Ready to receive vouchers
 */
export async function notifyAccountCreation(
  beneficiaryId: string,
  buffrUserId: string,
  phoneNumber: string,
  requestId?: string
): Promise<SmartPayResponse> {
  return await callSmartPayAPI(
    `/api/v1/beneficiaries/${beneficiaryId}/account-created`,
    'POST',
    {
      buffr_user_id: buffrUserId,
      phone_number: phoneNumber,
      account_status: 'active',
      timestamp: new Date().toISOString(),
    },
    {
      requestId,
      beneficiaryId,
      userId: buffrUserId,
    }
  );
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

/**
 * Retry API call with exponential backoff
 */
async function retryAPICall<T>(
  apiCall: () => Promise<SmartPayResponse<T>>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<SmartPayResponse<T>> {
  let lastError: SmartPayResponse<T> | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await apiCall();

    if (result.success) {
      return result;
    }

    lastError = result;

    // Don't retry on client errors (4xx)
    if (result.error?.includes('HTTP 4')) {
      break;
    }

    // Exponential backoff
    if (attempt < maxRetries - 1) {
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return lastError || { success: false, error: 'Max retries exceeded' };
}

/**
 * Update voucher status with retry logic
 */
export async function updateVoucherStatusWithRetry(
  status: SmartPayVoucherStatus,
  requestId?: string
): Promise<SmartPayResponse> {
  return await retryAPICall(() => updateVoucherStatus(status, requestId));
}

/**
 * Send verification confirmation with retry logic
 */
export async function sendVerificationConfirmationWithRetry(
  confirmation: SmartPayVerificationConfirmation,
  requestId?: string
): Promise<SmartPayResponse> {
  return await retryAPICall(() => sendVerificationConfirmation(confirmation, requestId));
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Check SmartPay API health
 */
export async function checkSmartPayHealth(): Promise<{ healthy: boolean; responseTime?: number; error?: string }> {
  const startTime = Date.now();
  try {
    const response = await fetch(`${KETCHUP_SMARTPAY_API_URL}/api/v1/health`, {
      method: 'GET',
      headers: {
        'X-API-Key': KETCHUP_SMARTPAY_API_KEY,
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout for health check
    });

    const responseTime = Date.now() - startTime;
    const healthy = response.ok;

    return {
      healthy,
      responseTime,
      error: healthy ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      healthy: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const ketchupSmartPayService = {
  lookupBeneficiary,
  verifyBeneficiary,
  updateVoucherStatus,
  updateVoucherStatusWithRetry,
  sendVerificationConfirmation,
  sendVerificationConfirmationWithRetry,
  notifyAccountCreation,
  checkSmartPayHealth,
};

export default ketchupSmartPayService;
