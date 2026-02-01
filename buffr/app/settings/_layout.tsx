/**
 * Settings Layout
 * 
 * Location: app/settings/_layout.tsx
 * Purpose: Stack layout for settings screens
 */

import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="security" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="help" />
      <Stack.Screen name="about" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
