/**
 * Page Transition Animation Component using Reanimated
 * 
 * Location: components/animations/PageTransition.tsx
 * Purpose: Smooth page transitions for navigation
 * 
 * Features:
 * - Slide transitions (left, right, up, down)
 * - Fade transitions
 * - Scale transitions
 * - Combined transitions
 */

import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
  SlideInUp,
  SlideOutDown,
  SlideInDown,
  SlideOutUp,
} from 'react-native-reanimated';

interface PageTransitionProps {
  children: React.ReactNode;
  type?: 'slide' | 'fade' | 'scale' | 'slideUp' | 'slideDown';
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  delay?: number;
}

export default function PageTransition({
  children,
  type = 'slide',
  direction = 'right',
  duration = 300,
  delay = 0,
}: PageTransitionProps) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(direction === 'right' ? 50 : direction === 'left' ? -50 : 0);
  const translateY = useSharedValue(direction === 'down' ? 50 : direction === 'up' ? -50 : 0);
  const scale = useSharedValue(type === 'scale' ? 0.9 : 1);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.ease),
      });
      translateX.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  // Use built-in transitions for better performance
  const entering = type === 'fade' 
    ? FadeIn.duration(duration).delay(delay)
    : type === 'slide' && direction === 'right'
    ? SlideInRight.duration(duration).delay(delay)
    : type === 'slide' && direction === 'left'
    ? SlideInLeft.duration(duration).delay(delay)
    : type === 'slideUp'
    ? SlideInUp.duration(duration).delay(delay)
    : type === 'slideDown'
    ? SlideInDown.duration(duration).delay(delay)
    : FadeIn.duration(duration).delay(delay);

  const exiting = type === 'fade'
    ? FadeOut.duration(duration)
    : type === 'slide' && direction === 'right'
    ? SlideOutLeft.duration(duration)
    : type === 'slide' && direction === 'left'
    ? SlideOutRight.duration(duration)
    : type === 'slideUp'
    ? SlideOutDown.duration(duration)
    : type === 'slideDown'
    ? SlideOutUp.duration(duration)
    : FadeOut.duration(duration);

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      entering={entering}
      exiting={exiting}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
