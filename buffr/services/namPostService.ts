/**
 * NamPost Service
 * 
 * Location: services/namPostService.ts
 * Purpose: Integration with NamPost for voucher redemption and cash-out services
 * 
 * NamPost Infrastructure:
 * - 137-147 post offices and agents nationwide
 * - Mobile teams for beneficiaries >5km from branches
 * - Biometric verification (via Ketchup SmartPay)
 * - Cash-out services for voucher redemption
 * 
 * Integration Points:
 * - Voucher verification at NamPost branches
 * - Cash-out processing
 * - PIN setup/reset (in-person at NamPost)
 * - Account activation
 * - Onboarding support
 */

import { logAPISyncOperation, generateRequestId } from '@/utils/auditLogger';
import { log } from '@/utils/logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

const NAMPOST_API_URL = process.env.NAMPOST_API_URL || 'https://api.nampost.com.na/v1';
const NAMPOST_API_KEY = process.env.NAMPOST_API_KEY || '';
const NAMPOST_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// TYPES
// ============================================================================

export interface NamPostBranch {
  branchId: string;
  name: string;
  address: string;
  city: string;
  region: string;
  phoneNumber?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  services: string[]; // ['voucher_redemption', 'cash_out', 'onboarding', 'pin_reset']
  operatingHours?: {
    weekdays: string;
    saturday?: string;
    sunday?: string;
  };
}

export interface NamPostCashOutRequest {
  voucherId: string;
  beneficiaryId: string;
  amount: number;
  branchId: string;
  staffId: string; // NamPost staff member ID
  biometricVerified: boolean; // Fingerprint/ID verification completed
  verificationMethod: 'fingerprint' | 'id_card' | 'both';
}

export interface NamPostCashOutResponse {
  transactionId: string;
  status: 'completed' | 'pending' | 'failed';
  cashDispensed: boolean;
  receiptNumber?: string;
  timestamp: string;
  message?: string;
}

export interface NamPostPINResetRequest {
  beneficiaryId: string;
  branchId: string;
  staffId: string;
  biometricVerified: boolean;
  newPIN?: string; // If provided, staff sets PIN; otherwise, user sets via USSD/app
}

export interface NamPostPINResetResponse {
  success: boolean;
  message: string;
  requiresUserSetup?: boolean; // If true, user must set PIN via USSD/app
}

export interface NamPostOnboardingRequest {
  beneficiaryId: string; // From Ketchup SmartPay
  branchId: string;
  staffId: string;
  biometricData: {
    fingerprint?: string;
    idCardNumber: string;
    idCardVerified: boolean;
  };
  personalInfo: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    dateOfBirth?: string;
    address?: string;
  };
}

export interface NamPostOnboardingResponse {
  success: boolean;
  buffrUserId?: string; // Created Buffr user ID
  accountActivated: boolean;
  message: string;
}

// ============================================================================
// NAMPOST SERVICE
// ============================================================================

