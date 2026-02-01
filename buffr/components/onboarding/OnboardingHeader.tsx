/**
 * OnboardingHeader Component
 * 
 * Location: components/onboarding/OnboardingHeader.tsx
 * Purpose: Header with back button and progress indicator for onboarding
 * 
 * Design: Based on BuffrCrew/Buffr App Design
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING, CARD_GAP } from '@/constants/Layout';

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  showBack?: boolean;
}

export default function OnboardingHeader({ 
  currentStep, 
  totalSteps, 
  onBack, 
  showBack = true 
}: OnboardingHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Back Button */}
      <View style={styles.backContainer}>
        {showBack && onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <FontAwesome name="arrow-left" size={20} color={Colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Indicators */}
      <View style={styles.progressContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index <= currentStep && styles.progressDotActive,
              index < currentStep && styles.progressDotCompleted,
            ]}
          />
        ))}
      </View>

      {/* Spacer for balance */}
      <View style={styles.backContainer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 16,
  },
  backContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.slate100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.slate200,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  progressDotCompleted: {
    width: 8,
    backgroundColor: Colors.primary,
  },
});
