/**
 * Vouchers Context
 * 
 * Location: contexts/VouchersContext.tsx
 * Purpose: Global state management for vouchers
 * 
 * Provides vouchers data and methods to fetch, update, and manage vouchers
 * Removes duplication across voucher screens
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { log } from '@/utils/logger';

export type VoucherType = 'government' | 'electricity' | 'water' | 'other';

export type VoucherStatus = 'available' | 'redeemed' | 'expired' | 'cancelled' | 'pending_settlement';

// Voucher interface
export interface Voucher {
  id: string;
  type: VoucherType;
  title: string;
  description: string;
  amount: number;
  status: VoucherStatus;
  expiryDate?: string;
  redeemedAt?: string;
  voucherCode?: string;
  namqrCode?: string; // NamQR code for voucher redemption
  issuer: string;
  icon: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface VouchersContextType {
  vouchers: Voucher[];
  availableVouchers: Voucher[];
  loading: boolean;
  error: string | null;
  fetchVouchers: () => Promise<void>; // Fetch available vouchers only
  fetchAllVouchers: () => Promise<void>; // Fetch all vouchers including history
  getVoucherById: (id: string) => Voucher | null;
  getVouchersByType: (type: VoucherType) => Voucher[];
  getVouchersByStatus: (status: VoucherStatus) => Voucher[];
  redeemVoucher: (voucherId: string, redemptionMethod: string, options?: {
    redemptionPoint?: string;
    bankAccountNumber?: string;
    bankName?: string;
    walletId?: string;
    verificationToken: string;
  }) => Promise<void>;
  refreshVouchers: () => Promise<void>;
}

const VouchersContext = createContext<VouchersContextType | undefined>(undefined);

// API base URL - uses relative path for same-origin requests
const API_BASE = '/api';

// Real API function to fetch available vouchers
const fetchVouchersFromAPI = async (): Promise<Voucher[]> => {
  try {
    const { apiGet } = await import('@/utils/apiClient');
    const data = await apiGet<Voucher[]>('/utilities/vouchers');
    return data || [];
  } catch (error) {
    log.error('[VouchersContext] API fetch error:', error);
    // Return empty array on error - component can show appropriate UI
    return [];
  }
};

// Real API function to fetch all vouchers (including history)
const fetchAllVouchersFromAPI = async (): Promise<Voucher[]> => {
  try {
    const { apiGet } = await import('@/utils/apiClient');
    const data = await apiGet<Voucher[]>('/utilities/vouchers/all');
    return data || [];
  } catch (error) {
    log.error('[VouchersContext] API fetch all error:', error);
    return [];
  }
};

// Real API function to redeem voucher
const redeemVoucherAPI = async (
  voucherId: string,
  redemptionMethod: string,
  options: {
    redemptionPoint?: string;
    bankAccountNumber?: string;
    bankName?: string;
    walletId?: string;
    verificationToken: string;
  }
): Promise<void> => {
  const { apiPost } = await import('@/utils/apiClient');
  await apiPost('/utilities/vouchers/redeem', {
    voucherId,
    redemptionMethod,
    redemptionPoint: options.redemptionPoint,
    bankAccountNumber: options.bankAccountNumber,
    bankName: options.bankName,
    walletId: options.walletId,
    verificationToken: options.verificationToken,
  });
};

interface VouchersProviderProps {
  children: ReactNode;
}

export function VouchersProvider({ children }: VouchersProviderProps) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available vouchers only
  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVouchersFromAPI();
      setVouchers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vouchers');
      log.error('Error fetching vouchers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all vouchers (including history)
  const fetchAllVouchers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllVouchersFromAPI();
      setVouchers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch all vouchers');
      log.error('Error fetching all vouchers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get voucher by ID
  const getVoucherById = useCallback((id: string): Voucher | null => {
    return vouchers.find(v => v.id === id) || null;
  }, [vouchers]);

  // Get vouchers by type
  const getVouchersByType = useCallback((type: VoucherType): Voucher[] => {
    return vouchers.filter(v => v.type === type);
  }, [vouchers]);

  // Get vouchers by status
  const getVouchersByStatus = useCallback((status: VoucherStatus): Voucher[] => {
    return vouchers.filter(v => v.status === status);
  }, [vouchers]);

  // Redeem voucher
  const redeemVoucher = useCallback(async (
    voucherId: string,
    redemptionMethod: string,
    options: {
      redemptionPoint?: string;
      bankAccountNumber?: string;
      bankName?: string;
      walletId?: string;
      verificationToken: string;
    }
  ) => {
    try {
      await redeemVoucherAPI(voucherId, redemptionMethod, options);
      // Refresh vouchers after redemption
      await fetchVouchers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to redeem voucher';
      setError(errorMessage);
      throw err; // Re-throw so component can handle it
    }
  }, [fetchVouchers]);

  // Refresh vouchers (fetch available)
  const refreshVouchers = useCallback(async () => {
    await fetchVouchers();
  }, [fetchVouchers]);

  // Computed: Available vouchers
  const availableVouchers = vouchers.filter(v => v.status === 'available');

  const value: VouchersContextType = {
    vouchers,
    availableVouchers,
    loading,
    error,
    fetchVouchers,
    fetchAllVouchers,
    getVoucherById,
    getVouchersByType,
    getVouchersByStatus,
    redeemVoucher,
    refreshVouchers,
  };

  return (
    <VouchersContext.Provider value={value}>
      {children}
    </VouchersContext.Provider>
  );
}

export function useVouchers(): VouchersContextType {
  const context = useContext(VouchersContext);
  if (context === undefined) {
    throw new Error('useVouchers must be used within a VouchersProvider');
  }
  return context;
}