class NamPostService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = NAMPOST_API_URL;
    this.apiKey = NAMPOST_API_KEY;
  }

  /**
   * Make API call to NamPost
   */
  private async callNamPost<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH',
    payload?: any,
    options?: { requestId?: string; userId?: string; branchId?: string }
  ): Promise<{ success: boolean; data?: T; error?: string; responseTime?: number }> {
    const requestId = options?.requestId || generateRequestId();
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Request-ID': requestId,
      };

      if (options?.branchId) {
        headers['X-Branch-ID'] = options.branchId;
      }

      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: AbortSignal.timeout(NAMPOST_TIMEOUT),
      };

      if (payload && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        fetchOptions.body = JSON.stringify(payload);
      }

      const response = await fetch(url, fetchOptions);
      const responseTime = Date.now() - startTime;

      // Log API sync operation (audit trail)
      await logAPISyncOperation({
        requestId,
        direction: 'outbound',
        endpoint: url,
        method,
        statusCode: response.status,
        responseTime,
        success: response.ok,
        errorMessage: response.ok ? undefined : `NamPost API error: ${response.status}`,
        userId: options?.userId,
      }).catch(err => log.error('Failed to log NamPost API sync:', err));

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `NamPost API error (${response.status}): ${errorText}`,
          responseTime,
        };
      }

      const data = await response.json() as T;
      return {
        success: true,
        data,
        responseTime,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error.message || 'NamPost API call failed';

      // Log failed API sync operation
      await logAPISyncOperation({
        requestId,
        direction: 'outbound',
        endpoint: `${this.baseUrl}${endpoint}`,
        method,
        statusCode: 0,
        responseTime,
        success: false,
        errorMessage,
        userId: options?.userId,
      }).catch(err => log.error('Failed to log NamPost API sync:', err));

      return {
        success: false,
        error: errorMessage,
        responseTime,
      };
    }
  }

  /**
   * Get list of NamPost branches
   * 
   * @param location - Optional location filter (city or region)
   * @returns List of branches
   */
  async listBranches(location?: string): Promise<NamPostBranch[]> {
    const queryParams = new URLSearchParams();
    if (location) {
      queryParams.append('location', location);
    }

    const endpoint = `/branches${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const result = await this.callNamPost<NamPostBranch[]>(endpoint, 'GET');

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch NamPost branches');
    }

    return result.data;
  }

  /**
   * Find nearby NamPost branches
   * 
   * @param latitude - Latitude
   * @param longitude - Longitude
   * @param radiusKm - Search radius in kilometers
   * @returns List of nearby branches
   */
  async findNearbyBranches(
    latitude: number,
    longitude: number,
    radiusKm: number = 50
  ): Promise<NamPostBranch[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('latitude', latitude.toString());
    queryParams.append('longitude', longitude.toString());
    queryParams.append('radius_km', radiusKm.toString());

    const endpoint = `/branches/nearby?${queryParams.toString()}`;
    const result = await this.callNamPost<NamPostBranch[]>(endpoint, 'GET');

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to find nearby NamPost branches');
    }

    return result.data;
  }

  /**
   * Get list of NamPost branches (alias for listBranches)
   * 
   * @param filters - Optional filters (region, city, services)
   * @returns List of branches
   */
  async getBranches(filters?: {
    region?: string;
    city?: string;
    services?: string[];
  }): Promise<NamPostBranch[]> {
    const location = filters?.city || filters?.region;
    return this.listBranches(location);
  }

  /**
   * Process cash-out at NamPost branch
   * 
   * @param request - Cash-out request (simplified interface)
   * @returns Cash-out response with transaction ID
   */
  async processCashOut(request: {
    userId: string;
    branchId: string;
    amount: number;
    voucherId?: string;
  }): Promise<{
    transactionId: string;
    status: 'completed' | 'pending' | 'failed';
    nampostReference: string;
  }> {
    // Call NamPost API for cash-out
    const result = await this.callNamPost<NamPostCashOutResponse>(
      '/cash-out',
      'POST',
      {
        voucherId: request.voucherId || '',
        beneficiaryId: request.userId,
        amount: request.amount,
        branchId: request.branchId,
        staffId: 'system', // System-initiated (in production, use actual staff ID)
        biometricVerified: true, // Assumed verified at branch
        verificationMethod: 'both',
      },
      {
        userId: request.userId,
        branchId: request.branchId,
      }
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'NamPost cash-out failed');
    }

    return {
      transactionId: result.data.transactionId,
      status: result.data.status,
      nampostReference: result.data.receiptNumber || result.data.transactionId,
    };
  }

  /**
   * Reset PIN at NamPost branch (for forgotten PIN)
   * 
   * @param request - PIN reset request
   * @returns PIN reset response
   */
  async resetPIN(
    request: NamPostPINResetRequest,
    options?: { requestId?: string; userId?: string }
  ): Promise<NamPostPINResetResponse> {
    const result = await this.callNamPost<NamPostPINResetResponse>(
      '/pin/reset',
      'POST',
      request,
      {
        ...options,
        branchId: request.branchId,
      }
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'NamPost PIN reset failed');
    }

    return result.data;
  }

  /**
   * Process onboarding at NamPost branch
   * 
   * @param request - Onboarding request
   * @returns Onboarding response
   */
  async processOnboarding(
    request: NamPostOnboardingRequest,
    options?: { requestId?: string }
  ): Promise<NamPostOnboardingResponse> {
    const result = await this.callNamPost<NamPostOnboardingResponse>(
      '/onboarding',
      'POST',
      request,
      {
        ...options,
        branchId: request.branchId,
      }
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'NamPost onboarding failed');
    }

    return result.data;
  }

  /**
   * Verify voucher at NamPost branch (before cash-out)
   * 
   * @param voucherId - Voucher ID
   * @param branchId - NamPost branch ID
   * @returns Verification result
   */
  async verifyVoucher(
    voucherId: string,
    branchId: string,
    options?: { requestId?: string }
  ): Promise<{ valid: boolean; voucher?: any; error?: string }> {
    const result = await this.callNamPost<{ valid: boolean; voucher?: any; error?: string }>(
      `/vouchers/${voucherId}/verify`,
      'GET',
      undefined,
      {
        ...options,
        branchId,
      }
    );

    if (!result.success) {
      return {
        valid: false,
        error: result.error || 'Voucher verification failed',
      };
    }

    return result.data || { valid: false, error: 'No data returned' };
  }
}

export const namPostService = new NamPostService();
