/**
 * NamPay Integration Service
 * 
 * Location: services/nampayService.ts
 * Purpose: Handle instant settlement and transfers via NamPay (Bank of Namibia IPP)
 * 
 * Compliance: Payment System Management Act, PSD-1, PSD-3
 */

import { log } from '@/utils/logger';

export interface NamPayTransferRequest {
  amount: number;
  currency: string;
  recipientName: string;
  bankName: string;
  accountNumber: string;
  reference: string;
  type: 'wallet_settlement' | 'bank_transfer' | 'merchant_payout';
}

export interface NamPayResponse {
  success: boolean;
  reference: string;
  nampayReference: string;
  status: 'completed' | 'pending' | 'failed';
  error?: string;
}

class NamPayService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.NAMPAY_BASE_URL || 'https://api.nampay.com.na/v1';
    this.apiKey = process.env.NAMPAY_API_KEY || '';
  }

  /**
   * Initiate an instant transfer via NamPay
   */
  async initiateTransfer(request: NamPayTransferRequest): Promise<NamPayResponse> {
    try {
      log.info('Initiating NamPay transfer', { reference: request.reference, amount: request.amount });

      if (!this.apiKey) {
        throw new Error('NamPay API key not configured. Set NAMPAY_API_KEY environment variable.');
      }

      const response = await fetch(`${this.baseUrl}/transfers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `NamPay API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        reference: request.reference,
        nampayReference: data.reference || data.nampayReference || `NP-${Date.now()}`,
        status: data.status || 'completed'
      };
    } catch (error: any) {
      log.error('NamPay transfer failed', error, { reference: request.reference });
      return {
        success: false,
        reference: request.reference,
        nampayReference: '',
        status: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Verify a payment status
   */
  async verifyPayment(nampayReference: string): Promise<boolean> {
    try {
      if (!this.apiKey) {
        log.error('NamPay API key not configured', { nampayReference });
        return false;
      }

      const response = await fetch(`${this.baseUrl}/transfers/${nampayReference}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        log.error('NamPay payment verification failed', { nampayReference, status: response.status });
        return false;
      }

      const data = await response.json();
      return data.status === 'completed' || data.status === 'settled';
    } catch (error: any) {
      log.error('NamPay payment verification error', error, { nampayReference });
      return false;
    }
  }
}

export const nampayService = new NamPayService();