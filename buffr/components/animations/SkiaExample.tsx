/**
 * Skia Example Component
 * 
 * Location: components/animations/SkiaExample.tsx
 * Purpose: Example component demonstrating React Native Skia usage
 * 
 * This component serves as a reference for implementing Skia-based animations
 * in the Buffr app. Use this as a template for card animations, transitions, etc.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Circle, Group } from '@shopify/react-native-skia';
import Colors from '@/constants/Colors';

interface SkiaExampleProps {
  width?: number;
  height?: number;
}

export default function SkiaExample({ width = 200, height = 200 }: SkiaExampleProps) {
  return (
    <View style={styles.container}>
      <Canvas style={{ width, height }}>
        <Group>
          {/* Example: Animated circle - replace with card animations */}
          <Circle
            cx={width / 2}
            cy={height / 2}
            r={50}
            color={Colors.primary}
          />
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
