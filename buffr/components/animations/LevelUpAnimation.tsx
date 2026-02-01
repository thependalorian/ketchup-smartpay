/**
 * Level Up Animation Component
 *
 * Location: components/animations/LevelUpAnimation.tsx
 * Purpose: Celebratory animation when user reaches a new level
 *
 * HIG Compliance:
 * - Respects reduced motion accessibility setting
 * - Provides visual and haptic feedback
 * - Auto-dismisses after animation completes
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
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { levelUp as levelUpHaptic } from '@/utils/haptics';
import Colors, { levelColors } from '@/constants/Colors';
import { Confetti } from './Confetti';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LevelUpAnimationProps {
  /** Whether to show the animation */
  visible: boolean;
  /** The new level reached */
  level: number;
  /** Level name (e.g., "Rising Star") */
  levelName: string;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Animation duration in ms (default: 3000) */
  duration?: number;
}

/**
 * Full-screen level up celebration animation
 *
 * @example
 * ```tsx
 * const [showLevelUp, setShowLevelUp] = useState(false);
 * const [newLevel, setNewLevel] = useState(1);
 *
 * <LevelUpAnimation
 *   visible={showLevelUp}
 *   level={newLevel}
 *   levelName="Rising Star"
 *   onComplete={() => setShowLevelUp(false)}
 * />
 * ```
 */
export function LevelUpAnimation({
  visible,
  level,
  levelName,
  onComplete,
  duration = 3000,
}: LevelUpAnimationProps) {
  const reduceMotion = useReducedMotion();

  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const badgeScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  // Get level color
  const levelColor = levelColors[Math.min(level - 1, levelColors.length - 1)] || Colors.primary;

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      levelUpHaptic();

      if (reduceMotion) {
        // Simplified animation for reduced motion
        opacity.value = withTiming(1, { duration: 200 });
        scale.value = 1;
        badgeScale.value = 1;
        textOpacity.value = 1;

        // Auto-dismiss
        const timeout = setTimeout(() => {
          opacity.value = withTiming(0, { duration: 200 });
          if (onComplete) {
            setTimeout(onComplete, 200);
          }
        }, duration - 400);

        return () => clearTimeout(timeout);
      }

      // Full animation sequence
      opacity.value = withTiming(1, { duration: 300 });

      // Background glow pulse
      glowOpacity.value = withSequence(
        withTiming(0.8, { duration: 500 }),
        withTiming(0.3, { duration: 500 }),
        withTiming(0.6, { duration: 500 }),
        withTiming(0.2, { duration: duration - 1500 })
      );

      // Main scale animation
      scale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 100 }),
        withTiming(1, { duration: 300 })
      );

      // Badge bounce in
      badgeScale.value = withDelay(
        200,
        withSequence(
          withSpring(1.3, { damping: 6, stiffness: 150 }),
          withSpring(1, { damping: 10, stiffness: 100 })
        )
      );

      // Text fade in
      textOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));

      // Auto-dismiss
      const timeout = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 400 });
        if (onComplete) {
          setTimeout(onComplete, 400);
        }
      }, duration - 400);

      return () => clearTimeout(timeout);
    } else {
      // Reset values when hidden
      opacity.value = 0;
      scale.value = 0.5;
      badgeScale.value = 0;
      textOpacity.value = 0;
      glowOpacity.value = 0;
    }
  }, [visible, reduceMotion, duration, onComplete]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Background overlay */}
      <View style={styles.overlay} />

      {/* Glow effect */}
      {!reduceMotion && (
        <Animated.View style={[styles.glowContainer, glowStyle]}>
          <LinearGradient
            colors={[levelColor, 'transparent']}
            style={styles.glow}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 0.5, y: 0 }}
          />
        </Animated.View>
      )}

      {/* Main content */}
      <Animated.View style={[styles.content, contentStyle]}>
        {/* Level badge */}
        <Animated.View style={[styles.badgeContainer, badgeStyle]}>
          <LinearGradient
            colors={[levelColor, Colors.primaryDark]}
            style={styles.badge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <FontAwesome name="star" size={40} color="#fff" />
            <Text style={styles.levelNumber}>{level}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Text */}
        <Animated.View style={[styles.textContainer, textStyle]}>
          <Text style={styles.title}>LEVEL UP!</Text>
          <Text style={styles.levelName}>{levelName}</Text>
          <Text style={styles.subtitle}>Congratulations!</Text>
        </Animated.View>
      </Animated.View>

      {/* Confetti */}
      {!reduceMotion && (
        <Confetti
          trigger={visible}
          colors={[levelColor, Colors.success, Colors.warning, '#8B5CF6']}
          count={40}
          duration={duration - 500}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    marginBottom: 24,
  },
  badge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  levelNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 4,
    marginBottom: 8,
  },
  levelName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default LevelUpAnimation;
