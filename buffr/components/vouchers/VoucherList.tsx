/**
 * VoucherList Component
 * 
 * Location: components/vouchers/VoucherList.tsx
 * Purpose: Display list of vouchers with filtering and status grouping
 * 
 * Features:
 * - Filter by status (available, redeemed, expired, all)
 * - Group by date
 * - Voucher type icons
 * - Status badges
 * - Consistent with TransactionList and WalletHistory patterns
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { VoucherListItem } from './VoucherListItem';

export type VoucherStatus = 'available' | 'redeemed' | 'expired';
export type VoucherType = 'government' | 'electricity' | 'water' | 'other';

export interface Voucher {
  id: string;
  type: VoucherType;
  title: string;
  description: string | null;
  amount: number;
  status: VoucherStatus;
  expiryDate?: string | null;
  redeemedAt?: string | null;
  issuer: string | null;
  icon: string | null;
  voucherCode?: string | null;
  namqrCode?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface VoucherListProps {
  vouchers: Voucher[];
  onVoucherPress?: (voucher: Voucher) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  showFilters?: boolean;
}

export default function VoucherList({
  vouchers,
  onVoucherPress,
  refreshing = false,
  onRefresh,
  showFilters = true,
}: VoucherListProps) {
  const [filter, setFilter] = useState<'all' | 'available' | 'redeemed' | 'expired'>('all');

  const filteredVouchers = useMemo(() => {
    if (filter === 'all') return vouchers;
    return vouchers.filter((v) => v.status === filter);
  }, [vouchers, filter]);

  // Group vouchers by date
  const groupedVouchers = useMemo(() => {
    const groups: { [key: string]: Voucher[] } = {};
    filteredVouchers.forEach((voucher) => {
      const dateKey = formatDateGroup(voucher.createdAt);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(voucher);
    });
    return groups;
  }, [filteredVouchers]);

  // Flattened list items for FlashList (headers + vouchers)
  type ListItem =
    | { type: 'header'; dateKey: string }
    | { type: 'voucher'; data: Voucher };

  const flattenedData = useMemo(() => {
    const result: ListItem[] = [];
    Object.keys(groupedVouchers)
      .sort((a, b) => {
        // Sort dates descending (newest first)
        return new Date(b).getTime() - new Date(a).getTime();
      })
      .forEach((dateKey) => {
        result.push({ type: 'header', dateKey });
        groupedVouchers[dateKey]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .forEach((voucher) => {
            result.push({ type: 'voucher', data: voucher });
          });
      });
    return result;
  }, [groupedVouchers]);

  const formatDateGroup = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'header') {
        return (
          <View style={styles.dateGroup}>
            <Text style={styles.dateHeader}>{item.dateKey}</Text>
          </View>
        );
      }

      return (
        <VoucherListItem
          voucher={item.data}
          onPress={() => onVoucherPress?.(item.data)}
        />
      );
    },
    [onVoucherPress]
  );

  const keyExtractor = useCallback((item: ListItem, index: number) => {
    if (item.type === 'header') {
      return `header-${item.dateKey}`;
    }
    return item.data.id;
  }, []);

  const getItemType = useCallback((item: ListItem) => item.type, []);

  const ListEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyState}>
        <FontAwesome name="gift" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyText}>
          {filter === 'all'
            ? 'No vouchers found'
            : `No ${filter} vouchers found`}
        </Text>
      </View>
    ),
    [filter]
  );

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      {showFilters && (
        <View style={styles.filters}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[styles.filterText, filter === 'all' && styles.filterTextActive]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'available' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('available')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'available' && styles.filterTextActive,
              ]}
            >
              Available
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'redeemed' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('redeemed')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'redeemed' && styles.filterTextActive,
              ]}
            >
              Redeemed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'expired' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('expired')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'expired' && styles.filterTextActive,
              ]}
            >
              Expired
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Vouchers List - FlashList for performance */}
      <View style={styles.list}>
        <FlashList
          data={flattenedData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemType={getItemType}
          estimatedItemSize={100}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={ListEmptyComponent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundGray,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  filterTextActive: {
    color: Colors.white,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dateGroup: {
    marginTop: 24,
    marginBottom: 12,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
});
