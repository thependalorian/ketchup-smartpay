/**
 * VoucherListItem Component
 * 
 * Location: components/vouchers/VoucherListItem.tsx
 * Purpose: Individual voucher item in list display
 * 
 * Features:
 * - Voucher type icon
 * - Title and description
 * - Amount display
 * - Status badge
 * - Expiry date
 * - Clickable with onPress handler
 * - Consistent with TransactionListItem pattern
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { GlassCard, StatusBadge } from '@/components/common';
import Colors from '@/constants/Colors';
import { Voucher, VoucherType, VoucherStatus } from './VoucherList';
import { CARD_GAP } from '@/constants/Layout';

interface VoucherListItemProps {
  voucher: Voucher;
  onPress?: (voucher: Voucher) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * VoucherListItem Component (Memoized)
 * 
 * Performance: Wrapped with React.memo to prevent re-renders when
 * parent list re-renders.
 */
const VoucherListItem = memo(function VoucherListItem({
  voucher,
  onPress,
  style,
}: VoucherListItemProps) {
  const getVoucherIcon = (type: VoucherType) => {
    if (voucher.icon) return voucher.icon;
    
    switch (type) {
      case 'government':
        return 'building';
      case 'electricity':
        return 'bolt';
      case 'water':
        return 'tint';
      default:
        return 'gift';
    }
  };

  const getVoucherColor = (status: VoucherStatus) => {
    switch (status) {
      case 'available':
        return Colors.success;
      case 'redeemed':
        return Colors.primary;
      case 'expired':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const iconName = getVoucherIcon(voucher.type) as any;
  const iconColor = getVoucherColor(voucher.status);

  const content = (
    <GlassCard style={[styles.container, style]} padding={16} borderRadius={16}>  // ✅ buffr-mobile style
      <View style={styles.content}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: iconColor + '20' },
          ]}
        >
          <FontAwesome name={iconName} size={20} color={iconColor} />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {voucher.title}
            </Text>
            <StatusBadge
              status={
                voucher.status === 'available'
                  ? 'success'
                  : voucher.status === 'redeemed'
                  ? 'completed'
                  : 'error'
              }
              style={styles.statusBadge}
            />
          </View>
          {voucher.description && (
            <Text style={styles.description} numberOfLines={1}>
              {voucher.description}
            </Text>
          )}
          <View style={styles.metaRow}>
            {voucher.issuer && (
              <Text style={styles.metaText}>{voucher.issuer}</Text>
            )}
            {voucher.expiryDate && (
              <Text style={styles.metaText}>
                • Expires {formatDate(voucher.expiryDate)}
              </Text>
            )}
            {voucher.redeemedAt && (
              <Text style={styles.metaText}>
                • Redeemed {formatDate(voucher.redeemedAt)}
              </Text>
            )}
          </View>
        </View>

        {/* Amount */}
        <View style={styles.amountContainer}>
          <Text style={[styles.amount, { color: iconColor }]}>
            N$ {voucher.amount.toFixed(2)}
          </Text>
        </View>
      </View>
    </GlassCard>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={() => onPress(voucher)} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
});

export { VoucherListItem };

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CARD_GAP,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  statusBadge: {
    marginLeft: 'auto',
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
