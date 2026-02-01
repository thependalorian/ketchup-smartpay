/**
 * Banks Context
 * 
 * Location: contexts/BanksContext.tsx
 * Purpose: Global state management for linked bank accounts
 * 
 * Provides bank account data and methods to add, update, and manage linked banks
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { log } from '@/utils/logger';

// Bank account interface
export interface Bank {
  id: string;
  accountNumber: string; // Full account number (stored securely, displayed as last 4)
  last4: string; // Last 4 digits for display
  accountHolderName: string;
  bankName: string;
  accountType: 'checking' | 'savings';
  routingNumber?: string; // For US banks
  swiftCode?: string; // For international banks
  branchCode?: string; // For some countries
  isDefault?: boolean; // Default payment method
  isVerified: boolean; // Bank verification status
  isActive: boolean; // Bank active status
  createdAt: Date;
  lastUsedAt?: Date;
}

interface BanksContextType {
  banks: Bank[];
  loading: boolean;
  error: string | null;
  fetchBanks: () => Promise<void>;
  getBankById: (id: string) => Bank | null;
  addBank: (bankData: Omit<Bank, 'id' | 'last4' | 'isVerified' | 'isActive' | 'createdAt'>) => Promise<Bank>;
  updateBank: (id: string, updates: Partial<Bank>) => Promise<void>;
  deleteBank: (id: string) => Promise<void>;
  setDefaultBank: (id: string) => Promise<void>;
  refreshBanks: () => Promise<void>;
  getDefaultBank: () => Bank | null;
}

const BanksContext = createContext<BanksContextType | undefined>(undefined);

// Real API function - Fetches banks from backend
const fetchBanksFromAPI = async (): Promise<Bank[]> => {
  const { apiGet } = await import('@/utils/apiClient');
  const banks = await apiGet<Bank[]>('/banks');
  return banks || [];
};

interface BanksProviderProps {
  children: ReactNode;
}

export function BanksProvider({ children }: BanksProviderProps) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBanks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBanksFromAPI();
      setBanks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch banks');
      log.error('Error fetching banks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshBanks = useCallback(async () => {
    await fetchBanks();
  }, [fetchBanks]);

  const getBankById = useCallback(
    (id: string): Bank | null => {
      return banks.find((bank) => bank.id === id) || null;
    },
    [banks]
  );

  const getDefaultBank = useCallback((): Bank | null => {
    return banks.find((bank) => bank.isDefault) || banks[0] || null;
  }, [banks]);

  const addBank = useCallback(
    async (
      bankData: Omit<Bank, 'id' | 'last4' | 'isVerified' | 'isActive' | 'createdAt'>
    ): Promise<Bank> => {
      setLoading(true);
      setError(null);
      try {
        const { apiPost } = await import('@/utils/apiClient');
        const newBank = await apiPost<Bank>('/banks', {
          accountNumber: bankData.accountNumber,
          accountHolderName: bankData.accountHolderName,
          bankName: bankData.bankName,
          accountType: bankData.accountType || 'checking',
          branchCode: bankData.branchCode,
          swiftCode: bankData.swiftCode,
        });

        // Refresh banks list
        await fetchBanks();
        return newBank;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add bank';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchBanks]
  );

  const updateBank = useCallback(async (id: string, updates: Partial<Bank>) => {
    setLoading(true);
    setError(null);
    try {
      const { apiPut } = await import('@/utils/apiClient');
      await apiPut<Bank>(`/banks/${id}`, updates);

      // Refresh banks list to get updated state from server
      await fetchBanks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bank');
      log.error('Error updating bank:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchBanks]);

  const deleteBank = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { apiDelete } = await import('@/utils/apiClient');
      await apiDelete(`/banks/${id}`);

      // Refresh banks list to get updated state from server
      await fetchBanks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bank');
      log.error('Error deleting bank:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchBanks]);

  const setDefaultBank = useCallback(async (id: string) => {
    await updateBank(id, { isDefault: true });
  }, [updateBank]);

  const value: BanksContextType = {
    banks,
    loading,
    error,
    fetchBanks,
    getBankById,
    addBank,
    updateBank,
    deleteBank,
    setDefaultBank,
    refreshBanks,
    getDefaultBank,
  };

  return (
    <BanksContext.Provider value={value}>
      {children}
    </BanksContext.Provider>
  );
}

export function useBanks() {
  const context = useContext(BanksContext);
  if (context === undefined) {
    throw new Error('useBanks must be used within a BanksProvider');
  }
  return context;
}
