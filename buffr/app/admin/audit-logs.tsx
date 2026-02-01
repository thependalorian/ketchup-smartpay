/**
 * Admin Audit Log Reporting Dashboard
 * 
 * Location: app/admin/audit-logs.tsx
 * Purpose: Dashboard for viewing and managing audit logs (Regulatory Compliance)
 * 
 * Features:
 * - View audit logs with filtering
 * - Export audit logs (JSON/CSV)
 * - Retention statistics
 * - Archive management
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

interface RetentionStats {
  totalLogs: number;
  logsInRetention: number;
  logsToArchive: number;
  oldestLogDate: string | null;
  cutoffDate: string;
}

export default function AdminAuditLogsScreen() {
  const router = useRouter();
  const { user } = useUser();

  const [retentionStats, setRetentionStats] = useState<RetentionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // Fetch retention statistics
  const fetchRetentionStats = async () => {
    setLoading(true);
    try {
      const data = await apiGet<RetentionStats>('/admin/audit-logs/retention');
      setRetentionStats(data);
    } catch (error: any) {
      log.error('Error fetching retention stats:', error);
      Alert.alert('Error', error.message || 'Failed to fetch retention statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRetentionStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRetentionStats();
    setRefreshing(false);
  };

  // Archive old logs
  const handleArchive = async () => {
    Alert.alert(
      'Archive Old Logs',
      'This will archive audit logs older than 5 years. This action cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            setArchiving(true);
            try {
              const result = await apiPost<{ archived: number; errors: string[] }>(
                '/admin/audit-logs/retention',
                { action: 'archive' }
              );
              
              if (result.errors && result.errors.length > 0) {
                Alert.alert(
                  'Archive Complete with Warnings',
                  `Archived ${result.archived} log entries. ${result.errors.length} error(s) occurred.`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Success', `Successfully archived ${result.archived} audit log entries`);
              }
              
              await fetchRetentionStats();
            } catch (error: any) {
              log.error('Error archiving logs:', error);
              Alert.alert('Error', error.message || 'Failed to archive audit logs');
            } finally {
              setArchiving(false);
            }
          },
        },
      ]
    );
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-NA').format(num);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-NA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && !retentionStats) {
    return (
      <StandardScreenLayout title="Audit Log Management" showBackButton>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading retention statistics...</Text>
        </View>
      </StandardScreenLayout>
    );
  }

  return (
    <StandardScreenLayout title="Audit Log Management" showBackButton>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Retention Statistics */}
        {retentionStats && (
          <GlassSection title="Retention Statistics" style={styles.section}>
            <GlassCard padding={16} borderRadius={16}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Total Logs:</Text>
                <Text style={styles.statValue}>{formatNumber(retentionStats.totalLogs)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>In Retention (5 years):</Text>
                <Text style={[styles.statValue, styles.statGood]}>
                  {formatNumber(retentionStats.logsInRetention)}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Ready to Archive:</Text>
                <Text style={[styles.statValue, retentionStats.logsToArchive > 0 ? styles.statWarning : styles.statGood]}>
                  {formatNumber(retentionStats.logsToArchive)}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Oldest Log:</Text>
                <Text style={styles.statValue}>{formatDate(retentionStats.oldestLogDate)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Retention Cutoff:</Text>
                <Text style={styles.statValue}>{formatDate(retentionStats.cutoffDate)}</Text>
              </View>
            </GlassCard>
          </GlassSection>
        )}

        {/* Actions */}
        <GlassSection title="Actions" style={styles.section}>
          <PillButton
            label="Archive Old Logs"
            onPress={handleArchive}
            disabled={archiving || (retentionStats?.logsToArchive || 0) === 0}
            style={styles.actionButton}
          />
          <PillButton
            label="Query Audit Logs"
            onPress={() => router.push('/admin/audit-logs/query' as any)}
            variant="outline"
            style={styles.actionButton}
          />
          <PillButton
            label="Export Audit Logs"
            onPress={() => router.push('/admin/audit-logs/export' as any)}
            variant="outline"
            style={styles.actionButton}
          />
        </GlassSection>

        {/* Info Card */}
        <InfoCard
          icon="info-circle"
          title="5-Year Retention Policy"
          description="All audit logs must be retained for a minimum of 5 years as required by regulatory compliance. Logs older than 5 years are archived but not deleted."
          variant="info"
          style={styles.infoCard}
        />
      </ScrollView>
    </StandardScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: HORIZONTAL_PADDING,
    paddingBottom: SECTION_SPACING,
  },
  section: {
    marginBottom: SECTION_SPACING,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: HORIZONTAL_PADDING,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
  },
  statGood: {
    color: Colors.success,
  },
  statWarning: {
    color: Colors.warning,
  },
  actionButton: {
    marginBottom: 12,
  },
  infoCard: {
    marginTop: SECTION_SPACING,
  },
});
