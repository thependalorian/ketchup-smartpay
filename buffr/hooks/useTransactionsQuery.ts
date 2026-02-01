/**
 * Transactions Query Hooks
 *
 * Location: hooks/useTransactionsQuery.ts
 * Purpose: React Query hooks for transaction data fetching with caching
 *
 * Performance Benefits:
 * - Automatic caching with background refetching
 * - Pagination support for large datasets
 * - Optimistic updates for instant UI feedback
 * - Query deduplication across components
 *
 * Replaces manual fetching in TransactionsContext with React Query's
 * built-in cache management and synchronization.
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut } from '@/utils/apiClient';
import { queryKeys, invalidateCache } from '@/utils/queryClient';

// Re-export Transaction type for compatibility
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
  category?: string;
}

interface TransactionsResponse {
  success: boolean;
  data: Transaction[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

interface TransactionResponse {
  success: boolean;
  data: Transaction;
}

interface TransactionFilters {
  type?: Transaction['type'];
  status?: Transaction['status'];
  category?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Fetch all transactions with optional filters
 *
 * Usage:
 * ```tsx
 * const { data: transactions, isLoading, error } = useTransactions();
 * // With filters:
 * const { data } = useTransactions({ type: 'sent', status: 'completed' });
 * ```
 */
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: queryKeys.transactions.list(filters as Record<string, unknown> | undefined),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters?.minAmount) params.append('minAmount', String(filters.minAmount));
      if (filters?.maxAmount) params.append('maxAmount', String(filters.maxAmount));

      const queryString = params.toString();
      const url = queryString ? `/api/transactions?${queryString}` : '/api/transactions';

      const response = await apiGet<TransactionsResponse>(url);
      return response.data.map((tx) => ({
        ...tx,
        date: new Date(tx.date), // Ensure Date objects
      }));
    },
    staleTime: 30 * 1000, // 30 seconds (transactions can change frequently)
  });
}

/**
 * Fetch recent transactions (for home screen)
 *
 * Usage:
 * ```tsx
 * const { data: recent } = useRecentTransactions(5); // Last 5 transactions
 * ```
 */
export function useRecentTransactions(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.transactions.recent(limit),
    queryFn: async () => {
      const response = await apiGet<TransactionsResponse>(`/api/transactions?limit=${limit}`);
      return response.data.map((tx) => ({
        ...tx,
        date: new Date(tx.date),
      }));
    },
    staleTime: 15 * 1000, // 15 seconds (recent transactions shown prominently)
  });
}

/**
 * Fetch a single transaction by ID
 *
 * Usage:
 * ```tsx
 * const { data: transaction } = useTransaction('tx-123');
 * ```
 */
export function useTransaction(transactionId: string) {
  return useQuery({
    queryKey: queryKeys.transactions.detail(transactionId),
    queryFn: async () => {
      const response = await apiGet<TransactionResponse>(`/api/transactions/${transactionId}`);
      return {
        ...response.data,
        date: new Date(response.data.date),
      };
    },
    enabled: !!transactionId,
  });
}

/**
 * Fetch transactions by category
 *
 * Usage:
 * ```tsx
 * const { data } = useTransactionsByCategory('1'); // Food & Beverages category
 * ```
 */
export function useTransactionsByCategory(categoryId: string) {
  return useQuery({
    queryKey: queryKeys.transactions.byCategory(categoryId),
    queryFn: async () => {
      const response = await apiGet<TransactionsResponse>(
        `/api/transactions?category=${categoryId}`
      );
      return response.data.map((tx) => ({
        ...tx,
        date: new Date(tx.date),
      }));
    },
    enabled: !!categoryId,
  });
}

/**
 * Infinite scroll for transactions list
 *
 * Usage:
 * ```tsx
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 * } = useInfiniteTransactions();
 *
 * // Flatten pages for display
 * const allTransactions = data?.pages.flatMap(page => page.data) || [];
 * ```
 */
export function useInfiniteTransactions(filters?: TransactionFilters, pageSize: number = 20) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.transactions.lists(), 'infinite', filters, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams();
      params.append('limit', String(pageSize));
      params.append('offset', String(pageParam * pageSize));

      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.category) params.append('category', filters.category);

      const response = await apiGet<TransactionsResponse>(`/api/transactions?${params.toString()}`);

      return {
        data: response.data.map((tx) => ({
          ...tx,
          date: new Date(tx.date),
        })),
        pagination: response.pagination || {
          page: pageParam,
          limit: pageSize,
          total: response.data.length,
          hasMore: response.data.length === pageSize,
        },
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.pagination?.hasMore) return undefined;
      return allPages.length;
    },
    initialPageParam: 0,
  });
}

