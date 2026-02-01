/**
 * Wallet API Client
 * 
 * Location: utils/walletClient.ts
 * Purpose: Centralized API client for wallet operations including AutoPay
 * 
 * Features:
 * - Type-safe wallet API calls
 * - AutoPay settings management
 * - Consistent error handling
 * - Integration with backend wallet endpoints
 */

import { apiGet, apiPost, apiPut, apiDelete, ApiError } from './apiClient';
import type { ApiResponse } from './apiClient';
import { Wallet, AutoPaySettings } from '@/contexts/WalletsContext';
import logger, { log } from '@/utils/logger';

export interface CreateWalletRequest {
  name: string;
  icon?: string;
  type?: 'personal' | 'business' | 'savings' | 'investment' | 'bills' | 'travel' | 'budget';
  currency?: string;
  autoPayEnabled?: boolean;
  autoPayMaxAmount?: number;
  autoPaySettings?: AutoPaySettings;
  autoPayFrequency?: 'weekly' | 'bi-weekly' | 'monthly';
  autoPayDeductDate?: string;
  autoPayDeductTime?: string;
  autoPayAmount?: number;
  autoPayRepayments?: number;
  autoPayPaymentMethod?: string;
  pinProtected?: boolean;
  biometricEnabled?: boolean;
}

export interface UpdateWalletRequest {
  name?: string;
  autoPayEnabled?: boolean;
  autoPayMaxAmount?: number;
  autoPaySettings?: AutoPaySettings;
  autoPayFrequency?: 'weekly' | 'bi-weekly' | 'monthly';
  autoPayDeductDate?: string;
  autoPayDeductTime?: string;
  autoPayAmount?: number;
  autoPayRepayments?: number;
  autoPayPaymentMethod?: string;
  pinProtected?: boolean;
  biometricEnabled?: boolean;
}

export interface AutoPayTransaction {
  id: string;
  ruleId: string;
  walletId: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  executedAt: string;
  failureReason?: string;
  recipient?: {
    id: string;
    name: string;
  };
  ruleDescription: string;
}

/**
 * Get all wallets for the current user
 */
export async function getWallets(): Promise<Wallet[]> {
  try {
    return await apiGet<Wallet[]>('/wallets');
  } catch (error) {
    log.error('Failed to fetch wallets:', error);
    throw error;
  }
}

/**
 * Get a specific wallet by ID
 */
export async function getWallet(walletId: string): Promise<Wallet> {
  try {
    return await apiGet<Wallet>(`/wallets/${walletId}`);
  } catch (error) {
    log.error('Failed to fetch wallet:', error);
    throw error;
  }
}

/**
 * Create a new wallet with optional AutoPay settings
 */
export async function createWallet(
  walletData: CreateWalletRequest
): Promise<Wallet> {
  try {
    return await apiPost<Wallet>('/wallets', walletData);
  } catch (error) {
    log.error('Failed to create wallet:', error);
    throw error;
  }
}

/**
 * Update wallet settings including AutoPay configuration
 */
export async function updateWalletSettings(
  walletId: string,
  updates: UpdateWalletRequest
): Promise<Wallet> {
  try {
    return await apiPut<Wallet>(`/wallets/${walletId}`, updates);
  } catch (error) {
    log.error('Failed to update wallet:', error);
    throw error;
  }
}

/**
 * Delete a wallet
 */
export async function deleteWallet(walletId: string): Promise<void> {
  try {
    await apiDelete(`/wallets/${walletId}`);
  } catch (error) {
    log.error('Failed to delete wallet:', error);
    throw error;
  }
}

/**
 * Get AutoPay transaction history for a wallet
 */
export async function getAutoPayHistory(
  walletId: string
): Promise<AutoPayTransaction[]> {
  try {
    const response = await apiGet<ApiResponse<{ transactions: AutoPayTransaction[] }>>(
      `/wallets/${walletId}/autopay/history`
    );
    // Handle API response format: { data: { transactions: [...] } }
    if (response?.data?.transactions) {
      return response.data.transactions;
    }
    // Fallback: handle direct transactions array
    if (Array.isArray(response)) {
      return response;
    }
    return [];
  } catch (error) {
    // If endpoint doesn't exist yet, return empty array
    if (error instanceof ApiError && error.status === 404) {
      logger.warn('AutoPay history endpoint not available yet');
      return [];
    }
    log.error('Failed to fetch AutoPay history:', error);
    throw error;
  }
}

/**
 * Execute an AutoPay rule
 * In production, this should integrate with Adumo Online for card payments
 */
export async function executeAutoPayRule(
  walletId: string,
  ruleId: string
): Promise<AutoPayTransaction> {
  try {
    // First, try to execute via API endpoint
    const response = await apiPost<ApiResponse<AutoPayTransaction>>(
      `/wallets/${walletId}/autopay/execute`,
      { ruleId }
    );
    
    // Handle API response format: { data: {...} }
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as ApiResponse<AutoPayTransaction>).data as AutoPayTransaction;
    }
    
    // Fallback: assume response is the transaction directly
    return response as AutoPayTransaction;
  } catch (error) {
    log.error('Failed to execute AutoPay rule:', error);
    throw error;
  }
}
