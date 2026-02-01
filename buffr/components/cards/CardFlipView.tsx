/**
 * CardFlipView Component
 * 
 * Location: components/cards/CardFlipView.tsx
 * 
 * Purpose: A reusable view that handles the 3D flip animation between a front
 * and a back component. It uses react-native-reanimated for performance.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { CardDimensions, CardAnimation } from '@/constants/CardDesign';
import HapticFeedbackManager from '@/utils/haptics';

interface CardFlipViewProps {
  front: React.ReactNode;
  back: React.ReactNode;
}

export default function CardFlipView({ front, back }: CardFlipViewProps) {
  const rotate = useSharedValue(0);

  const handlePress = () => {
    HapticFeedbackManager.lightImpact();
    rotate.value = withTiming(rotate.value === 0 ? 180 : 0, {
      duration: CardAnimation.FLIP_DURATION,
    });
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(rotate.value, [0, 180], [0, 180]);
    return {
      transform: [{ rotateY: `${rotation}deg` }],
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(rotate.value, [0, 180], [180, 360]);
    return {
      transform: [{ rotateY: `${rotation}deg` }],
    };
  });

  return (
    <Pressable onPress={handlePress}>
      <View style={styles.container}>
        <Animated.View style={[styles.card, styles.front, frontAnimatedStyle]}>
          {front}
        </Animated.View>
        <Animated.View style={[styles.card, styles.back, backAnimatedStyle]}>
          {back}
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CardDimensions.WIDTH,
    height: CardDimensions.HEIGHT,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  front: {
    // The front card is visible by default
  },
  back: {
    // The back card is rotated 180 degrees by default
    transform: [{ rotateY: '180deg' }],
  },
});
