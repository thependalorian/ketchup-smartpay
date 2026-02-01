// Must be imported first for react-native-gesture-handler
import 'react-native-gesture-handler';

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

// Composed providers (KISS principle - single provider instead of 7 nested)
import { AppProviders } from '@/providers/AppProviders';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
      // Don't throw - allow app to continue with system fonts
      // Error boundary will catch if needed
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch((err) => {
        console.warn('Failed to hide splash screen:', err);
      });
    }
  }, [loaded]);

  // Show app even if fonts fail to load (will use system fonts)
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <AppProviders>
      <Stack
        screenOptions={{
          animation: 'fade',
          animationDuration: 200,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="transactions/[id]" options={{ headerShown: false, presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="transactions/category/[categoryId]" options={{ headerShown: false, presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="wallets/[id]" options={{ headerShown: false, presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="wallets/[id]/history" options={{ headerShown: false, presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="wallets/[id]/add-money" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="wallets/[id]/transfer" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="wallets/[id]/settings" options={{ headerShown: false, presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="add-wallet" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="add-card" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="add-bank" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="cards" options={{ headerShown: false, presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="cards/[id]" options={{ headerShown: false, presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="cards/buffr-account" options={{ headerShown: false, presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="send-money" options={{ headerShown: false }} />
        <Stack.Screen name="qr-code" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="qr-scanner" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="profile" options={{ headerShown: false, presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="lock" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="admin/smartpay-monitoring" options={{ headerShown: false, presentation: 'card', animation: 'slide_from_right' }} />
      </Stack>
    </AppProviders>
  );
}
