/**
 * Onboarding Layout
 * 
 * Location: app/onboarding/_layout.tsx
 * Purpose: Stack navigation for onboarding flow
 * 
 * Flow: Welcome -> Phone -> OTP -> Name -> Photo -> FaceID -> Complete
 */

import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
        gestureEnabled: false, // Prevent back swipe during onboarding
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="phone" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="name" />
      <Stack.Screen name="photo" />
      <Stack.Screen name="faceid" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}
