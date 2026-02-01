/**
 * Voucher History Screen
 * 
 * Location: app/utilities/vouchers/history.tsx
 * Purpose: Display all vouchers (available, redeemed, expired) with filtering
 * 
 * Consistent with: app/wallets/[id]/history.tsx, app/(tabs)/transactions.tsx
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useVouchers, VoucherStatus } from '@/contexts/VouchersContext';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';

export default function VoucherHistoryScreen() {
  const router = useRouter();
  const {
    vouchers,
    loading,
    fetchAllVouchers,
    getVouchersByStatus,
  } = useVouchers();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'redeemed' | 'expired'>('all');

  // Fetch all vouchers on mount
  useEffect(() => {
    fetchAllVouchers();
  }, [fetchAllVouchers]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllVouchers();
    setRefreshing(false);
  }, [fetchAllVouchers]);

  // Filter vouchers
  const filteredVouchers = filter === 'all'
    ? vouchers
    : getVouchersByStatus(filter as VoucherStatus);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return Colors.success;
      case 'redeemed':
        return Colors.primary;
      case 'expired':
        return Colors.error;
      case 'cancelled':
        return Colors.textSecondary;
      default:
        return Colors.textSecondary;
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'redeemed':
        return 'Redeemed';
      case 'expired':
        return 'Expired';
      case 'cancelled':
        return 'Cancelled';
      case 'pending_settlement':
        return 'Pending';
      default:
        return status;
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get icon name
  const getIconName = (icon: string | null, type: string) => {
    if (icon) return icon;
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voucher History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'available', 'redeemed', 'expired'] as const).map((filterOption) => (
          <TouchableOpacity
            key={filterOption}
            style={[
              styles.filterTab,
              filter === filterOption && styles.filterTabActive,
            ]}
            onPress={() => setFilter(filterOption)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === filterOption && styles.filterTabTextActive,
              ]}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Vouchers List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading && filteredVouchers.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="spinner" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyStateText}>Loading vouchers...</Text>
          </View>
        ) : filteredVouchers.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="gift" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyStateText}>
              {filter === 'all'
                ? 'No vouchers found'
                : `No ${filter} vouchers`}
            </Text>
          </View>
        ) : (
          filteredVouchers.map((voucher) => (
            <TouchableOpacity
              key={voucher.id}
              style={styles.voucherCard}
              onPress={() => {
                if (voucher.status === 'available') {
                  router.push(`/utilities/vouchers/${voucher.id}`);
                }
              }}
            >
              <View style={styles.voucherHeader}>
                <View style={styles.voucherIconContainer}>
                  <FontAwesome
                    name={getIconName(voucher.icon, voucher.type) as any}
                    size={24}
                    color={Colors.primary}
                  />
                </View>
                <View style={styles.voucherInfo}>
                  <Text style={styles.voucherTitle}>{voucher.title}</Text>
                  {voucher.issuer && (
                    <Text style={styles.voucherIssuer}>{voucher.issuer}</Text>
                  )}
                </View>
                <View style={styles.voucherAmountContainer}>
                  <Text style={styles.voucherAmount}>
                    N${voucher.amount.toFixed(2)}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(voucher.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getStatusLabel(voucher.status)}
                    </Text>
                  </View>
                </View>
              </View>

              {voucher.description && (
                <Text style={styles.voucherDescription}>{voucher.description}</Text>
              )}

              <View style={styles.voucherDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Created:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(voucher.createdAt)}
                  </Text>
                </View>
                {voucher.expiryDate && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Expires:</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(voucher.expiryDate)}
                    </Text>
                  </View>
                )}
                {voucher.redeemedAt && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Redeemed:</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(voucher.redeemedAt)}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  placeholder: {
    width: 44,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: Colors.backgroundGray,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  voucherCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  voucherHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  voucherIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  voucherInfo: {
    flex: 1,
  },
  voucherTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  voucherIssuer: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  voucherAmountContainer: {
    alignItems: 'flex-end',
  },
  voucherAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  voucherDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  voucherDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
});
