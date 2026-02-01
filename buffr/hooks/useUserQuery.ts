/**
 * User Query Hooks
 *
 * Location: hooks/useUserQuery.ts
 * Purpose: React Query hooks for user profile and preferences
 *
 * Performance Benefits:
 * - User data cached for 5 minutes (rarely changes)
 * - Background refresh on app focus
 * - Optimistic updates for settings changes
 *
 * Replaces UserContext fetching with React Query's cache management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut, apiPost } from '@/utils/apiClient';
import { queryKeys, invalidateCache } from '@/utils/queryClient';

// User profile interface
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  avatar?: string;
  buffrId: string;
  currency: string;
  language: string;
  createdAt: Date;
  verified: boolean;
  kycStatus: 'none' | 'pending' | 'verified' | 'rejected';
}

// User preferences interface
export interface UserPreferences {
  showBalance: boolean;
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    transactions: boolean;
    marketing: boolean;
  };
  security: {
    biometricEnabled: boolean;
    pinRequired: boolean;
    twoFactorEnabled: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'system';
    compactMode: boolean;
    currency: string;
  };
}

interface UserResponse {
  success: boolean;
  data: User;
}

interface UserPreferencesResponse {
  success: boolean;
  data: UserPreferences;
}

/**
 * Fetch current user profile
 *
 * Usage:
 * ```tsx
 * const { data: user, isLoading } = useUser();
 * ```
 */
export function useUser() {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: async () => {
      const response = await apiGet<UserResponse>('/api/user/profile');
      return {
        ...response.data,
        createdAt: new Date(response.data.createdAt),
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (user profile rarely changes)
  });
}

/**
 * Fetch user preferences
 *
 * Usage:
 * ```tsx
 * const { data: preferences } = useUserPreferences();
 * ```
 */
export function useUserPreferences() {
  return useQuery({
    queryKey: queryKeys.user.preferences(),
    queryFn: async () => {
      const response = await apiGet<UserPreferencesResponse>('/api/user/preferences');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Update user profile
 *
 * Usage:
 * ```tsx
 * const updateProfile = useUpdateUser();
 * await updateProfile.mutateAsync({ firstName: 'John', lastName: 'Doe' });
 * ```
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<User>) => {
      const response = await apiPut<UserResponse>('/api/user/profile', updates);
      return {
        ...response.data,
        createdAt: new Date(response.data.createdAt),
      };
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.user.profile() });

      const previousUser = queryClient.getQueryData<User>(queryKeys.user.profile());

      // Optimistic update
      queryClient.setQueryData<User>(queryKeys.user.profile(), (old) =>
        old ? { ...old, ...updates } : old
      );

      return { previousUser };
    },
    onError: (_err, _updates, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.user.profile(), context.previousUser);
      }
    },
    onSettled: () => {
      invalidateCache.user();
    },
  });
}

/**
 * Update user preferences
 *
 * Usage:
 * ```tsx
 * const updatePrefs = useUpdateUserPreferences();
 * await updatePrefs.mutateAsync({ showBalance: false });
 * ```
 */
export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      const response = await apiPut<UserPreferencesResponse>('/api/user/preferences', updates);
      return response.data;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.user.preferences() });

      const previousPrefs = queryClient.getQueryData<UserPreferences>(queryKeys.user.preferences());

      // Optimistic update with deep merge
      queryClient.setQueryData<UserPreferences>(queryKeys.user.preferences(), (old) => {
        if (!old) return old;
        return {
          ...old,
          ...updates,
          notifications: {
            ...old.notifications,
            ...(updates.notifications || {}),
          },
          security: {
            ...old.security,
            ...(updates.security || {}),
          },
          display: {
            ...old.display,
            ...(updates.display || {}),
          },
        };
      });

      return { previousPrefs };
    },
    onError: (_err, _updates, context) => {
      if (context?.previousPrefs) {
        queryClient.setQueryData(queryKeys.user.preferences(), context.previousPrefs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.preferences() });
    },
  });
}

/**
 * Toggle balance visibility (common action)
 *
 * Usage:
 * ```tsx
 * const toggleBalance = useToggleBalanceVisibility();
 * toggleBalance.mutate(); // Toggles current state
 * ```
 */
export function useToggleBalanceVisibility() {
  const queryClient = useQueryClient();
  const { data: preferences } = useUserPreferences();

  return useMutation({
    mutationFn: async () => {
      const newValue = !preferences?.showBalance;
      const response = await apiPut<UserPreferencesResponse>('/api/user/preferences', {
        showBalance: newValue,
      });
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.user.preferences() });

      const previousPrefs = queryClient.getQueryData<UserPreferences>(queryKeys.user.preferences());

      // Optimistic toggle
      queryClient.setQueryData<UserPreferences>(queryKeys.user.preferences(), (old) =>
        old ? { ...old, showBalance: !old.showBalance } : old
      );

      return { previousPrefs };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPrefs) {
        queryClient.setQueryData(queryKeys.user.preferences(), context.previousPrefs);
      }
    },
  });
}

/**
 * Upload user avatar
 *
 * Usage:
 * ```tsx
 * const uploadAvatar = useUploadAvatar();
 * await uploadAvatar.mutateAsync(imageBase64);
 * ```
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageBase64: string) => {
      const response = await apiPost<UserResponse>('/api/user/avatar', {
        image: imageBase64,
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Update user profile with new avatar
      queryClient.setQueryData<User>(queryKeys.user.profile(), (old) =>
        old ? { ...old, avatar: data.avatar } : old
      );
    },
    onSettled: () => {
      invalidateCache.user();
    },
  });
}

/**
 * Request KYC verification
 *
 * Usage:
 * ```tsx
 * const requestKyc = useRequestKycVerification();
 * await requestKyc.mutateAsync({ idDocument: base64, selfie: base64 });
 * ```
 */
export function useRequestKycVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documents: { idDocument: string; selfie: string }) => {
      const response = await apiPost<UserResponse>('/api/user/kyc', documents);
      return response.data;
    },
    onSuccess: () => {
      // Update KYC status to pending
      queryClient.setQueryData<User>(queryKeys.user.profile(), (old) =>
        old ? { ...old, kycStatus: 'pending' } : old
      );
    },
    onSettled: () => {
      invalidateCache.user();
    },
  });
}

/**
 * Get combined user data (profile + preferences)
 *
 * Usage:
 * ```tsx
 * const { user, preferences, isLoading } = useUserData();
 * ```
 */
export function useUserData() {
  const userQuery = useUser();
  const preferencesQuery = useUserPreferences();

  return {
    user: userQuery.data,
    preferences: preferencesQuery.data,
    isLoading: userQuery.isLoading || preferencesQuery.isLoading,
    error: userQuery.error || preferencesQuery.error,
    refetch: async () => {
      await Promise.all([userQuery.refetch(), preferencesQuery.refetch()]);
    },
  };
}
