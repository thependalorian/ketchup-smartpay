/**
 * MMKV Storage Adapter for Zustand
 * 
 * Location: store/mmkv-storage.ts
 * Purpose: Provides MMKV storage adapter for Zustand persistence
 * 
 * Features:
 * - Fast, synchronous storage using MMKV
 * - Compatible with Zustand's persist middleware
 * - Type-safe storage interface
 * 
 * Design: Based on buffr-mobile implementation
 */

import { StateStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({
  id: 'buffr-storage',
});

export const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    return storage.set(name, value);
  },
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    return storage.delete(name);
  },
};
