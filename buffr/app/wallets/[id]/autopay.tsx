/**
 * AutoPay Management Screen
 * 
 * Location: app/wallets/[id]/autopay.tsx
 * Purpose: Manage AutoPay rules, view history, and configure AutoPay settings
 * 
 * Features:
 * - View AutoPay status and settings
 * - Manage AutoPay rules
 * - View AutoPay transaction history
 * - Configure AutoPay frequency, amount, and schedule
 * 
 * Based on Auto Pay Enabled Wallet View.svg design
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useWallets } from '@/contexts/WalletsContext';
import { ScreenHeader, SectionHeader, PillButton, ErrorState } from '@/components/common';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/components/layouts';
import Colors from '@/constants/Colors';
import { getAutoPayHistory } from '@/utils/walletClient';
import { formatCurrency } from '@/utils/formatters';
import { useAutoPay } from '@/hooks/useAutoPay';
import { log } from '@/utils/logger';

interface AutoPayTransaction {
  id: string;
  ruleId: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  executedAt: string;
  failureReason?: string;
  recipient?: {
    id: string;
    name: string;
  };
  ruleDescription: string;
}

export default function AutoPayManagementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getWalletById, refreshWallets, loading } = useWallets();
  const { executeRule, getHistory, loading: autopayLoading } = useAutoPay();
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<AutoPayTransaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const wallet = useMemo(() => {
    return id ? getWalletById(id) : null;
  }, [id, getWalletById]);

  useEffect(() => {
    if (id && wallet?.autoPayEnabled) {
      loadAutoPayHistory();
    }
  }, [id, wallet]);

  const loadAutoPayHistory = async () => {
    if (!id) return;
    setHistoryLoading(true);
    try {
      const transactions = await getAutoPayHistory(id);
      setHistory(transactions);
    } catch (error) {
      log.error('Failed to load AutoPay history:', error);
      // Don't show error if endpoint doesn't exist yet
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshWallets(), loadAutoPayHistory()]);
    setRefreshing(false);
  };

  const handleBack = () => {
    router.back();
  };

  const handleEditSettings = () => {
    router.push(`/wallets/${id}/settings`);
  };

  const handleViewHistory = () => {
    // Scroll to history section or navigate to dedicated history screen
    // For now, history is shown on this screen
  };

  if (!wallet) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Auto Pay" onBack={handleBack} />
        <ErrorState
          title="Wallet not found"
          message="The wallet you're looking for doesn't exist or has been deleted."
        />
      </View>
    );
  }

  if (!wallet.autoPayEnabled) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Auto Pay" onBack={handleBack} />
        <View style={styles.emptyState}>
          <FontAwesome name="repeat" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>Auto Pay Not Enabled</Text>
          <Text style={styles.emptyMessage}>
            Enable Auto Pay in wallet settings to automatically process payments
          </Text>
          <PillButton
            label="Go to Settings"
            variant="primary"
            onPress={handleEditSettings}
            style={styles.emptyButton}
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <ScreenHeader title="Auto Pay" onBack={handleBack} />

      {/* AutoPay Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={styles.statusIconContainer}>
            <FontAwesome name="check-circle" size={24} color={Colors.success} />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>Auto Pay Active</Text>
            <Text style={styles.statusSubtitle}>Automatically processing payments</Text>
          </View>
        </View>

        {/* Current Settings */}
        <View style={styles.settingsList}>
          {wallet.autoPayMaxAmount && (
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Max Amount</Text>
              <Text style={styles.settingValue}>
                {formatCurrency(wallet.autoPayMaxAmount, wallet.currency)}
              </Text>
            </View>
          )}
          {wallet.autoPayFrequency && (
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Frequency</Text>
              <Text style={styles.settingValue}>
                {wallet.autoPayFrequency.charAt(0).toUpperCase() + 
                 wallet.autoPayFrequency.slice(1).replace('-', ' ')}
              </Text>
            </View>
          )}
          {wallet.autoPayDeductDate && wallet.autoPayDeductTime && (
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Next Payment</Text>
              <Text style={styles.settingValue}>
                {wallet.autoPayDeductDate} at {wallet.autoPayDeductTime}
              </Text>
            </View>
          )}
          {wallet.autoPayAmount && (
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Amount</Text>
              <Text style={styles.settingValue}>
                {formatCurrency(wallet.autoPayAmount, wallet.currency)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.editButton} onPress={handleEditSettings}>
            <Text style={styles.editButtonText}>Edit Settings →</Text>
          </TouchableOpacity>
          {wallet.autoPayAmount && wallet.autoPayPaymentMethod && (
            <TouchableOpacity
              style={styles.executeButton}
              onPress={async () => {
                Alert.alert(
                  'Execute AutoPay Now',
                  `Execute AutoPay payment of ${formatCurrency(wallet.autoPayAmount || 0, wallet.currency)}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Execute',
                      onPress: async () => {
                        try {
                          // For now, use a mock rule ID - in production, get from wallet settings
                          await executeRule('rule-1', id!);
                          await loadAutoPayHistory();
                        } catch (error) {
                          // Error handled by hook
                        }
                      },
                    },
                  ]
                );
              }}
              disabled={autopayLoading}
            >
              {autopayLoading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.executeButtonText}>Execute Now</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* AutoPay History */}
      <View style={styles.section}>
        <SectionHeader title="Transaction History" />
        {historyLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyHistory}>
            <FontAwesome name="history" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyHistoryText}>No AutoPay transactions yet</Text>
            <Text style={styles.emptyHistorySubtext}>
              AutoPay transactions will appear here once they are executed
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {history.map((transaction) => (
              <View key={transaction.id} style={styles.historyItem}>
                <View
                  style={[
                    styles.historyIcon,
                    {
                      backgroundColor:
                        transaction.status === 'success'
                          ? Colors.success + '20'
                          : transaction.status === 'failed'
                          ? Colors.error + '20'
                          : Colors.warning + '20',
                    },
                  ]}
                >
                  <FontAwesome
                    name={
                      transaction.status === 'success'
                        ? 'check-circle'
                        : transaction.status === 'failed'
                        ? 'times-circle'
                        : 'clock-o'
                    }
                    size={20}
                    color={
                      transaction.status === 'success'
                        ? Colors.success
                        : transaction.status === 'failed'
                        ? Colors.error
                        : Colors.warning
                    }
                  />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyDescription}>
                    {transaction.ruleDescription}
                  </Text>
                  {transaction.recipient && (
                    <Text style={styles.historyRecipient}>
                      To: {transaction.recipient.name}
                    </Text>
                  )}
                  <Text style={styles.historyDate}>
                    {new Date(transaction.executedAt).toLocaleString()}
                  </Text>
                  {transaction.failureReason && (
                    <Text style={styles.historyError}>
                      {transaction.failureReason}
                    </Text>
                  )}
                </View>
                <View style={styles.historyAmount}>
                  <Text
                    style={[
                      styles.historyAmountText,
                      {
                        color:
                          transaction.status === 'success'
                            ? Colors.success
                            : Colors.error,
                      },
                    ]}
                  >
                    {formatCurrency(transaction.amount, wallet.currency)}
                  </Text>
                  <Text
                    style={[
                      styles.historyStatus,
                      {
                        color:
                          transaction.status === 'success'
                            ? Colors.success
                            : transaction.status === 'failed'
                            ? Colors.error
                            : Colors.warning,
                      },
                    ]}
                  >
                    {transaction.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <FontAwesome name="info-circle" size={20} color={Colors.info} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>About Auto Pay</Text>
          <Text style={styles.infoText}>
            Auto Pay automatically processes payments based on your configured rules.
            You can modify or disable Auto Pay at any time in wallet settings.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: HORIZONTAL_PADDING,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: HORIZONTAL_PADDING,
    marginBottom: SECTION_SPACING,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  settingsList: {
    gap: 12,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  buttonRow: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  rulesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.primary + '20',
    borderRadius: 8,
  },
  rulesButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  executeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  executeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  section: {
    marginBottom: SECTION_SPACING,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 8,
  },
  emptyHistory: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  historyList: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
    gap: 4,
  },
  historyDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  historyRecipient: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  historyError: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  historyAmount: {
    alignItems: 'flex-end',
    gap: 4,
  },
  historyAmountText: {
    fontSize: 16,
    fontWeight: '700',
  },
  historyStatus: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.info + '20',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: SECTION_SPACING,
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
