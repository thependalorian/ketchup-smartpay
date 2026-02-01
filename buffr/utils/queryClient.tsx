/**
 * React Query Client Configuration
 *
 * Location: utils/queryClient.ts
 * Purpose: Centralized query client setup with optimized defaults
 *
 * Performance Optimizations (Doherty Threshold: <400ms):
 * - staleTime: 30 seconds (reduces unnecessary refetches)
 * - gcTime: 5 minutes (keeps data in cache for quick access)
 * - retry: 2 attempts with exponential backoff
 * - refetchOnWindowFocus: false (mobile app doesn't need this)
 *
 * This configuration follows the Master System Design Guide principles:
 * - Performance: Caching reduces API calls and improves perceived speed
 * - Reliability: Retry logic handles transient failures
 * - Scalability: Reduces server load through intelligent caching
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';

/**
 * Query client instance with optimized defaults
 *
 * Cache Strategy:
 * - stale-while-revalidate: Show cached data immediately, fetch fresh in background
 * - Automatic garbage collection after 5 minutes of inactivity
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 30 seconds
      // During this time, no background refetch occurs
      staleTime: 30 * 1000,

      // Cache data for 5 minutes after last observer unmounts
      // This allows instant display when returning to a screen
      gcTime: 5 * 60 * 1000,

      // Retry failed requests up to 2 times
      // Uses exponential backoff: 1s, 2s delays
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),

      // Mobile app doesn't need refetch on window focus
      // Users explicitly refresh when needed
      refetchOnWindowFocus: false,

      // Don't refetch when network reconnects automatically
      // Let user manually refresh to avoid unexpected data changes
      refetchOnReconnect: false,

      // Keep previous data while fetching new data
      // Prevents flash of loading state on refetch
      placeholderData: (previousData: unknown) => previousData,
    },
    mutations: {
      // Retry mutations once on transient failures
      retry: 1,

      // Network mode: always attempt mutation even if offline
      // Mutation will be queued and executed when online
      networkMode: 'always',
    },
  },
});

/**
 * Query keys factory for type-safe, consistent query keys
 *
 * Usage:
 * - queryKeys.wallets.all() -> ['wallets']
 * - queryKeys.wallets.detail(id) -> ['wallets', 'detail', id]
 * - queryKeys.transactions.list({ page: 1 }) -> ['transactions', 'list', { page: 1 }]
 *
 * Benefits:
 * - Centralized key management prevents typos
 * - Enables efficient cache invalidation
 * - Type-safe with autocomplete
 */
export const queryKeys = {
  // User queries
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    preferences: () => [...queryKeys.user.all, 'preferences'] as const,
  },

  // Wallet queries
  wallets: {
    all: ['wallets'] as const,
    lists: () => [...queryKeys.wallets.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.wallets.lists(), filters] as const,
    details: () => [...queryKeys.wallets.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.wallets.details(), id] as const,
    balance: (id: string) => [...queryKeys.wallets.detail(id), 'balance'] as const,
    transactions: (id: string) => [...queryKeys.wallets.detail(id), 'transactions'] as const,
  },

  // Transaction queries
  transactions: {
    all: ['transactions'] as const,
    lists: () => [...queryKeys.transactions.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.transactions.lists(), filters] as const,
    details: () => [...queryKeys.transactions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.transactions.details(), id] as const,
    recent: (limit?: number) => [...queryKeys.transactions.all, 'recent', limit] as const,
    byCategory: (categoryId: string) =>
      [...queryKeys.transactions.all, 'category', categoryId] as const,
  },

  // Card queries
  cards: {
    all: ['cards'] as const,
    lists: () => [...queryKeys.cards.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.cards.lists(), filters] as const,
    details: () => [...queryKeys.cards.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.cards.details(), id] as const,
  },

  // Bank queries
  banks: {
    all: ['banks'] as const,
    lists: () => [...queryKeys.banks.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.banks.all, 'detail', id] as const,
    supported: () => [...queryKeys.banks.all, 'supported'] as const,
  },

  // Loan queries
  loans: {
    all: ['loans'] as const,
    lists: () => [...queryKeys.loans.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.loans.all, 'detail', id] as const,
    offers: () => [...queryKeys.loans.all, 'offers'] as const,
    schedule: (id: string) => [...queryKeys.loans.detail(id), 'schedule'] as const,
  },

  // Notification queries
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
    count: () => [...queryKeys.notifications.all, 'count'] as const,
  },

  // Gamification queries

  // Contact queries
  contacts: {
    all: ['contacts'] as const,
    lists: () => [...queryKeys.contacts.all, 'list'] as const,
    favorites: () => [...queryKeys.contacts.all, 'favorites'] as const,
    recent: () => [...queryKeys.contacts.all, 'recent'] as const,
  },
} as const;

/**
 * Cache invalidation helpers
 *
 * Usage:
 * - After creating a wallet: invalidateCache.wallets()
 * - After making a payment: invalidateCache.afterPayment()
 */
export const invalidateCache = {
  // Invalidate all wallet-related queries
  wallets: () => queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all }),

  // Invalidate all transaction-related queries
  transactions: () => queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),

  // Invalidate user profile data
  user: () => queryClient.invalidateQueries({ queryKey: queryKeys.user.all }),

  // Invalidate all card queries
  cards: () => queryClient.invalidateQueries({ queryKey: queryKeys.cards.all }),

  // Invalidate all notification queries
  notifications: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),

  // Common patterns: invalidate related queries together
  afterPayment: () => {
    invalidateCache.wallets();
    invalidateCache.transactions();
    queryClient.invalidateQueries({ queryKey: queryKeys.gamification.points() });
  },

  afterWalletUpdate: () => {
    invalidateCache.wallets();
    invalidateCache.transactions();
  },

  // Invalidate everything (use sparingly)
  all: () => queryClient.invalidateQueries(),
};

/**
 * QueryClientProvider wrapper component
 *
 * Usage in app/_layout.tsx:
 * ```tsx
 * import { QueryProvider } from '@/utils/queryClient';
 *
 * <QueryProvider>
 *   <App />
 * </QueryProvider>
 * ```
 */
interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Prefetch utilities for navigation optimization
 *
 * Usage:
 * - On home screen mount, prefetch likely navigation targets
 * - On wallet tap, prefetch transaction history
 */
export const prefetchQueries = {
  // Prefetch user's wallets (likely to be viewed)
  wallets: () => queryClient.prefetchQuery({
    queryKey: queryKeys.wallets.lists(),
    queryFn: async () => {
      const { apiGet } = await import('./apiClient');
      return apiGet('/api/wallets');
    },
  }),

  // Prefetch recent transactions
  recentTransactions: () => queryClient.prefetchQuery({
    queryKey: queryKeys.transactions.recent(10),
    queryFn: async () => {
      const { apiGet } = await import('./apiClient');
      return apiGet('/api/transactions?limit=10');
    },
  }),

  // Prefetch user profile
  userProfile: () => queryClient.prefetchQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: async () => {
      const { apiGet } = await import('./apiClient');
      return apiGet('/api/user/profile');
    },
  }),
};

export default queryClient;
