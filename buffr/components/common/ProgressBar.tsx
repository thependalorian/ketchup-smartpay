/**
 * Progress Bar Component
 *
 * Location: components/common/ProgressBar.tsx
 * Purpose: Reusable animated progress bar with label and percentage support
 *
 * Features:
 * - Animated progress
 * - Color variants
 * - Label support
 * - Percentage display
 * - Customizable height and styling
 *
 * @psychology
 * - **Goal-Gradient Effect**: Users accelerate behavior as they approach a goal.
 *   The animated fill creates momentum. Consider using ease-in curves to
 *   visually accelerate progress near completion.
 * - **Miller's Law**: When showing multiple progress bars (e.g., savings goals),
 *   limit to 7±2 items. Chunk progress into segments (25%, 50%, 75%, 100%)
 *   for easier mental processing.
 * - **Doherty Threshold**: Animation duration of 500ms is acceptable for
 *   progress feedback. For critical actions, ensure initial feedback < 100ms.
 * - **Aesthetic-Usability**: Smooth animation (useNativeDriver where possible)
 *   improves perceived quality and usability.
 *
 * @enhancement Consider adding:
 * - Haptic feedback at milestones (25%, 50%, 75%, 100%)
 * - Celebration animation on 100% completion
 * - Segmented variant for step-based progress
 *
 * @see .cursorrules for Goal-Gradient implementation patterns
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Colors from '@/constants/Colors';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  color?: string;
  backgroundColor?: string;
  height?: number;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function ProgressBar({
  progress,
  label,
  showPercentage = false,
  color = Colors.primary,
  backgroundColor = Colors.border,
  height = 8,
  animated = true,
  style,
}: ProgressBarProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: Math.min(Math.max(progress, 0), 100),
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(Math.min(Math.max(progress, 0), 100));
    }
  }, [progress, animated, animatedValue]);

  const widthInterpolation = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const staticWidth = `${Math.min(Math.max(progress, 0), 100)}%` as `${number}%`;

  return (
    <View style={[styles.container, style]}>
      {(label || showPercentage) && (
        <View style={styles.header}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showPercentage && (
            <Text style={styles.percentage}>
              {Math.round(Math.min(Math.max(progress, 0), 100))}%
            </Text>
          )}
        </View>
      )}
      <View
        style={[
          styles.progressBarBackground,
          { height, backgroundColor },
        ]}
      >
        {animated ? (
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: widthInterpolation,
                height,
                backgroundColor: color,
              },
            ]}
          />
        ) : (
          <View
            style={[
              styles.progressBarFill,
              {
                width: staticWidth,
                height,
                backgroundColor: color,
              },
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  progressBarBackground: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    borderRadius: 4,
  },
});
