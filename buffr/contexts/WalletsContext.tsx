/**
 * Wallets Context
 * 
 * Location: contexts/WalletsContext.tsx
 * Purpose: Global state management for wallets
 * 
 * Provides wallets data and methods to fetch, update, and manage wallets
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { log } from '@/utils/logger';

// Auto Pay settings interface
export interface AutoPaySettings {
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  deductDate: string; // Format: DD-MMM-YYYY
  deductTime: string; // Format: HH:MMam/pm
  amount: number;
  numberOfRepayments: number | null;
  paymentMethod: string;
}

// Wallet interface
export interface Wallet {
  id: string;
  name: string;
  icon?: string; // FontAwesome icon name for the wallet
  balance: number;
  currency?: string;
  type?: 'personal' | 'business' | 'savings' | 'investment' | 'bills' | 'travel' | 'budget';
  purpose?: string;
  cardDesign?: number; // Frame number from Buffr Card Design (2-32)
  cardNumber?: string; // Last 4 digits for display
  cardholderName?: string;
  expiryDate?: string; // Format: MM/YY
  autoPayEnabled?: boolean;
  autoPaySettings?: AutoPaySettings;
  autoPayFrequency?: 'weekly' | 'bi-weekly' | 'monthly';
  autoPayDeductDate?: string;
  autoPayDeductTime?: string;
  autoPayAmount?: number;
  autoPayRepayments?: number;
  autoPayPaymentMethod?: string;
  autoPayMaxAmount?: number;
  pinProtected?: boolean;
  biometricEnabled?: boolean;
  createdAt: Date;
}

// Wallet transaction interface
export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'added' | 'spent' | 'transfer_in' | 'transfer_out';
  amount: number;
  description: string;
  date: Date;
  currency?: string;
  source?: string;
  destination?: string;
}

interface WalletsContextType {
  wallets: Wallet[];
  loading: boolean;
  error: string | null;
  fetchWallets: () => Promise<void>;
  getWalletById: (id: string) => Wallet | null;
  getDefaultWallet: () => Wallet | null;
  getWalletTransactions: (walletId: string) => Promise<WalletTransaction[]>;
  getWalletStats: (walletId: string) => Promise<{ totalIn: number; totalOut: number; net: number }>;
  refreshWallets: () => Promise<void>;
  addWallet: (wallet: Omit<Wallet, 'id' | 'createdAt'>) => Promise<Wallet>;
  updateWallet: (id: string, updates: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  addMoneyToWallet: (walletId: string, amount: number, paymentMethod: string) => Promise<void>;
  transferFromWallet: (walletId: string, amount: number, recipient: string, note?: string) => Promise<void>;
}

const WalletsContext = createContext<WalletsContextType | undefined>(undefined);

// API base URL - uses relative path for same-origin requests
const API_BASE = '/api';

// Real API function to fetch wallets
const fetchWalletsFromAPI = async (): Promise<Wallet[]> => {
  try {
    const response = await fetch(`${API_BASE}/wallets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for auth
    });

    if (!response.ok) {
      // If unauthorized, return empty array (user not logged in)
      if (response.status === 401) {
        return [];
      }
      throw new Error(`Failed to fetch wallets: ${response.status}`);
    }

    const result = await response.json();

    // Transform API response to Wallet interface
    const wallets: Wallet[] = (result.data || []).map((w: any) => ({
      id: w.id,
      name: w.name,
      icon: w.icon,
      balance: typeof w.balance === 'number' ? w.balance : parseFloat(w.balance) || 0,
      currency: w.currency || 'N$',
      type: w.type || 'personal',
      purpose: w.purpose,
      cardDesign: w.cardDesign,
      cardNumber: w.cardNumber,
      cardholderName: w.cardholderName,
      expiryDate: w.expiryDate,
      autoPayEnabled: w.autoPayEnabled || false,
      autoPaySettings: w.autoPaySettings,
      autoPayFrequency: w.autoPayFrequency,
      autoPayDeductDate: w.autoPayDeductDate,
      autoPayDeductTime: w.autoPayDeductTime,
      autoPayAmount: w.autoPayAmount,
      autoPayRepayments: w.autoPayRepayments,
      autoPayPaymentMethod: w.autoPayPaymentMethod,
      autoPayMaxAmount: w.autoPayMaxAmount,
      pinProtected: w.pinProtected || false,
      biometricEnabled: w.biometricEnabled || false,
      createdAt: w.createdAt ? new Date(w.createdAt) : new Date(),
    }));

    return wallets;
  } catch (error) {
    log.error('[WalletsContext] API fetch error:', error);
    // Return empty array on error - component can show appropriate UI
    return [];
  }
};

// Fetch wallet transactions from API
const fetchWalletTransactionsFromAPI = async (walletId: string): Promise<WalletTransaction[]> => {
  // Skip API call if walletId is a placeholder (during static export)
  if (!walletId || walletId === '[id]' || walletId.startsWith('[')) {
    return [];
  }

  try {
    // Ensure we have a valid absolute URL for fetch
    const url = API_BASE.startsWith('http') 
      ? `${API_BASE}/transactions?walletId=${walletId}`
      : typeof window !== 'undefined' 
        ? `${window.location.origin}${API_BASE}/transactions?walletId=${walletId}`
        : `http://localhost:3000${API_BASE}/transactions?walletId=${walletId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) return [];
      throw new Error(`Failed to fetch wallet transactions: ${response.status}`);
    }

    const result = await response.json();

    // Transform API response to WalletTransaction interface
    const transactions: WalletTransaction[] = (result.data || []).map((tx: any) => ({
      id: tx.id,
      walletId: tx.walletId || walletId,
      type: tx.type === 'received' || tx.type === 'transfer_in' ? 'added' :
            tx.type === 'sent' || tx.type === 'transfer_out' ? 'spent' : tx.type,
      amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount) || 0,
      description: tx.description || '',
      date: tx.date ? new Date(tx.date) : new Date(),
      currency: tx.currency || 'N$',
      source: tx.source,
      destination: tx.destination,
    }));

    return transactions;
  } catch (error) {
    log.error('[WalletsContext] Wallet transactions fetch error:', error);
    return [];
  }
};

interface WalletsProviderProps {
  children: ReactNode;
}

export function WalletsProvider({ children }: WalletsProviderProps) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWalletsFromAPI();
      // Ensure data is an array before setting
      if (Array.isArray(data)) {
        setWallets(data);
      } else {
        log.warn('Invalid wallets data received:', data);
        setWallets([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch wallets');
      log.error('Error fetching wallets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshWallets = useCallback(async () => {
    await fetchWallets();
  }, [fetchWallets]);

  const getWalletById = useCallback(
    (id: string): Wallet | null => {
      return wallets.find((w) => w.id === id) || null;
    },
    [wallets]
  );

  const getDefaultWallet = useCallback(
    (): Wallet | null => {
      // Return the first wallet, or null if no wallets exist
      return wallets.length > 0 ? wallets[0] : null;
    },
    [wallets]
  );

  const getWalletTransactions = useCallback(
    async (walletId: string): Promise<WalletTransaction[]> => {
      try {
        return await fetchWalletTransactionsFromAPI(walletId);
      } catch (error) {
        log.error('Error fetching wallet transactions:', error);
        return [];
      }
    },
    []
  );

  const getWalletStats = useCallback(
    async (walletId: string): Promise<{ totalIn: number; totalOut: number; net: number }> => {
      const transactions = await getWalletTransactions(walletId);
      const totalIn = transactions
        .filter((tx) => tx.type === 'added' || tx.type === 'transfer_in')
        .reduce((sum, tx) => sum + tx.amount, 0);
      const totalOut = transactions
        .filter((tx) => tx.type === 'spent' || tx.type === 'transfer_out')
        .reduce((sum, tx) => sum + tx.amount, 0);
      return {
        totalIn,
        totalOut,
        net: totalIn - totalOut,
      };
    },
    [getWalletTransactions]
  );

  const addWallet = useCallback(
    async (walletData: Omit<Wallet, 'id' | 'createdAt'>): Promise<Wallet> => {
      // Generate card number (last 4 digits)
      const cardNumber = Math.floor(1000 + Math.random() * 9000).toString();
      // Generate expiry date (2 years from now)
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 2);
      const expiryMonth = String(expiryDate.getMonth() + 1).padStart(2, '0');
      const expiryYear = String(expiryDate.getFullYear()).slice(-2);
      
      const newWallet: Wallet = {
        ...walletData,
        id: `wallet-${Date.now()}`,
        createdAt: new Date(),
        balance: walletData.balance || 0,
        currency: walletData.currency || 'N$',
        icon: walletData.icon || 'credit-card',
        cardDesign: walletData.cardDesign || 2, // Default to Frame 2
        cardNumber: walletData.cardNumber || cardNumber,
        cardholderName: walletData.cardholderName || walletData.name || 'Cardholder',
        expiryDate: walletData.expiryDate || `${expiryMonth}/${expiryYear}`,
        autoPayEnabled: walletData.autoPayEnabled || false,
        autoPaySettings: walletData.autoPaySettings,
        autoPayFrequency: walletData.autoPayFrequency,
        autoPayDeductDate: walletData.autoPayDeductDate,
        autoPayDeductTime: walletData.autoPayDeductTime,
        autoPayAmount: walletData.autoPayAmount,
        autoPayRepayments: walletData.autoPayRepayments,
        autoPayPaymentMethod: walletData.autoPayPaymentMethod,
        autoPayMaxAmount: walletData.autoPayAmount || walletData.autoPaySettings?.amount || walletData.autoPayMaxAmount,
      };
      setWallets((prev) => [...prev, newWallet]);
      return newWallet;
    },
    []
  );

  const updateWallet = useCallback(async (id: string, updates: Partial<Wallet>) => {
    setWallets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
  }, []);

  const deleteWallet = useCallback(async (id: string) => {
    setWallets((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const addMoneyToWallet = useCallback(
    async (walletId: string, amount: number, paymentMethod: string) => {
      try {
        const response = await fetch(`${API_BASE}/wallets/${walletId}/add-money`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ amount, paymentMethod }),
        });

        if (!response.ok) {
          throw new Error(`Failed to add money: ${response.status}`);
        }

        // Update local state optimistically
        setWallets((prev) =>
          prev.map((w) =>
            w.id === walletId ? { ...w, balance: w.balance + amount } : w
          )
        );
      } catch (error) {
        log.error('[WalletsContext] Add money error:', error);
        throw error;
      }
    },
    []
  );

  const transferFromWallet = useCallback(
    async (walletId: string, amount: number, recipient: string, note?: string) => {
      try {
        const response = await fetch(`${API_BASE}/payments/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ walletId, amount, recipient, note }),
        });

        if (!response.ok) {
          throw new Error(`Failed to transfer: ${response.status}`);
        }

        // Update local state optimistically
        setWallets((prev) =>
          prev.map((w) =>
            w.id === walletId ? { ...w, balance: w.balance - amount } : w
          )
        );
      } catch (error) {
        log.error('[WalletsContext] Transfer error:', error);
        throw error;
      }
    },
    []
  );

  const value: WalletsContextType = {
    wallets,
    loading,
    error,
    fetchWallets,
    getWalletById,
    getDefaultWallet,
    getWalletTransactions,
    getWalletStats,
    refreshWallets,
    addWallet,
    updateWallet,
    deleteWallet,
    addMoneyToWallet,
    transferFromWallet,
  };

  return (
    <WalletsContext.Provider value={value}>
      {children}
    </WalletsContext.Provider>
  );
}

export function useWallets() {
  const context = useContext(WalletsContext);
  if (context === undefined) {
    throw new Error('useWallets must be used within a WalletsProvider');
  }
  return context;
}
