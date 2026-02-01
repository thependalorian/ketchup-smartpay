/**
 * Card Transition Animation Component using Skia
 * 
 * Location: components/animations/CardTransition.tsx
 * Purpose: Smooth card transition animations for wallet cards
 * 
 * Features:
 * - Slide in/out animations
 * - Fade transitions
 * - Scale animations
 * - Used for wallet carousel and card switching
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Group, RoundedRect, useValue, withTiming, Easing, withSequence, withDelay } from '@shopify/react-native-skia';
import Colors from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CardTransitionProps {
  children: React.ReactNode;
  index: number;
  activeIndex: number;
  width?: number;
  height?: number;
  animationType?: 'slide' | 'fade' | 'scale';
}

export default function CardTransition({
  children,
  index,
  activeIndex,
  width = SCREEN_WIDTH * 0.85,
  height = 220,
  animationType = 'slide',
}: CardTransitionProps) {
  const translateX = useValue(0);
  const opacity = useValue(1);
  const scale = useValue(1);

  const isActive = index === activeIndex;
  const offset = index - activeIndex;

  useEffect(() => {
    if (animationType === 'slide') {
      translateX.current = withTiming(offset * (width + 20), {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    } else if (animationType === 'fade') {
      opacity.current = withTiming(isActive ? 1 : 0.3, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    } else if (animationType === 'scale') {
      scale.current = withTiming(isActive ? 1 : 0.9, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [activeIndex, animationType, isActive, offset]);

  return (
    <View style={[styles.container, { width, height }]}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Group
          transform={[
            { translateX },
            { scale },
          ]}
          opacity={opacity}
        >
          {/* Card shadow/background effect */}
          <RoundedRect
            x={0}
            y={0}
            width={width}
            height={height}
            r={20}
          >
            {/* Gradient background for transition effect */}
          </RoundedRect>
        </Group>
      </Canvas>
      
      {/* Content */}
      <View style={styles.content} pointerEvents={isActive ? 'auto' : 'none'}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
