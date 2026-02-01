/**
 * OnboardingLayout Component
 * 
 * Location: components/onboarding/OnboardingLayout.tsx
 * Purpose: Shared layout wrapper for all onboarding screens
 * 
 * Design: Based on BuffrCrew/Buffr App Design
 * - Clean slate background
 * - Centered content
 * - Consistent spacing
 */

import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import Colors from '@/constants/Colors';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  backgroundColor?: string;
}

export default function OnboardingLayout({ 
  children, 
  backgroundColor = Colors.background 
}: OnboardingLayoutProps) {
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
