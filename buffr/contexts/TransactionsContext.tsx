/**
 * Transactions Context
 * 
 * Location: contexts/TransactionsContext.tsx
 * Purpose: Global state management for transactions
 * 
 * Provides transactions data and methods to fetch, update, and manage transactions
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { log } from '@/utils/logger';

// Transaction interface
export interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'payment' | 'transfer' | 'request';
  amount: number;
  description: string;
  date: Date;
  recipient?: string;
  sender?: string;
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
  category?: string; // Category ID: '1'-'10' for expenses/income categories
}

interface TransactionsContextType {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  getTransactionById: (id: string) => Transaction | null;
  refreshTransactions: () => Promise<void>;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

// API base URL - uses relative path for same-origin requests
const API_BASE = '/api';

// Real API function to fetch transactions
const fetchTransactionsFromAPI = async (): Promise<Transaction[]> => {
  try {
    const response = await fetch(`${API_BASE}/transactions`, {
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
      throw new Error(`Failed to fetch transactions: ${response.status}`);
    }

    const result = await response.json();

    // Transform API response to Transaction interface
    const transactions: Transaction[] = (result.data || []).map((tx: any) => ({
      id: tx.id,
      type: tx.type || 'payment',
      amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount) || 0,
      description: tx.description || '',
      date: tx.date ? new Date(tx.date) : new Date(),
      recipient: tx.recipient?.name || tx.recipientName,
      sender: tx.sender?.name || tx.senderName,
      status: tx.status || 'completed',
      reference: tx.reference || tx.id,
      category: tx.category,
    }));

    return transactions;
  } catch (error) {
    log.error('[TransactionsContext] API fetch error:', error);
    // Return empty array on error - component can show appropriate UI
    return [];
  }
};

interface TransactionsProviderProps {
  children: ReactNode;
}

export function TransactionsProvider({ children }: TransactionsProviderProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTransactionsFromAPI();
      // Ensure data is an array before setting
      if (Array.isArray(data)) {
        setTransactions(data);
      } else {
        log.warn('Invalid transactions data received:', data);
        setTransactions([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      log.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTransactions = useCallback(async () => {
    await fetchTransactions();
  }, [fetchTransactions]);

  const getTransactionById = useCallback(
    (id: string): Transaction | null => {
      return transactions.find((tx) => tx.id === id) || null;
    },
    [transactions]
  );

  const addTransaction = useCallback((transaction: Transaction) => {
    setTransactions((prev) => [transaction, ...prev]);
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx))
    );
  }, []);

  const value: TransactionsContextType = {
    transactions,
    loading,
    error,
    fetchTransactions,
    getTransactionById,
    refreshTransactions,
    addTransaction,
    updateTransaction,
  };

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
}
