/**
 * Skeleton Wallet Component
 * 
 * Location: components/common/SkeletonWallet.tsx
 * Purpose: Loading skeleton for wallet cards matching WalletCard design
 * 
 * Features:
 * - Matches WalletCard layout and dimensions
 * - Shimmer animation
 * - Supports both simple and detailed card views
 * 
 * @psychology
 * - **Doherty Threshold**: Shows wallet structure immediately while data loads
 * - **Layout Stability**: Maintains card positions preventing layout shift
 * - **Visual Continuity**: Matches final component appearance
 * 
 * @usage
 * ```tsx
 * // Simple card view
 * <SkeletonWallet />
 * 
 * // Detailed card view
 * <SkeletonWallet detailed />
 * ```
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from './Skeleton';
import Colors from '@/constants/Colors';

interface SkeletonWalletProps {
  detailed?: boolean;
  width?: number;
}

export default function SkeletonWallet({
  detailed = false,
  width,
}: SkeletonWalletProps) {
  // Detailed card view (matches WalletCard with CardFrame)
  if (detailed) {
    return (
      <View style={[styles.detailedContainer, { width }]}>
        {/* Card frame skeleton */}
        <View style={styles.cardFrame}>
          <Skeleton width="100%" height="100%" borderRadius={20} />
        </View>
        
        {/* Overlay content skeleton */}
        <View style={styles.overlay}>
          <View style={styles.cardHeader}>
            <Skeleton width={120} height={18} borderRadius={4} />
            <Skeleton width={36} height={36} borderRadius={18} />
          </View>
          <View style={styles.balanceSection}>
            <Skeleton width={60} height={14} borderRadius={4} />
            <Skeleton width={150} height={32} borderRadius={4} style={styles.balanceSkeleton} />
          </View>
        </View>
      </View>
    );
  }

  // Simple card view (matches WalletCard list view)
  return (
    <View style={[styles.walletCard, { width }]}>
      <View style={styles.walletCardContent}>
        {/* Icon skeleton */}
        <Skeleton width={44} height={44} borderRadius={22} />
        
        {/* Name skeleton */}
        <Skeleton width={80} height={13} borderRadius={4} style={styles.nameSkeleton} />
        
        {/* Balance skeleton */}
        <Skeleton width={100} height={15} borderRadius={4} style={styles.balanceSkeleton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  walletCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginRight: 12,
    minHeight: 120,
  },
  walletCardContent: {
    alignItems: 'center',
    gap: 8,
  },
  nameSkeleton: {
    marginTop: 4,
  },
  balanceSkeleton: {
    marginTop: 2,
  },
  detailedContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    height: 200, // Approximate card height
  },
  cardFrame: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 24,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceSection: {
    gap: 8,
  },
});
