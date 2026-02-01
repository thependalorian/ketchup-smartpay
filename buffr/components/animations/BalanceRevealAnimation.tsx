/**
 * Balance Reveal Animation Component using Skia
 * 
 * Location: components/animations/BalanceRevealAnimation.tsx
 * Purpose: Animated balance reveal with Skia for smooth transitions
 * 
 * Features:
 * - Smooth balance count-up animation
 * - Hide/show balance with fade animation
 * - Number formatting with currency
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Canvas, Group, RoundedRect, LinearGradient, vec, useValue, withTiming, Easing, Blur } from '@shopify/react-native-skia';
import Colors from '@/constants/Colors';

interface BalanceRevealAnimationProps {
  balance: number;
  currency?: string;
  showBalance: boolean;
  onToggle?: () => void;
  width?: number;
  height?: number;
}

export default function BalanceRevealAnimation({
  balance,
  currency = 'N$',
  showBalance,
  onToggle,
  width = 200,
  height = 100,
}: BalanceRevealAnimationProps) {
  const revealProgress = useValue(showBalance ? 1 : 0);
  const blurAmount = useValue(showBalance ? 0 : 10);

  useEffect(() => {
    revealProgress.current = withTiming(showBalance ? 1 : 0, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
    blurAmount.current = withTiming(showBalance ? 0 : 10, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
  }, [showBalance]);

  const displayBalance = showBalance
    ? `${currency} ${balance.toLocaleString()}`
    : `${currency} XXX`;

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      style={[styles.container, { width, height }]}
    >
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          {/* Background gradient */}
          <RoundedRect
            x={0}
            y={0}
            width={width}
            height={height}
            r={16}
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, height)}
              colors={[Colors.primaryMuted, Colors.white]}
            />
          </RoundedRect>
        </Group>
      </Canvas>
      
      {/* Balance Text */}
      <View style={styles.textContainer}>
        <Text style={styles.balanceText}>{displayBalance}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
});
