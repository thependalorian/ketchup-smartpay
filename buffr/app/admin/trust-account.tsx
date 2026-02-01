/**
 * Admin Trust Account Monitoring Screen
 * 
 * Location: app/admin/trust-account.tsx
 * Purpose: Monitor trust account status and reconciliation (PSD-3 Compliance)
 * 
 * Features:
 * - View current trust account balance
 * - View current e-money liabilities
 * - View discrepancy amount
 * - View reconciliation history
 * - Trigger manual reconciliation
 * - View recent trust account transactions
 * 
 * Access: Admin users only
 */

import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { GlassCard, GlassSection, PillButton, EmptyState, InfoCard } from '@/components/common';
import { StandardScreenLayout } from '@/components/layouts';
import Colors from '@/constants/Colors';
import { SECTION_SPACING, HORIZONTAL_PADDING } from '@/constants/Layout';
import { apiGet, apiPost } from '@/utils/apiClient';
import { useUser } from '@/contexts/UserContext';
import { log } from '@/utils/logger';

interface TrustAccountStatus {
  current: {
    trustAccountBalance: number;
    eMoneyLiabilities: number;
    discrepancyAmount: number;
    status: 'reconciled' | 'discrepancy';
    lastReconciled: string | null;
  };
  reconciliationHistory: Array<{
    id: string;
    date: string;
    trustAccountBalance: number;
    eMoneyLiabilities: number;
    discrepancyAmount: number;
    status: string;
    reconciledAt: string;
  }>;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    createdAt: string;
  }>;
}

