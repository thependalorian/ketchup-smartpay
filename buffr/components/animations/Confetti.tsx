/**
 * Confetti Animation Component
 *
 * Location: components/animations/Confetti.tsx
 * Purpose: Celebratory confetti burst for achievements, level ups, and milestones
 *
 * HIG Compliance:
 * - Respects reduced motion accessibility setting
 * - Uses performant native animations via Reanimated
 * - Auto-cleans up after animation completes
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import Colors from '@/constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  color: string;
  rotation: number;
  size: number;
}

interface ConfettiProps {
  /** Whether the confetti animation should play */
  trigger: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Custom colors for confetti pieces */
  colors?: string[];
  /** Number of confetti pieces (default: 30) */
  count?: number;
  /** Animation duration in ms (default: 2000) */
  duration?: number;
}

const DEFAULT_COLORS = [
  Colors.primary,
  Colors.success,
  Colors.warning,
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Gold
];

/**
 * Single confetti piece component
 */
function ConfettiPieceView({
  piece,
  trigger,
  duration,
  reduceMotion,
}: {
  piece: ConfettiPiece;
  trigger: boolean;
  duration: number;
  reduceMotion: boolean;
}) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(piece.x);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    if (trigger && !reduceMotion) {
      // Reset values
      translateY.value = -50;
      translateX.value = piece.x;
      rotate.value = 0;
      opacity.value = 1;
      scale.value = 0;

      // Animate
      scale.value = withDelay(
        piece.delay,
        withSequence(
          withTiming(1, { duration: 100, easing: Easing.out(Easing.back(1.5)) }),
          withDelay(duration - 300, withTiming(0, { duration: 200 }))
        )
      );

      translateY.value = withDelay(
        piece.delay,
        withTiming(SCREEN_HEIGHT + 100, {
          duration: duration,
          easing: Easing.in(Easing.quad),
        })
      );

      translateX.value = withDelay(
        piece.delay,
        withTiming(piece.x + (Math.random() - 0.5) * 200, {
          duration: duration,
          easing: Easing.inOut(Easing.sin),
        })
      );

      rotate.value = withDelay(
        piece.delay,
        withTiming(piece.rotation + 720, {
          duration: duration,
          easing: Easing.linear,
        })
      );

      opacity.value = withDelay(
        piece.delay + duration - 300,
        withTiming(0, { duration: 300 })
      );
    }
  }, [trigger, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  if (reduceMotion) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        animatedStyle,
        {
          backgroundColor: piece.color,
          width: piece.size,
          height: piece.size * 1.5,
        },
      ]}
    />
  );
}

/**
 * Confetti burst animation for celebrations
 *
 * @example
 * ```tsx
 * const [showConfetti, setShowConfetti] = useState(false);
 *
 * // Trigger confetti
 * setShowConfetti(true);
 *
 * <Confetti
 *   trigger={showConfetti}
 *   onComplete={() => setShowConfetti(false)}
 * />
 * ```
 */
export function Confetti({
  trigger,
  onComplete,
  colors = DEFAULT_COLORS,
  count = 30,
  duration = 2000,
}: ConfettiProps) {
  const reduceMotion = useReducedMotion();

  // Generate confetti pieces
  const pieces = useMemo(() => {
    const result: ConfettiPiece[] = [];
    for (let i = 0; i < count; i++) {
      result.push({
        id: i,
        x: Math.random() * SCREEN_WIDTH,
        delay: Math.random() * 300,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        size: 8 + Math.random() * 8,
      });
    }
    return result;
  }, [count, colors]);

  // Handle completion callback
  useEffect(() => {
    if (trigger && onComplete) {
      const timeout = setTimeout(() => {
        onComplete();
      }, duration + 500);
      return () => clearTimeout(timeout);
    }
  }, [trigger, onComplete, duration]);

  if (!trigger || reduceMotion) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPieceView
          key={piece.id}
          piece={piece}
          trigger={trigger}
          duration={duration}
          reduceMotion={reduceMotion}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    borderRadius: 2,
  },
});

export default Confetti;
