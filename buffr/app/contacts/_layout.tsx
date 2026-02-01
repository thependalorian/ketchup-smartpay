/**
 * Contacts Layout
 * 
 * Location: app/contacts/_layout.tsx
 * Purpose: Stack layout for contacts screens
 */

import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';

export default function ContactsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
    </Stack>
  );
}
