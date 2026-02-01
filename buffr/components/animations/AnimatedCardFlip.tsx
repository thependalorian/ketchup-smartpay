/**
 * Animated Card Flip Component using Skia
 * 
 * Location: components/animations/AnimatedCardFlip.tsx
 * Purpose: 3D card flip animation using React Native Skia
 * 
 * Features:
 * - Smooth card flip animation (front to back)
 * - Balance reveal animation
 * - Card transition effects
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Canvas, Group, RoundedRect, LinearGradient, vec, useValue, useSharedValueEffect, withTiming, Easing } from '@shopify/react-native-skia';
import { useSharedValue, withSpring } from 'react-native-reanimated';
import Colors from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = 220;

interface AnimatedCardFlipProps {
  frontContent: React.ReactNode;
  backContent?: React.ReactNode;
  onFlip?: () => void;
  isFlipped?: boolean;
  showBalance?: boolean;
  balance?: number;
  currency?: string;
}

export default function AnimatedCardFlip({
  frontContent,
  backContent,
  onFlip,
  isFlipped = false,
  showBalance = true,
  balance = 0,
  currency = 'N$',
}: AnimatedCardFlipProps) {
  const rotation = useValue(0);
  const opacity = useValue(1);
  const balanceReveal = useValue(showBalance ? 1 : 0);

  // Animate rotation for flip effect
  useEffect(() => {
    rotation.current = withTiming(isFlipped ? 180 : 0, {
      duration: 600,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isFlipped]);

  // Animate balance reveal
  useEffect(() => {
    balanceReveal.current = withTiming(showBalance ? 1 : 0, {
      duration: 400,
      easing: Easing.out(Easing.ease),
    });
  }, [showBalance]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onFlip}
      style={styles.container}
    >
      <Canvas style={styles.canvas}>
        <Group
          transform={[
            { rotate: rotation },
            { translateX: CARD_WIDTH / 2 },
            { translateY: CARD_HEIGHT / 2 },
          ]}
        >
          {/* Card Background */}
          <RoundedRect
            x={-CARD_WIDTH / 2}
            y={-CARD_HEIGHT / 2}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            r={20}
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(CARD_WIDTH, CARD_HEIGHT)}
              colors={[Colors.primary, Colors.primaryDark]}
            />
          </RoundedRect>
        </Group>
      </Canvas>
      
      {/* Content Overlay */}
      <View style={styles.contentOverlay} pointerEvents="none">
        {!isFlipped ? frontContent : backContent || frontContent}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 8,
  },
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
  contentOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
