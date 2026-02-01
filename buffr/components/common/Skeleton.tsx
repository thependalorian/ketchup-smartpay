/**
 * Base Skeleton Component
 * 
 * Location: components/common/Skeleton.tsx
 * Purpose: Reusable skeleton loading component with shimmer effect
 * 
 * Features:
 * - Shimmer animation for perceived performance (Doherty Threshold)
 * - Flexible width and height
 * - Rounded corners support
 * - Matches app design system
 * 
 * @psychology
 * - **Doherty Threshold**: Skeleton screens show immediately (<100ms) 
 *   providing instant visual feedback, making the app feel faster than
 *   blank screens or spinners. Users perceive the app as responsive.
 * - **Skeleton Pattern**: Shows content structure while loading, reducing
 *   cognitive load by maintaining layout stability.
 * - **Shimmer Effect**: Animated shimmer indicates active loading state,
 *   preventing users from thinking the app is frozen.
 * 
 * @usage
 * ```tsx
 * <Skeleton width={100} height={20} borderRadius={8} />
 * <Skeleton width="100%" height={44} borderRadius={22} />
 * ```
 */

import React from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';
import ShimmerEffect from '@/components/animations/ShimmerEffect';
import Colors from '@/constants/Colors';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: object;
}

export default function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  return (
    <View
      style={[
        styles.container,
        { width, height, borderRadius },
        style,
      ]}
    >
      <ShimmerEffect width="100%" height="100%" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundGray,
    overflow: 'hidden',
  },
});
