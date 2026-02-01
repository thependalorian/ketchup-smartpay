/**
 * Admin Compliance Monitoring Screen
 * 
 * Location: app/admin/compliance.tsx
 * Purpose: Monitor compliance statistics and generate reports (PSD-1 Requirement)
 * 
 * Features:
 * - View monthly compliance statistics
 * - Generate compliance reports (CSV/Excel)
 * - View report history
 * - Calculate statistics for any month
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

interface MonthlyStats {
  id?: string;
  report_month: string;
  report_year: number;
  report_month_number: number;
  total_transactions: number;
  total_transaction_value: number;
  total_vouchers_issued: number;
  total_voucher_value_issued: number;
  total_vouchers_redeemed: number;
  total_voucher_value_redeemed: number;
  total_active_users: number;
  total_registered_users: number;
  new_users_this_month: number;
  total_wallets: number;
  total_wallet_balance: number;
  average_wallet_balance: number;
  wallet_transfers_count: number;
  wallet_transfers_value: number;
  bank_transfers_count: number;
  bank_transfers_value: number;
  cash_out_count: number;
  cash_out_value: number;
  merchant_payments_count: number;
  merchant_payments_value: number;
  total_2fa_verifications: number;
  total_audit_log_entries: number;
  total_fraud_attempts: number;
  total_incidents: number;
  status?: string;
}

export default function AdminComplianceScreen() {
  const router = useRouter();
  const { user } = useUser();
  const currency = 'N$';

  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Fetch monthly statistics
  const fetchStats = async (year?: number, month?: number) => {
    setLoading(true);
    try {
      const yearParam = year || selectedYear;
      const monthParam = month || selectedMonth;
      const data = await apiGet<MonthlyStats>(
        `/admin/compliance/monthly-stats?year=${yearParam}&month=${monthParam}`
      );
      setStats(data);
    } catch (error: any) {
      log.error('Error fetching compliance statistics:', error);
      Alert.alert('Error', error.message || 'Failed to fetch compliance statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  // Save statistics
  const handleSaveStats = async () => {
    if (!stats) return;

    setLoading(true);
    try {
      await apiPost('/admin/compliance/monthly-stats', {
        ...stats,
        year: selectedYear,
        month: selectedMonth,
      });
      Alert.alert('Success', 'Monthly statistics saved successfully');
      await fetchStats();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save statistics');
    } finally {
      setLoading(false);
    }
  };

  // Generate report
  const handleGenerateReport = async (format: 'csv' | 'excel') => {
    if (!stats?.id) {
      Alert.alert('Error', 'Please save statistics first before generating a report');
      return;
    }

    setGenerating(true);
    try {
      const response = await apiPost<{
        fileName: string;
        filePath: string;
        format: string;
        content: string;
        size: number;
        mimeType?: string;
      }>('/admin/compliance/generate-report', {
        monthlyStatsId: stats.id,
        format,
      });

      Alert.alert(
        'Report Generated',
        `Report generated successfully!\n\nFile: ${response.fileName}\nSize: ${(response.size / 1024).toFixed(2)} KB\n\nNote: In production, this would be available for download.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toFixed(2)}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-NA');
  };

  if (loading && !stats) {
    return (
      <StandardScreenLayout
        title="Compliance Monitoring"
        showBackButton
        onBack={() => router.back()}
      >
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading compliance statistics...</Text>
        </View>
      </StandardScreenLayout>
    );
  }

  return (
    <StandardScreenLayout
      title="Compliance Monitoring"
      showBackButton
      onBack={() => router.back()}
      scrollContentStyle={styles.scrollContent}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Month Selector */}
        <GlassSection title="Report Period" style={styles.section}>
          <View style={styles.selectorRow}>
            <View style={styles.selector}>
              <Text style={styles.selectorLabel}>Year</Text>
              <Text style={styles.selectorValue}>{selectedYear}</Text>
            </View>
            <View style={styles.selector}>
              <Text style={styles.selectorLabel}>Month</Text>
              <Text style={styles.selectorValue}>
                {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-NA', {
                  month: 'long',
                })}
              </Text>
            </View>
            <PillButton
              label="Load"
              variant="outline"
              onPress={() => fetchStats(selectedYear, selectedMonth)}
              style={styles.loadButton}
            />
          </View>
        </GlassSection>

        {stats ? (
          <>
            {/* Transaction Statistics */}
            <GlassSection title="Transaction Statistics" style={styles.section}>
              <GlassCard padding={16} borderRadius={16}>
                <StatRow
                  label="Total Transactions"
                  value={formatNumber(stats.total_transactions)}
                />
                <StatRow
                  label="Total Transaction Value"
                  value={formatCurrency(stats.total_transaction_value)}
                />
                <StatRow
                  label="Total Transaction Volume"
                  value={formatNumber(stats.total_transactions)}
                />
              </GlassCard>
            </GlassSection>

            {/* Voucher Statistics */}
            <GlassSection title="Voucher Statistics" style={styles.section}>
              <GlassCard padding={16} borderRadius={16}>
                <StatRow
                  label="Vouchers Issued"
                  value={formatNumber(stats.total_vouchers_issued)}
                />
                <StatRow
                  label="Value Issued"
                  value={formatCurrency(stats.total_voucher_value_issued)}
                />
                <StatRow
                  label="Vouchers Redeemed"
                  value={formatNumber(stats.total_vouchers_redeemed)}
                />
                <StatRow
                  label="Value Redeemed"
                  value={formatCurrency(stats.total_voucher_value_redeemed)}
                />
              </GlassCard>
            </GlassSection>

            {/* User Statistics */}
            <GlassSection title="User Statistics" style={styles.section}>
              <GlassCard padding={16} borderRadius={16}>
                <StatRow
                  label="Total Active Users"
                  value={formatNumber(stats.total_active_users)}
                />
                <StatRow
                  label="Total Registered Users"
                  value={formatNumber(stats.total_registered_users)}
                />
                <StatRow
                  label="New Users This Month"
                  value={formatNumber(stats.new_users_this_month)}
                />
              </GlassCard>
            </GlassSection>

            {/* Wallet Statistics */}
            <GlassSection title="Wallet Statistics" style={styles.section}>
              <GlassCard padding={16} borderRadius={16}>
                <StatRow label="Total Wallets" value={formatNumber(stats.total_wallets)} />
                <StatRow
                  label="Total Wallet Balance"
                  value={formatCurrency(stats.total_wallet_balance)}
                />
                <StatRow
                  label="Average Wallet Balance"
                  value={formatCurrency(stats.average_wallet_balance)}
                />
              </GlassCard>
            </GlassSection>

            {/* Payment Method Statistics */}
            <GlassSection title="Payment Method Statistics" style={styles.section}>
              <GlassCard padding={16} borderRadius={16}>
                <StatRow
                  label="Wallet Transfers"
                  value={`${formatNumber(stats.wallet_transfers_count)} (${formatCurrency(stats.wallet_transfers_value)})`}
                />
                <StatRow
                  label="Bank Transfers"
                  value={`${formatNumber(stats.bank_transfers_count)} (${formatCurrency(stats.bank_transfers_value)})`}
                />
                <StatRow
                  label="Cash Out"
                  value={`${formatNumber(stats.cash_out_count)} (${formatCurrency(stats.cash_out_value)})`}
                />
                <StatRow
                  label="Merchant Payments"
                  value={`${formatNumber(stats.merchant_payments_count)} (${formatCurrency(stats.merchant_payments_value)})`}
                />
              </GlassCard>
            </GlassSection>

            {/* Compliance Statistics */}
            <GlassSection title="Compliance Statistics" style={styles.section}>
              <GlassCard padding={16} borderRadius={16}>
                <StatRow
                  label="2FA Verifications"
                  value={formatNumber(stats.total_2fa_verifications)}
                />
                <StatRow
                  label="Audit Log Entries"
                  value={formatNumber(stats.total_audit_log_entries)}
                />
                <StatRow
                  label="Fraud Attempts"
                  value={formatNumber(stats.total_fraud_attempts)}
                />
                <StatRow label="Incidents" value={formatNumber(stats.total_incidents)} />
              </GlassCard>
            </GlassSection>

            {/* Actions */}
            <GlassSection title="Actions" style={styles.section}>
              <PillButton
                label="Save Statistics"
                variant="primary"
                onPress={handleSaveStats}
                disabled={loading}
                style={styles.actionButton}
              />
              <View style={styles.reportButtons}>
                <PillButton
                  label={generating ? 'Generating...' : 'Generate CSV'}
                  variant="outline"
                  onPress={() => handleGenerateReport('csv')}
                  disabled={generating || !stats.id}
                  style={StyleSheet.flatten([styles.actionButton, styles.reportButton, { marginRight: 6 }])}
                />
                <PillButton
                  label={generating ? 'Generating...' : 'Generate Excel'}
                  variant="outline"
                  onPress={() => handleGenerateReport('excel')}
                  disabled={generating || !stats.id}
                  style={StyleSheet.flatten([styles.actionButton, styles.reportButton, { marginLeft: 6 }])}
                />
              </View>
            </GlassSection>
          </>
        ) : (
          <EmptyState
            icon="bar-chart"
            title="No Statistics"
            message="Select a month and click Load to calculate compliance statistics."
          />
        )}

        {/* Info Card */}
        <InfoCard
          icon="info-circle"
          title="PSD-1 Compliance"
          description="Monthly statistics must be submitted to Bank of Namibia within 10 days after month end. Reports can be generated in CSV or Excel format."
          variant="info"
          style={styles.infoCard}
        />
      </ScrollView>
    </StandardScreenLayout>
  );
}

// Helper component for stat rows
function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={statStyles.row}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={statStyles.value}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'right',
  },
});

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
  selectorRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  selector: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  selectorValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadButton: {
    minWidth: 80,
  },
  actionButton: {
    marginTop: 8,
  },
  reportButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  reportButton: {
    flex: 1,
  },
  infoCard: {
    marginTop: SECTION_SPACING,
  },
});
