/**
 * IPS (Instant Payment Switch) Service
 * 
 * Location: services/ipsService.ts
 * Purpose: Integration with NamClear Instant Payment System (IPS) for e-money interoperability
 * 
 * Compliance: PSDIR-11 (Mandatory IPS connection by February 26, 2026)
 * Integration: NamClear (IPS operator, BON partner)
 * 
 * IPS enables:
 * - Wallet-to-wallet transfers across different e-money providers
 * - Wallet-to-bank transfers (interoperability)
 * - Real-time settlement via NISS
 * - 24/7 availability
 * 
 * Critical Deadline: February 26, 2026 (PSDIR-11 requirement)
 */

import { logAPISyncOperation, generateRequestId } from '@/utils/auditLogger';
import { log } from '@/utils/logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

const IPS_API_URL = process.env.IPS_API_URL || 'https://api.namclear.com.na/ips/v1';
const IPS_API_KEY = process.env.IPS_API_KEY || '';
const IPS_PARTICIPANT_ID = process.env.IPS_PARTICIPANT_ID || ''; // Buffr's participant ID
const IPS_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// TYPES
// ============================================================================

export interface IPSTransferRequest {
  fromAccount: string; // Buffr wallet ID or Virtual Payment Address (VPA)
  toAccount: string; // Recipient wallet ID, VPA, or bank account
  amount: number;
  currency: string; // 'NAD'
  reference: string; // Transaction reference
  description?: string;
  metadata?: Record<string, any>;
}

export interface IPSTransferResponse {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
  message?: string;
  settlementTime?: string;
  fees?: number;
}

export interface IPSBalanceInquiry {
  accountId: string;
  balance: number;
  currency: string;
  lastUpdated: string;
}

export interface IPSHealthCheck {
  healthy: boolean;
  responseTime?: number;
  error?: string;
}

// ============================================================================
// IPS SERVICE
// ============================================================================

class IPSService {
  private baseUrl: string;
  private apiKey: string;
  private participantId: string;

  constructor() {
    this.baseUrl = IPS_API_URL;
    this.apiKey = IPS_API_KEY;
    this.participantId = IPS_PARTICIPANT_ID;
  }

  /**
   * Make API call to IPS
   */
  private async callIPS<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH',
    payload?: any,
    options?: { requestId?: string; userId?: string }
  ): Promise<{ success: boolean; data?: T; error?: string; responseTime?: number }> {
    const requestId = options?.requestId || generateRequestId();
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Participant-ID': this.participantId,
        'X-Request-ID': requestId,
      };

      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: AbortSignal.timeout(IPS_TIMEOUT),
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
        errorMessage: response.ok ? undefined : `IPS API error: ${response.status}`,
        userId: options?.userId,
      }).catch(err => log.error('Failed to log IPS API sync:', err));

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `IPS API error (${response.status}): ${errorText}`,
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
      const errorMessage = error.message || 'IPS API call failed';

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
      }).catch(err => log.error('Failed to log IPS API sync:', err));

      return {
        success: false,
        error: errorMessage,
        responseTime,
      };
    }
  }

  /**
   * Transfer funds via IPS (wallet-to-wallet or wallet-to-bank)
   * 
   * @param request - Transfer request
   * @param options - Request options
   * @returns Transfer response
   */
  async transfer(
    request: IPSTransferRequest,
    options?: { requestId?: string; userId?: string }
  ): Promise<IPSTransferResponse> {
    const result = await this.callIPS<IPSTransferResponse>(
      '/transfers',
      'POST',
      request,
      options
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'IPS transfer failed');
    }

    return result.data;
  }

  /**
   * Check account balance via IPS
   * 
   * @param accountId - Account ID or VPA
   * @param options - Request options
   * @returns Balance inquiry
   */
  async checkBalance(
    accountId: string,
    options?: { requestId?: string; userId?: string }
  ): Promise<IPSBalanceInquiry> {
    const result = await this.callIPS<IPSBalanceInquiry>(
      `/accounts/${encodeURIComponent(accountId)}/balance`,
      'GET',
      undefined,
      options
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'IPS balance check failed');
    }

    return result.data;
  }

  /**
   * Health check for IPS connection
   * 
   * @returns Health status
   */
  async healthCheck(): Promise<IPSHealthCheck> {
    const startTime = Date.now();
    try {
      const result = await this.callIPS<{ status: string }>('/health', 'GET');
      const responseTime = Date.now() - startTime;

      return {
        healthy: result.success,
        responseTime,
        error: result.error,
      };
    } catch (error: any) {
      return {
        healthy: false,
        error: error.message,
      };
    }
  }

  /**
   * Retry IPS API call with exponential backoff
   * 
   * @param fn - Function to retry
   * @param maxRetries - Maximum retry attempts (default: 3)
   * @returns Result
   */
  private async retryAPICall<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 seconds
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('IPS API call failed after retries');
  }

  /**
   * Transfer with retry logic
   */
  async transferWithRetry(
    request: IPSTransferRequest,
    options?: { requestId?: string; userId?: string; maxRetries?: number }
  ): Promise<IPSTransferResponse> {
    return this.retryAPICall(
      () => this.transfer(request, options),
      options?.maxRetries || 3
    );
  }
}

export const ipsService = new IPSService();
