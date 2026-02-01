/**
 * Glass Card Component
 *
 * Location: components/common/GlassCard.tsx
 * Purpose: Reusable glass morphism card with blur effect
 *
 * Features:
 * - Glass morphism effect with backdrop blur
 * - Platform-specific implementation (iOS BlurView, Android fallback)
 * - Customizable intensity and tint
 * - Supports children content
 * - Consistent styling across the app
 *
 * @psychology
 * - **Gestalt Figure-Ground**: Elevated glass surface creates clear visual
 *   separation from background, establishing content hierarchy. The blur
 *   effect reinforces depth perception.
 * - **Aesthetic-Usability Effect**: Glass morphism creates premium, polished
 *   appearance that improves perceived usability. Users perceive beautiful
 *   interfaces as more functional.
 * - **Gestalt Proximity**: Card boundary groups related content together,
 *   signaling that enclosed elements belong to the same functional unit.
 * - **Jakob's Law**: iOS users expect glass/blur effects from native apps,
 *   creating familiar, platform-consistent experience.
 *
 * @accessibility
 * - Ensure sufficient contrast for content within card
 * - Consider reduced transparency for accessibility settings
 *
 * @see constants/Shadows.ts for SemanticShadows.card
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, Platform, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import Colors from '@/constants/Colors';

interface GlassCardProps {
  children: React.ReactNode;
  intensity?: number; // Blur intensity (0-100)
  tint?: 'light' | 'dark' | 'default';
  style?: StyleProp<ViewStyle>;
  padding?: number;
  borderRadius?: number;
  backgroundColor?: string; // Fallback for Android
  // Accessibility props
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'none' | 'button' | 'link' | 'image' | 'text' | 'header' | 'summary';
}

export default function GlassCard({
  children,
  intensity = 80,
  tint = 'light',
  style,
  padding = 16,
  borderRadius = 16,
  backgroundColor,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
}: GlassCardProps) {
  const containerStyle: StyleProp<ViewStyle> = [
    {
      padding,
      borderRadius,
      overflow: 'hidden',
    },
    style,
  ];

  const accessibilityProps = {
    accessibilityLabel,
    accessibilityHint,
    accessibilityRole,
  };

  // iOS: Use BlurView for true glass effect
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={intensity}
        tint={tint}
        style={containerStyle}
        {...accessibilityProps}
      >
        {children}
      </BlurView>
    );
  }

  // Android: Use semi-transparent background with shadow
  return (
    <View
      style={[
        containerStyle,
        {
          backgroundColor: backgroundColor || Colors.white + 'E6', // 90% opacity
          shadowColor: Colors.dark,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        },
      ]}
      {...accessibilityProps}
    >
      {children}
    </View>
  );
}
