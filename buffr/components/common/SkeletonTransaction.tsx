/**
 * Skeleton Transaction Component
 * 
 * Location: components/common/SkeletonTransaction.tsx
 * Purpose: Loading skeleton for transaction list items matching TransactionListItem design
 * 
 * Features:
 * - Matches TransactionListItem layout and dimensions
 * - Shimmer animation
 * - Glass card styling
 * 
 * @psychology
 * - **Doherty Threshold**: Shows transaction structure immediately while data loads
 * - **Layout Stability**: Maintains list item positions preventing layout shift
 * - **Visual Continuity**: Matches final component appearance
 * 
 * @usage
 * ```tsx
 * <SkeletonTransaction />
 * 
 * // Multiple skeletons for list
 * {[1, 2, 3, 4, 5].map((i) => (
 *   <SkeletonTransaction key={i} />
 * ))}
 * ```
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from './Skeleton';
import GlassCard from './GlassCard';
import Colors from '@/constants/Colors';

export default function SkeletonTransaction() {
  return (
    <GlassCard style={styles.container} padding={16} borderRadius={16}>  // ✅ buffr-mobile style
      <View style={styles.content}>
        {/* Icon skeleton */}
        <Skeleton width={40} height={40} borderRadius={20} />

        {/* Text content skeleton */}
        <View style={styles.textContainer}>
          {/* Title row */}
          <View style={styles.titleRow}>
            <Skeleton width={180} height={16} borderRadius={4} />
            <Skeleton width={60} height={20} borderRadius={10} />
          </View>
          
          {/* Meta row */}
          <View style={styles.metaRow}>
            <Skeleton width={120} height={12} borderRadius={4} />
            <Skeleton width={100} height={12} borderRadius={4} />
          </View>
        </View>

        {/* Amount skeleton */}
        <View style={styles.amountContainer}>
          <Skeleton width={80} height={16} borderRadius={4} />
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textContainer: {
    flex: 1,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
});