/**
 * Create a new transaction (for sending money)
 *
 * Features:
 * - Optimistic update for instant feedback
 * - Automatic cache invalidation
 * - Gamification points update
 *
 * Usage:
 * ```tsx
 * const sendMoney = useCreateTransaction();
 * await sendMoney.mutateAsync({
 *   type: 'sent',
 *   amount: 100,
 *   description: 'Payment',
 *   recipient: 'user@buffr.id',
 *   status: 'pending',
 * });
 * ```
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTransaction: Omit<Transaction, 'id' | 'date' | 'reference'>) => {
      const response = await apiPost<TransactionResponse>('/api/transactions', newTransaction);
      return {
        ...response.data,
        date: new Date(response.data.date),
      };
    },
    onMutate: async (newTransaction) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.lists() });

      const previousTransactions = queryClient.getQueryData<Transaction[]>(
        queryKeys.transactions.lists()
      );

      // Optimistically add the transaction
      const optimisticTransaction: Transaction = {
        ...newTransaction,
        id: `temp-${Date.now()}`,
        date: new Date(),
        reference: `BFR-PENDING-${Date.now()}`,
        status: 'pending',
      };

      queryClient.setQueryData<Transaction[]>(queryKeys.transactions.lists(), (old = []) => [
        optimisticTransaction,
        ...old,
      ]);

      return { previousTransactions };
    },
    onError: (_err, _newTransaction, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(queryKeys.transactions.lists(), context.previousTransactions);
      }
    },
    onSettled: () => {
      // Invalidate transactions and related queries
      invalidateCache.afterPayment();
    },
  });
}

/**
 * Update a transaction (e.g., mark as completed)
 *
 * Usage:
 * ```tsx
 * const updateTx = useUpdateTransaction();
 * await updateTx.mutateAsync({ id: 'tx-123', updates: { status: 'completed' } });
 * ```
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
      const response = await apiPut<TransactionResponse>(`/api/transactions/${id}`, updates);
      return {
        ...response.data,
        date: new Date(response.data.date),
      };
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.detail(id) });

      const previousTransaction = queryClient.getQueryData<Transaction>(
        queryKeys.transactions.detail(id)
      );

      // Optimistic update
      queryClient.setQueryData<Transaction>(queryKeys.transactions.detail(id), (old) =>
        old ? { ...old, ...updates } : old
      );

      // Also update in the list
      queryClient.setQueryData<Transaction[]>(queryKeys.transactions.lists(), (old = []) =>
        old.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx))
      );

      return { previousTransaction };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousTransaction) {
        queryClient.setQueryData(queryKeys.transactions.detail(id), context.previousTransaction);
      }
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.detail(id) });
      invalidateCache.transactions();
    },
  });
}

/**
 * Get transaction statistics by category
 *
 * Usage:
 * ```tsx
 * const { data: stats } = useTransactionStats();
 * // stats = [{ category: '1', name: 'Food', total: 500 }, ...]
 * ```
 */
export function useTransactionStats() {
  const { data: transactions } = useTransactions();

  return useQuery({
    queryKey: [...queryKeys.transactions.all, 'stats'],
    queryFn: () => {
      if (!transactions) return [];

      const categoryMap = new Map<string, { total: number; count: number }>();

      transactions.forEach((tx) => {
        if (tx.category) {
          const existing = categoryMap.get(tx.category) || { total: 0, count: 0 };
          categoryMap.set(tx.category, {
            total: existing.total + tx.amount,
            count: existing.count + 1,
          });
        }
      });

      return Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
        average: data.total / data.count,
      }));
    },
    enabled: !!transactions,
    staleTime: Infinity, // Calculated from cached data
  });
}

/**
 * Search transactions by description
 *
 * Usage:
 * ```tsx
 * const { data: results } = useSearchTransactions('restaurant');
 * ```
 */
export function useSearchTransactions(searchQuery: string) {
  return useQuery({
    queryKey: [...queryKeys.transactions.all, 'search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];

      const response = await apiGet<TransactionsResponse>(
        `/api/transactions?search=${encodeURIComponent(searchQuery)}`
      );
      return response.data.map((tx) => ({
        ...tx,
        date: new Date(tx.date),
      }));
    },
    enabled: searchQuery.length >= 2,
    staleTime: 60 * 1000, // 1 minute cache for search results
  });
}
