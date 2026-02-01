/**
 * Progress Celebration Animation Component
 *
 * Location: components/animations/ProgressCelebration.tsx
 * Purpose: Animated celebrations for progress milestones, quest completion, and achievements
 *
 * HIG Compliance:
 * - Respects reduced motion accessibility setting
 * - Provides visual and haptic feedback
 * - Uses native animations via Reanimated for performance
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { questComplete, achievementUnlock, pointsEarned } from '@/utils/haptics';
import Colors from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CelebrationType = 'quest' | 'achievement' | 'milestone' | 'streak' | 'points';

interface ProgressCelebrationProps {
  /** Whether to show the celebration */
  visible: boolean;
  /** Type of celebration */
  type: CelebrationType;
  /** Title text */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Points earned (if applicable) */
  points?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Animation duration in ms (default: 2000) */
  duration?: number;
}

const CELEBRATION_CONFIG: Record<CelebrationType, {
  icon: string;
  color: string;
  haptic: () => void;
}> = {
  quest: {
    icon: 'check-circle',
    color: Colors.success,
    haptic: questComplete,
  },
  achievement: {
    icon: 'trophy',
    color: '#F59E0B',
    haptic: achievementUnlock,
  },
  milestone: {
    icon: 'star',
    color: Colors.primary,
    haptic: achievementUnlock,
  },
  streak: {
    icon: 'fire',
    color: '#EF4444',
    haptic: achievementUnlock,
  },
  points: {
    icon: 'plus-circle',
    color: Colors.success,
    haptic: pointsEarned,
  },
};

/**
 * Animated celebration for various progress milestones
 *
 * @example
 * ```tsx
 * <ProgressCelebration
 *   visible={showCelebration}
 *   type="quest"
 *   title="Quest Complete!"
 *   subtitle="Daily Login"
 *   points={50}
 *   onComplete={() => setShowCelebration(false)}
 * />
 * ```
 */
export function ProgressCelebration({
  visible,
  type,
  title,
  subtitle,
  points,
  onComplete,
  duration = 2000,
}: ProgressCelebrationProps) {
  const reduceMotion = useReducedMotion();
  const config = CELEBRATION_CONFIG[type];

  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const iconScale = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const pointsScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      config.haptic();

      if (reduceMotion) {
        // Simplified animation for reduced motion
        opacity.value = withTiming(1, { duration: 150 });
        scale.value = 1;
        iconScale.value = 1;
        textTranslateY.value = 0;
        if (points) pointsScale.value = 1;

        // Auto-dismiss
        const timeout = setTimeout(() => {
          opacity.value = withTiming(0, { duration: 150 });
          if (onComplete) {
            setTimeout(onComplete, 150);
          }
        }, duration - 300);

        return () => clearTimeout(timeout);
      }

      // Full animation sequence
      opacity.value = withTiming(1, { duration: 200 });

      // Icon bounce in
      iconScale.value = withSequence(
        withSpring(1.3, { damping: 6, stiffness: 150 }),
        withSpring(1, { damping: 10, stiffness: 100 })
      );

      // Container scale
      scale.value = withSpring(1, { damping: 12, stiffness: 100 });

      // Text slide up
      textTranslateY.value = withDelay(
        150,
        withTiming(0, { duration: 300, easing: Easing.out(Easing.back(1.5)) })
      );

      // Points pop in
      if (points) {
        pointsScale.value = withDelay(
          300,
          withSequence(
            withSpring(1.2, { damping: 8, stiffness: 150 }),
            withSpring(1, { damping: 12, stiffness: 100 })
          )
        );
      }

      // Auto-dismiss
      const timeout = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 });
        scale.value = withTiming(0.8, { duration: 300 });
        if (onComplete) {
          setTimeout(onComplete, 300);
        }
      }, duration - 300);

      return () => clearTimeout(timeout);
    } else {
      // Reset values
      opacity.value = 0;
      scale.value = 0.5;
      iconScale.value = 0;
      textTranslateY.value = 20;
      pointsScale.value = 0;
    }
  }, [visible, reduceMotion, duration, onComplete, points, config]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: textTranslateY.value }],
    opacity: textTranslateY.value === 0 ? 1 : 1 - textTranslateY.value / 20,
  }));

  const pointsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pointsScale.value }],
  }));

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Icon */}
        <Animated.View style={[styles.iconContainer, iconStyle, { backgroundColor: config.color }]}>
          <FontAwesome name={config.icon as any} size={32} color="#fff" />
        </Animated.View>

        {/* Text */}
        <Animated.View style={[styles.textContainer, textStyle]}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </Animated.View>

        {/* Points Badge */}
        {points !== undefined && points > 0 && (
          <Animated.View style={[styles.pointsBadge, pointsStyle]}>
            <Text style={styles.pointsText}>+{points}</Text>
            <FontAwesome name="star" size={14} color="#F59E0B" style={styles.pointsIcon} />
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    minWidth: 200,
    maxWidth: SCREEN_WIDTH - 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D97706',
    marginRight: 4,
  },
  pointsIcon: {
    marginLeft: 2,
  },
});

export default ProgressCelebration;
