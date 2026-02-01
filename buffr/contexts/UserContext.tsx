/**
 * User Context
 * 
 * Location: contexts/UserContext.tsx
 * Purpose: Global state management for user profile and main account
 * 
 * Provides user data, Buffr Card balance, and user preferences
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { log } from '@/utils/logger';

// User interface
export interface User {
  id: string;
  phoneNumber: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatar?: string;
  isVerified: boolean;
  buffrCardBalance: number; // Main Buffr Card balance
  currency: string;
  createdAt: Date;
  lastLoginAt?: Date;
  accountCreatedAt?: Date; // Account creation date (alias for createdAt)
  lastActiveAt?: Date; // Last active timestamp
}

// User preferences interface
export interface UserPreferences {
  showBalance: boolean; // Whether to show balance by default
  currency: string;
  language: string;
  notificationsEnabled: boolean;
  biometricEnabled: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

interface UserContextType {
  user: User | null;
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  toggleBalanceVisibility: () => void;
  updateBuffrCardBalance: (amount: number) => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Real API function - Fetches user from backend
const fetchUserFromAPI = async (): Promise<User> => {
  const { apiGet } = await import('@/utils/apiClient');
  const user = await apiGet<User>('/users/me');
  return user;
};

// Default preferences
const defaultPreferences: UserPreferences = {
  showBalance: false, // Balance hidden by default for privacy
  currency: 'N$',
  language: 'en',
  notificationsEnabled: true,
  biometricEnabled: true,
  theme: 'light',
};

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserFromAPI();
      // Ensure data is valid before setting
      if (data && typeof data === 'object') {
        setUser(data);
      } else {
        log.warn('Invalid user data received:', data);
        setUser(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user data';
      setError(errorMessage);
      log.error('Error fetching user:', err);
      // Don't set user to null on error - keep existing user data if available
      // This prevents UI flicker on network errors
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    setLoading(true);
    setError(null);
    try {
      // In production, this would call an API
      await new Promise((resolve) => setTimeout(resolve, 300));
      setUser((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
      log.error('Error updating user:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    setLoading(true);
    setError(null);
    try {
      // In production, this would call an API
      await new Promise((resolve) => setTimeout(resolve, 300));
      setPreferences((prev) => ({ ...prev, ...updates }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
      log.error('Error updating preferences:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleBalanceVisibility = useCallback(() => {
    setPreferences((prev) => ({ ...prev, showBalance: !prev.showBalance }));
  }, []);

  const updateBuffrCardBalance = useCallback((amount: number) => {
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        buffrCardBalance: amount,
      };
    });
  }, []);

  const value: UserContextType = {
    user,
    preferences,
    loading,
    error,
    fetchUser,
    updateUser,
    updatePreferences,
    toggleBalanceVisibility,
    updateBuffrCardBalance,
    refreshUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
