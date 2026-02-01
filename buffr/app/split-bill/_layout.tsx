/**
 * Split Bill Layout
 * 
 * Location: app/split-bill/_layout.tsx
 * Purpose: Layout configuration for split bill screens
 */

import { Stack } from 'expo-router';

export default function SplitBillLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="create" />
    </Stack>
  );
}
