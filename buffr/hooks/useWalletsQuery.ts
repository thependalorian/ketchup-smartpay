/**
 * Wallets Query Hooks
 *
 * Location: hooks/useWalletsQuery.ts
 * Purpose: React Query hooks for wallet data fetching with caching
 *
 * Performance Benefits:
 * - Automatic caching (30s stale time, 5min cache)
 * - Background refetching for fresh data
 * - Optimistic updates for instant UI feedback
 * - Request deduplication (multiple components share same request)
 *
 * Replaces manual fetching in WalletsContext with React Query's
 * built-in cache management and synchronization.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/apiClient';
import { queryKeys, invalidateCache } from '@/utils/queryClient';

// Re-export types from WalletsContext for compatibility
export interface AutoPaySettings {
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  deductDate: string;
  deductTime: string;
  amount: number;
  numberOfRepayments: number | null;
  paymentMethod: string;
}

export interface Wallet {
  id: string;
  name: string;
  icon?: string;
  balance: number;
  currency?: string;
  type?: 'personal' | 'business' | 'savings' | 'investment' | 'bills' | 'travel' | 'budget';
  purpose?: string;
  cardDesign?: number;
  cardNumber?: string;
  cardholderName?: string;
  expiryDate?: string;
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

interface WalletsResponse {
  success: boolean;
  data: Wallet[];
}

interface WalletResponse {
  success: boolean;
  data: Wallet;
}

interface WalletTransactionsResponse {
  success: boolean;
  data: WalletTransaction[];
}

/**
 * Fetch all wallets for the current user
 *
 * Usage:
 * ```tsx
 * const { data: wallets, isLoading, error } = useWallets();
 * ```
 */
export function useWallets() {
  return useQuery({
    queryKey: queryKeys.wallets.lists(),
    queryFn: async () => {
      const response = await apiGet<WalletsResponse>('/api/wallets');
      return response.data;
    },
    staleTime: 60 * 1000, // 1 minute (wallets change less frequently)
  });
}

/**
 * Fetch a single wallet by ID
 *
 * Usage:
 * ```tsx
 * const { data: wallet, isLoading } = useWallet('wallet-123');
 * ```
 */
export function useWallet(walletId: string) {
  return useQuery({
    queryKey: queryKeys.wallets.detail(walletId),
    queryFn: async () => {
      const response = await apiGet<WalletResponse>(`/api/wallets/${walletId}`);
      return response.data;
    },
    enabled: !!walletId, // Only fetch if walletId is provided
  });
}

/**
 * Fetch transactions for a specific wallet
 *
 * Usage:
 * ```tsx
 * const { data: transactions } = useWalletTransactions('wallet-123');
 * ```
 */
export function useWalletTransactions(walletId: string) {
  return useQuery({
    queryKey: queryKeys.wallets.transactions(walletId),
    queryFn: async () => {
      const response = await apiGet<WalletTransactionsResponse>(
        `/api/wallets/${walletId}/transactions`
      );
      return response.data;
    },
    enabled: !!walletId,
    staleTime: 30 * 1000, // 30 seconds (transactions more volatile)
  });
}

/**
 * Create a new wallet
 *
 * Features:
 * - Optimistic update: Shows new wallet immediately
 * - Rollback on error: Reverts if API fails
 * - Cache invalidation: Refreshes wallet list on success
 *
 * Usage:
 * ```tsx
 * const createWallet = useCreateWallet();
 * await createWallet.mutateAsync({ name: 'My Wallet', type: 'personal' });
 * ```
 */
export function useCreateWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newWallet: Omit<Wallet, 'id' | 'createdAt'>) => {
      const response = await apiPost<WalletResponse>('/api/wallets', newWallet);
      return response.data;
    },
    onMutate: async (newWallet) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.wallets.lists() });

      // Snapshot previous value for rollback
      const previousWallets = queryClient.getQueryData<Wallet[]>(queryKeys.wallets.lists());

      // Optimistically add the new wallet
      queryClient.setQueryData<Wallet[]>(queryKeys.wallets.lists(), (old = []) => [
        ...old,
        {
          ...newWallet,
          id: `temp-${Date.now()}`,
          createdAt: new Date(),
          balance: newWallet.balance || 0,
          currency: newWallet.currency || 'N$',
        } as Wallet,
      ]);

      return { previousWallets };
    },
    onError: (_err, _newWallet, context) => {
      // Rollback on error
      if (context?.previousWallets) {
        queryClient.setQueryData(queryKeys.wallets.lists(), context.previousWallets);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      invalidateCache.wallets();
    },
  });
}

/**
 * Update an existing wallet
 *
 * Usage:
 * ```tsx
 * const updateWallet = useUpdateWallet();
 * await updateWallet.mutateAsync({ id: 'wallet-123', updates: { name: 'New Name' } });
 * ```
 */
export function useUpdateWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Wallet> }) => {
      const response = await apiPut<WalletResponse>(`/api/wallets/${id}`, updates);
      return response.data;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.wallets.detail(id) });

      const previousWallet = queryClient.getQueryData<Wallet>(queryKeys.wallets.detail(id));

      // Optimistic update
      queryClient.setQueryData<Wallet>(queryKeys.wallets.detail(id), (old) =>
        old ? { ...old, ...updates } : old
      );

      // Also update in the list
      queryClient.setQueryData<Wallet[]>(queryKeys.wallets.lists(), (old = []) =>
        old.map((w) => (w.id === id ? { ...w, ...updates } : w))
      );

      return { previousWallet };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousWallet) {
        queryClient.setQueryData(queryKeys.wallets.detail(id), context.previousWallet);
      }
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallets.detail(id) });
      invalidateCache.wallets();
    },
  });
}

