/**
 * User Inactivity Provider
 * 
 * Location: contexts/UserInactivity.tsx
 * Purpose: Monitor user inactivity and lock the app after background time
 * 
 * Features:
 * - Tracks when app goes to background
 * - Locks app if user returns after 3+ seconds
 * - Uses MMKV for fast storage
 * - Integrates with Clerk authentication
 * 
 * Design: Based on buffr-mobile implementation
 */

import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({
  id: 'inactivity-storage',
});

interface UserInactivityProviderProps {
  children: React.ReactNode;
}

export const UserInactivityProvider = ({ children }: UserInactivityProviderProps) => {
  const appState = useRef(AppState.currentState);
  const router = useRouter();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    console.log('🚀 ~ handleAppStateChange ~ nextAppState', nextAppState);

    if (nextAppState === 'background') {
      recordStartTime();
    } else if (nextAppState === 'active' && appState.current.match(/background/)) {
      const elapsed = Date.now() - (storage.getNumber('startTime') || 0);
      console.log('🚀 ~ handleAppStateChange ~ elapsed:', elapsed);

      if (elapsed > 3000 && isSignedIn) {
        // Navigate to lock screen (create if doesn't exist)
        router.replace('/lock');
      }
    }
    appState.current = nextAppState;
  };

  const recordStartTime = () => {
    storage.set('startTime', Date.now());
  };

  return <>{children}</>;
};
