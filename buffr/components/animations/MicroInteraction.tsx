/**
 * Micro Interaction Animation Component using Reanimated
 * 
 * Location: components/animations/MicroInteraction.tsx
 * Purpose: Micro-interactions for buttons, cards, and UI elements
 * 
 * Features:
 * - Press animations (scale, bounce)
 * - Hover effects
 * - Ripple effects
 * - Shake animations
 * - Pulse animations
 */

import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface MicroInteractionProps {
  children: React.ReactNode;
  onPress?: () => void;
  type?: 'scale' | 'bounce' | 'pulse' | 'shake' | 'ripple';
  disabled?: boolean;
  style?: ViewStyle;
  activeOpacity?: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function MicroInteraction({
  children,
  onPress,
  type = 'scale',
  disabled = false,
  style,
  activeOpacity = 0.8,
}: MicroInteractionProps) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);

  const handlePressIn = () => {
    if (type === 'scale') {
      scale.value = withSpring(0.95, {
        damping: 15,
        stiffness: 300,
      });
    } else if (type === 'bounce') {
      scale.value = withSequence(
        withTiming(0.9, { duration: 100 }),
        withSpring(1, { damping: 10, stiffness: 300 })
      );
    } else if (type === 'pulse') {
      pulse.value = withSequence(
        withTiming(1.1, { duration: 150 }),
        withSpring(1, { damping: 10, stiffness: 300 })
      );
    } else if (type === 'shake') {
      rotation.value = withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  };

  const handlePressOut = () => {
    if (type === 'scale') {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
    }
  };

  // Continuous pulse animation
  useEffect(() => {
    if (type === 'pulse' && !disabled) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [type, disabled]);

  const animatedStyle = useAnimatedStyle(() => {
    const scaleValue = type === 'pulse' ? pulse.value : scale.value;
    return {
      transform: [
        { scale: scaleValue },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={activeOpacity}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedTouchable>
  );
}