/**
 * Delete a wallet
 *
 * Usage:
 * ```tsx
 * const deleteWallet = useDeleteWallet();
 * await deleteWallet.mutateAsync('wallet-123');
 * ```
 */
export function useDeleteWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (walletId: string) => {
      await apiDelete(`/api/wallets/${walletId}`);
      return walletId;
    },
    onMutate: async (walletId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.wallets.lists() });

      const previousWallets = queryClient.getQueryData<Wallet[]>(queryKeys.wallets.lists());

      // Optimistically remove
      queryClient.setQueryData<Wallet[]>(queryKeys.wallets.lists(), (old = []) =>
        old.filter((w) => w.id !== walletId)
      );

      return { previousWallets };
    },
    onError: (_err, _walletId, context) => {
      if (context?.previousWallets) {
        queryClient.setQueryData(queryKeys.wallets.lists(), context.previousWallets);
      }
    },
    onSettled: () => {
      invalidateCache.wallets();
    },
  });
}

/**
 * Add money to a wallet
 *
 * Usage:
 * ```tsx
 * const addMoney = useAddMoneyToWallet();
 * await addMoney.mutateAsync({ walletId: 'wallet-123', amount: 100, paymentMethod: 'bank' });
 * ```
 */
export function useAddMoneyToWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      walletId,
      amount,
      paymentMethod,
    }: {
      walletId: string;
      amount: number;
      paymentMethod: string;
    }) => {
      const response = await apiPost<WalletResponse>(`/api/wallets/${walletId}/add-money`, {
        amount,
        paymentMethod,
      });
      return response.data;
    },
    onMutate: async ({ walletId, amount }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.wallets.detail(walletId) });

      const previousWallet = queryClient.getQueryData<Wallet>(queryKeys.wallets.detail(walletId));

      // Optimistic update: add amount to balance
      queryClient.setQueryData<Wallet>(queryKeys.wallets.detail(walletId), (old) =>
        old ? { ...old, balance: old.balance + amount } : old
      );

      // Also update in the list
      queryClient.setQueryData<Wallet[]>(queryKeys.wallets.lists(), (old = []) =>
        old.map((w) => (w.id === walletId ? { ...w, balance: w.balance + amount } : w))
      );

      return { previousWallet };
    },
    onError: (_err, { walletId }, context) => {
      if (context?.previousWallet) {
        queryClient.setQueryData(queryKeys.wallets.detail(walletId), context.previousWallet);
      }
    },
    onSettled: () => {
      invalidateCache.afterWalletUpdate();
    },
  });
}

/**
 * Transfer money from a wallet
 *
 * Usage:
 * ```tsx
 * const transfer = useTransferFromWallet();
 * await transfer.mutateAsync({ walletId: 'wallet-123', amount: 50, recipient: 'user@buffr.id' });
 * ```
 */
export function useTransferFromWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      walletId,
      amount,
      recipient,
      note,
    }: {
      walletId: string;
      amount: number;
      recipient: string;
      note?: string;
    }) => {
      const response = await apiPost<WalletResponse>(`/api/wallets/${walletId}/transfer`, {
        amount,
        recipient,
        note,
      });
      return response.data;
    },
    onMutate: async ({ walletId, amount }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.wallets.detail(walletId) });

      const previousWallet = queryClient.getQueryData<Wallet>(queryKeys.wallets.detail(walletId));

      // Optimistic update: subtract amount from balance
      queryClient.setQueryData<Wallet>(queryKeys.wallets.detail(walletId), (old) =>
        old ? { ...old, balance: old.balance - amount } : old
      );

      // Also update in the list
      queryClient.setQueryData<Wallet[]>(queryKeys.wallets.lists(), (old = []) =>
        old.map((w) => (w.id === walletId ? { ...w, balance: w.balance - amount } : w))
      );

      return { previousWallet };
    },
    onError: (_err, { walletId }, context) => {
      if (context?.previousWallet) {
        queryClient.setQueryData(queryKeys.wallets.detail(walletId), context.previousWallet);
      }
    },
    onSettled: () => {
      // Invalidate wallets, transactions, and gamification (payment earns points)
      invalidateCache.afterPayment();
    },
  });
}

/**
 * Calculate wallet statistics
 *
 * Usage:
 * ```tsx
 * const { data: stats } = useWalletStats('wallet-123');
 * // stats = { totalIn: 1500, totalOut: 200, net: 1300 }
 * ```
 */
export function useWalletStats(walletId: string) {
  const { data: transactions } = useWalletTransactions(walletId);

  return useQuery({
    queryKey: [...queryKeys.wallets.detail(walletId), 'stats'],
    queryFn: () => {
      if (!transactions) return { totalIn: 0, totalOut: 0, net: 0 };

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
    enabled: !!transactions,
    staleTime: Infinity, // Calculated from cached data, no refetch needed
  });
}
