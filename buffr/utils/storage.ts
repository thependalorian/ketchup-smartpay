/**
 * Platform-Safe Storage Utility
 * 
 * Location: utils/storage.ts
 * Purpose: Provides a unified storage API that works across all platforms
 * 
 * - Uses expo-secure-store on native (iOS/Android)
 * - Falls back to AsyncStorage on web (SecureStore not available)
 * 
 * Features:
 * - Consistent API across platforms
 * - Error handling with fallbacks
 * - Type-safe storage operations
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger, { log } from '@/utils/logger';

// Storage interface for type safety
interface StorageInterface {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  deleteItem: (key: string) => Promise<void>;
}

// Check if we're on a native platform where SecureStore is available
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

// Lazy-load SecureStore only on native platforms to avoid errors on web
let SecureStore: typeof import('expo-secure-store') | null = null;

const loadSecureStore = async () => {
  if (isNative && !SecureStore) {
    try {
      SecureStore = await import('expo-secure-store');
    } catch (error) {
      logger.warn('SecureStore not available, using AsyncStorage fallback');
      SecureStore = null;
    }
  }
  return SecureStore;
};

/**
 * Get an item from storage
 * Uses SecureStore on native, AsyncStorage on web
 */
export const getItemAsync = async (key: string): Promise<string | null> => {
  try {
    if (isNative) {
      const store = await loadSecureStore();
      if (store) {
        return await store.getItemAsync(key);
      }
    }
    // Fallback to AsyncStorage
    return await AsyncStorage.getItem(key);
  } catch (error) {
    log.error(`Storage getItem error for key "${key}":`, error);
    // Final fallback - try AsyncStorage
    try {
      return await AsyncStorage.getItem(key);
    } catch (fallbackError) {
      log.error('AsyncStorage fallback failed:', fallbackError);
      return null;
    }
  }
};

/**
 * Set an item in storage
 * Uses SecureStore on native, AsyncStorage on web
 */
export const setItemAsync = async (key: string, value: string): Promise<void> => {
  try {
    if (isNative) {
      const store = await loadSecureStore();
      if (store) {
        await store.setItemAsync(key, value);
        return;
      }
    }
    // Fallback to AsyncStorage
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    log.error(`Storage setItem error for key "${key}":`, error);
    // Final fallback - try AsyncStorage
    try {
      await AsyncStorage.setItem(key, value);
    } catch (fallbackError) {
      log.error('AsyncStorage fallback failed:', fallbackError);
      throw fallbackError;
    }
  }
};

/**
 * Delete an item from storage
 * Uses SecureStore on native, AsyncStorage on web
 */
export const deleteItemAsync = async (key: string): Promise<void> => {
  try {
    if (isNative) {
      const store = await loadSecureStore();
      if (store) {
        await store.deleteItemAsync(key);
        return;
      }
    }
    // Fallback to AsyncStorage
    await AsyncStorage.removeItem(key);
  } catch (error) {
    log.error(`Storage deleteItem error for key "${key}":`, error);
    // Final fallback - try AsyncStorage
    try {
      await AsyncStorage.removeItem(key);
    } catch (fallbackError) {
      log.error('AsyncStorage fallback failed:', fallbackError);
      throw fallbackError;
    }
  }
};

/**
 * Check if SecureStore is available (native platforms only)
 */
export const isSecureStoreAvailable = async (): Promise<boolean> => {
  if (!isNative) return false;
  const store = await loadSecureStore();
  return store !== null;
};

// Export a unified storage object for convenience
export const Storage = {
  getItem: getItemAsync,
  setItem: setItemAsync,
  deleteItem: deleteItemAsync,
  isSecureStoreAvailable,
};

export default Storage;
