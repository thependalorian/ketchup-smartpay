/**
 * ShimmerEffect Component
 * 
 * Location: components/animations/ShimmerEffect.tsx
 * 
 * Purpose: A reusable loading shimmer animation. It creates a sweeping
 * gradient effect that can be overlaid on any component to indicate a 
 * loading state.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

interface ShimmerEffectProps {
  width?: DimensionValue;
  height?: DimensionValue;
}

export default function ShimmerEffect({ width: propWidth = '100%', height: propHeight = '100%' }: ShimmerEffectProps) {
  // Ensure we have numeric values for animation
  const numericWidth = typeof propWidth === 'number' ? propWidth : screenWidth;
  const width = propWidth;
  const height = propHeight;
  const translateX = useSharedValue(-numericWidth);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(numericWidth, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1, // Infinite repeat
      false // Do not reverse
    );
  }, [numericWidth]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View style={[styles.container, { width, height }]}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            Colors.white + '33',
            Colors.white + '80',
            Colors.white + '33',
            'transparent',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundSecondary, // Base color for the shimmer
    overflow: 'hidden',
  },
});
