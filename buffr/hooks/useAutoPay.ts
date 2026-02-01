/**
 * AutoPay Hook
 * 
 * Location: hooks/useAutoPay.ts
 * Purpose: React hook for AutoPay operations and execution
 * 
 * Features:
 * - Execute AutoPay rules
 * - Schedule AutoPay payments
 * - Get AutoPay history
 * - Manage AutoPay notifications
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { executeAutoPayRule, getAutoPayHistory } from '@/utils/walletClient';
import { useWallets } from '@/contexts/WalletsContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { formatCurrency } from '@/utils/formatters';
import { log } from '@/utils/logger';

export interface AutoPayRule {
  id: string;
  walletId: string;
  ruleType: 'recurring' | 'scheduled' | 'minimum_balance' | 'low_balance_alert';
  amount: number;
  frequency?: 'weekly' | 'bi-weekly' | 'monthly';
  recipientId?: string;
  recipientName?: string;
  description: string;
  isActive: boolean;
  nextExecutionDate?: string;
  maxAmount?: number;
}

export interface UseAutoPayReturn {
  executeRule: (ruleId: string, walletId: string) => Promise<void>;
  getHistory: (walletId: string) => Promise<any[]>;
  loading: boolean;
  error: string | null;
}

export function useAutoPay(): UseAutoPayReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshWallets } = useWallets();
  const { addNotification } = useNotifications();

  const executeRule = useCallback(
    async (ruleId: string, walletId: string) => {
      setLoading(true);
      setError(null);
      try {
        const transaction = await executeAutoPayRule(walletId, ruleId);
        
        // Refresh wallets to update balance
        await refreshWallets();
        
        // Show success notification
        addNotification({
          type: 'transaction',
          title: 'Auto Pay Executed',
          message: `Payment of ${transaction.amount} processed successfully`,
          icon: 'check-circle',
          priority: 'normal',
        });
        
        Alert.alert('Success', 'AutoPay payment executed successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to execute AutoPay';
        setError(errorMessage);
        
        // Show error notification
        addNotification({
          type: 'system',
          title: 'AutoPay Failed',
          message: errorMessage,
          icon: 'exclamation-circle',
          priority: 'high',
        });
        
        Alert.alert('Error', errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refreshWallets, addNotification]
  );

  const getHistory = useCallback(
    async (walletId: string) => {
      setLoading(true);
      setError(null);
      try {
        const history = await getAutoPayHistory(walletId);
        return history;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load AutoPay history';
        setError(errorMessage);
        log.error('Error loading AutoPay history:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    executeRule,
    getHistory,
    loading,
    error,
  };
}
