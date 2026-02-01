/**
 * OnboardingButton Component
 * 
 * Location: components/onboarding/OnboardingButton.tsx
 * Purpose: Primary action button for onboarding screens
 * 
 * Design: Based on BuffrCrew/Buffr App Design
 * - Full width blue button
 * - Rounded corners
 * - Disabled state
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Colors from '@/constants/Colors';

interface OnboardingButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'text';
}

export default function OnboardingButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
}: OnboardingButtonProps) {
  const isDisabled = disabled || loading;

  if (variant === 'text') {
    return (
      <TouchableOpacity
        style={styles.textButton}
        onPress={onPress}
        disabled={isDisabled}
      >
        <Text style={[styles.textButtonText, isDisabled && styles.textButtonTextDisabled]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        style={[styles.secondaryButton, isDisabled && styles.buttonDisabled]}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <Text style={[styles.secondaryButtonText, isDisabled && styles.secondaryButtonTextDisabled]}>
            {title}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.primaryButton, isDisabled && styles.primaryButtonDisabled]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={Colors.white} />
      ) : (
        <Text style={styles.primaryButtonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: Colors.primary,  // ✅ #3D38ED
    paddingVertical: 10,  // ✅ buffr-mobile padding
    borderRadius: 40,  // ✅ buffr-mobile pill shape
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,  // ✅ buffr-mobile height
  },
  primaryButtonDisabled: {
    backgroundColor: Colors.primaryMuted,  // ✅ buffr-mobile primaryMuted
  },
  primaryButtonText: {
    fontSize: 18,  // ✅ buffr-mobile fontSize
    fontWeight: '500',  // ✅ buffr-mobile fontWeight
    color: Colors.white,
  },
  secondaryButton: {
    backgroundColor: Colors.lightGray,  // ✅ buffr-mobile lightGray
    paddingVertical: 10,  // ✅ buffr-mobile padding
    borderRadius: 40,  // ✅ buffr-mobile pill shape
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,  // ✅ buffr-mobile height
    borderWidth: 0,  // ✅ buffr-mobile no border
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  secondaryButtonText: {
    fontSize: 18,  // ✅ buffr-mobile fontSize
    fontWeight: '500',  // ✅ buffr-mobile fontWeight
    color: Colors.dark,  // ✅ buffr-mobile dark
  },
  secondaryButtonTextDisabled: {
    color: Colors.textTertiary,
  },
  textButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  textButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  textButtonTextDisabled: {
    color: Colors.textTertiary,
  },
});
