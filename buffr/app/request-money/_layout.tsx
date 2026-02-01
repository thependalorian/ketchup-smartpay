/**
 * Request Money Flow Layout
 * 
 * Location: app/request-money/_layout.tsx
 * Purpose: Layout for request money flow screens
 * 
 * Manages navigation between request money steps
 */

import { Stack } from 'expo-router';

export default function RequestMoneyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'card',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="select-recipient" />
      <Stack.Screen name="enter-amount" />
      <Stack.Screen name="confirm" />
    </Stack>
  );
}