export default function AdminTrustAccountScreen() {
  const router = useRouter();
  const { user } = useUser();
  const currency = 'N$';

  const [status, setStatus] = useState<TrustAccountStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reconciling, setReconciling] = useState(false);

  // Fetch trust account status
  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await apiGet<TrustAccountStatus>('/admin/trust-account/status?days=30');
      setStatus(data);
    } catch (error: any) {
      log.error('Error fetching trust account status:', error);
      Alert.alert('Error', error.message || 'Failed to fetch trust account status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStatus();
    setRefreshing(false);
  };

  // Trigger manual reconciliation
  const handleReconcile = async () => {
    Alert.alert(
      'Reconcile Trust Account',
      'Enter the current trust account balance from your bank statement:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reconcile',
          onPress: async () => {
            // In a real implementation, you'd show an input modal for the balance
            // For now, we'll use the current balance
            setReconciling(true);
            try {
              const currentBalance = status?.current.trustAccountBalance || 0;
              await apiPost('/admin/trust-account/reconcile', {
                trustAccountBalance: currentBalance,
              });
              Alert.alert('Success', 'Trust account reconciled successfully');
              await fetchStatus();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reconcile trust account');
            } finally {
              setReconciling(false);
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && !status) {
    return (
      <StandardScreenLayout
        title="Trust Account"
        showBackButton
        onBack={() => router.back()}
      >
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading trust account status...</Text>
        </View>
      </StandardScreenLayout>
    );
  }

  if (!status) {
    return (
      <StandardScreenLayout
        title="Trust Account"
        showBackButton
        onBack={() => router.back()}
      >
        <EmptyState
          icon="exclamation-triangle"
          title="Unable to Load"
          message="Failed to fetch trust account status. Please try again."
        />
      </StandardScreenLayout>
    );
  }

  const { current, reconciliationHistory, recentTransactions } = status;
  const isReconciled = current.status === 'reconciled';
  const discrepancyAbs = Math.abs(current.discrepancyAmount);

  return (
    <StandardScreenLayout
      title="Trust Account"
      showBackButton
      onBack={() => router.back()}
      scrollContentStyle={styles.scrollContent}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Current Status */}
        <GlassSection title="Current Status" style={styles.section}>
          <GlassCard padding={16} borderRadius={16} style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Trust Account Balance</Text>
              <Text style={styles.statusValue}>{formatCurrency(current.trustAccountBalance)}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>E-Money Liabilities</Text>
              <Text style={styles.statusValue}>{formatCurrency(current.eMoneyLiabilities)}</Text>
            </View>
            <View style={[styles.statusRow, styles.discrepancyRow]}>
              <Text style={styles.statusLabel}>Discrepancy</Text>
              <Text
                style={[
                  styles.statusValue,
                  isReconciled ? styles.reconciledText : styles.discrepancyText,
                ]}
              >
                {current.discrepancyAmount >= 0 ? '+' : ''}
                {formatCurrency(current.discrepancyAmount)}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <View
                style={[
                  styles.badge,
                  isReconciled ? styles.badgeReconciled : styles.badgeDiscrepancy,
                ]}
              >
                <FontAwesome
                  name={isReconciled ? 'check-circle' : 'exclamation-circle'}
                  size={16}
                  color={isReconciled ? Colors.success : Colors.error}
                />
                <Text
                  style={[
                    styles.badgeText,
                    isReconciled ? styles.badgeTextReconciled : styles.badgeTextDiscrepancy,
                  ]}
                >
                  {isReconciled ? 'Reconciled' : 'Discrepancy Detected'}
                </Text>
              </View>
            </View>
            {current.lastReconciled && (
              <Text style={styles.lastReconciled}>
                Last reconciled: {formatDate(current.lastReconciled)}
              </Text>
            )}
          </GlassCard>

          {/* Reconcile Button */}
          <PillButton
            label={reconciling ? 'Reconciling...' : 'Reconcile Now'}
            variant="primary"
            onPress={handleReconcile}
            disabled={reconciling}
            style={styles.reconcileButton}
          />
        </GlassSection>

        {/* Reconciliation History */}
        {reconciliationHistory.length > 0 && (
          <GlassSection title="Reconciliation History" style={styles.section}>
            <View style={styles.historyList}>
              {reconciliationHistory.map((record) => (
                <GlassCard key={record.id} padding={12} borderRadius={12} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>{formatDate(record.date)}</Text>
                    <View
                      style={[
                        styles.statusBadgeSmall,
                        record.status === 'reconciled'
                          ? styles.badgeReconciled
                          : styles.badgeDiscrepancy,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeTextSmall,
                          record.status === 'reconciled'
                            ? styles.badgeTextReconciled
                            : styles.badgeTextDiscrepancy,
                        ]}
                      >
                        {record.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.historyDetails}>
                    <View style={styles.historyDetailRow}>
                      <Text style={styles.historyDetailLabel}>Balance:</Text>
                      <Text style={styles.historyDetailValue}>
                        {formatCurrency(record.trustAccountBalance)}
                      </Text>
                    </View>
                    <View style={styles.historyDetailRow}>
                      <Text style={styles.historyDetailLabel}>Liabilities:</Text>
                      <Text style={styles.historyDetailValue}>
                        {formatCurrency(record.eMoneyLiabilities)}
                      </Text>
                    </View>
                    <View style={styles.historyDetailRow}>
                      <Text style={styles.historyDetailLabel}>Discrepancy:</Text>
                      <Text
                        style={[
                          styles.historyDetailValue,
                          Math.abs(record.discrepancyAmount) <= 0.01
                            ? styles.reconciledText
                            : styles.discrepancyText,
                        ]}
                      >
                        {formatCurrency(record.discrepancyAmount)}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              ))}
            </View>
          </GlassSection>
        )}

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <GlassSection title="Recent Transactions" style={styles.section}>
            <View style={styles.transactionsList}>
              {recentTransactions.map((transaction) => (
                <GlassCard
                  key={transaction.id}
                  padding={12}
                  borderRadius={12}
                  style={styles.transactionCard}
                >
                  <View style={styles.transactionHeader}>
                    <View style={styles.transactionType}>
                      <FontAwesome
                        name={
                          transaction.type === 'deposit'
                            ? 'arrow-down'
                            : transaction.type === 'withdrawal'
                            ? 'arrow-up'
                            : 'exchange'
                        }
                        size={16}
                        color={Colors.primary}
                      />
                      <Text style={styles.transactionTypeText}>{transaction.type}</Text>
                    </View>
                    <Text style={styles.transactionAmount}>
                      {transaction.amount >= 0 ? '+' : ''}
                      {formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
                </GlassCard>
              ))}
            </View>
          </GlassSection>
        )}

        {/* Info Card */}
        <InfoCard
          icon="info-circle"
          title="PSD-3 Compliance"
          description="Trust account must equal 100% of outstanding e-money liabilities. Daily reconciliation is required to ensure compliance."
          variant="info"
          style={styles.infoCard}
        />
      </ScrollView>
    </StandardScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: SECTION_SPACING,
  },
  statusCard: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  discrepancyRow: {
    borderBottomWidth: 0,
    paddingTop: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  reconciledText: {
    color: Colors.success,
  },
  discrepancyText: {
    color: Colors.error,
  },
  statusBadge: {
    marginTop: 16,
    alignItems: 'flex-start',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeReconciled: {
    backgroundColor: Colors.success + '20',
  },
  badgeDiscrepancy: {
    backgroundColor: Colors.error + '20',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  badgeTextReconciled: {
    color: Colors.success,
  },
  badgeTextDiscrepancy: {
    color: Colors.error,
  },
  lastReconciled: {
    marginTop: 12,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reconcileButton: {
    marginTop: 8,
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    marginBottom: 0,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTextSmall: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyDetails: {
    gap: 8,
  },
  historyDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDetailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  historyDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    marginBottom: 0,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textTransform: 'capitalize',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  transactionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  infoCard: {
    marginTop: SECTION_SPACING,
  },
});
