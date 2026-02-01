/**
 * SmartPay Connection Monitoring Dashboard
 * 
 * Location: app/admin/smartpay-monitoring.tsx
 * Purpose: Monitor SmartPay API connection health and sync status
 * 
 * Features:
 * - Real-time connection status
 * - API response time tracking
 * - Failed sync alerts
 * - Recent sync history
 * - Health check metrics
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { GlassCard, GlassSection, PillButton, EmptyState, InfoCard } from '@/components/common';
import { StandardScreenLayout } from '@/components/layouts';
import Colors from '@/constants/Colors';
import { SECTION_SPACING, HORIZONTAL_PADDING } from '@/constants/Layout';
import { apiGet } from '@/utils/apiClient';
import logger from '@/utils/logger';

interface HealthStatus {
  healthy: boolean;
  responseTime?: number;
  error?: string;
  lastChecked: string;
}

interface SyncLog {
  id: string;
  direction: 'inbound' | 'outbound';
  endpoint: string;
  method: string;
  statusCode?: number;
  responseTime?: number;
  success: boolean;
  errorMessage?: string;
  timestamp: string;
  beneficiaryId?: string;
  voucherId?: string;
}

export default function SmartPayMonitoringScreen() {
  const router = useRouter();
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [recentSyncs, setRecentSyncs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch health status
  const fetchHealthStatus = useCallback(async () => {
    try {
      const status = await apiGet<HealthStatus>('/admin/smartpay/health');
      setHealthStatus(status);
    } catch (error: any) {
      logger.error('Failed to fetch SmartPay health status', error);
      setHealthStatus({
        healthy: false,
        error: error.message || 'Failed to check health',
        lastChecked: new Date().toISOString(),
      });
    }
  }, []);

  // Fetch recent sync logs
  const fetchRecentSyncs = useCallback(async () => {
    try {
      const logs = await apiGet<SyncLog[]>('/admin/smartpay/sync-logs?limit=20');
      setRecentSyncs(logs || []);
    } catch (error: any) {
      logger.error('Failed to fetch sync logs', error);
      setRecentSyncs([]);
    }
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchHealthStatus(), fetchRecentSyncs()]);
    setRefreshing(false);
  }, [fetchHealthStatus, fetchRecentSyncs]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, refreshData]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (healthy: boolean) => {
    return healthy ? Colors.success : Colors.error;
  };

  const getSyncStatusColor = (success: boolean) => {
    return success ? Colors.success : Colors.error;
  };

  const failedSyncs = recentSyncs.filter(log => !log.success);
  const successRate = recentSyncs.length > 0
    ? ((recentSyncs.filter(log => log.success).length / recentSyncs.length) * 100).toFixed(1)
    : '0';

  return (
    <StandardScreenLayout
      title="SmartPay Monitoring"
      showBackButton
      onBack={() => router.back()}
      scrollContentStyle={styles.scrollContent}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshData} tintColor={Colors.primary} />
        }
      >
        {/* Health Status Card */}
        <GlassCard style={styles.healthCard}>
          <View style={styles.healthHeader}>
            <View style={styles.healthTitleRow}>
              <FontAwesome
                name={healthStatus?.healthy ? 'check-circle' : 'exclamation-circle'}
                size={24}
                color={getStatusColor(healthStatus?.healthy || false)}
              />
              <Text style={styles.healthTitle}>
                Connection Status
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setAutoRefresh(!autoRefresh)}
              style={styles.autoRefreshButton}
            >
              <FontAwesome
                name={autoRefresh ? 'pause-circle' : 'play-circle'}
                size={20}
                color={Colors.primary}
              />
            </TouchableOpacity>
          </View>

          {healthStatus ? (
            <View style={styles.healthDetails}>
              <View style={styles.healthMetric}>
                <Text style={styles.healthMetricLabel}>Status:</Text>
                <Text style={[
                  styles.healthMetricValue,
                  { color: getStatusColor(healthStatus.healthy) }
                ]}>
                  {healthStatus.healthy ? 'Healthy' : 'Unhealthy'}
                </Text>
              </View>

              {healthStatus.responseTime !== undefined && (
                <View style={styles.healthMetric}>
                  <Text style={styles.healthMetricLabel}>Response Time:</Text>
                  <Text style={styles.healthMetricValue}>
                    {formatNumber(healthStatus.responseTime)}ms
                  </Text>
                </View>
              )}

              {healthStatus.error && (
                <View style={styles.healthMetric}>
                  <Text style={styles.healthMetricLabel}>Error:</Text>
                  <Text style={[styles.healthMetricValue, { color: Colors.error }]}>
                    {healthStatus.error}
                  </Text>
                </View>
              )}

              <View style={styles.healthMetric}>
                <Text style={styles.healthMetricLabel}>Last Checked:</Text>
                <Text style={styles.healthMetricValue}>
                  {formatDate(healthStatus.lastChecked)}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.loadingText}>Loading health status...</Text>
          )}
        </GlassCard>

        {/* Sync Statistics */}
        <GlassSection title="Sync Statistics" style={styles.section}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{recentSyncs.length}</Text>
              <Text style={styles.statLabel}>Total Syncs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.success }]}>
                {successRate}%
              </Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.error }]}>
                {failedSyncs.length}
              </Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
          </View>
        </GlassSection>

        {/* Recent Sync Logs */}
        <GlassSection title="Recent Sync Logs" style={styles.section}>
          {recentSyncs.length === 0 ? (
            <EmptyState
              icon="exchange"
              title="No Sync Logs"
              message="No recent API sync operations found."
            />
          ) : (
            <View style={styles.syncLogsList}>
              {recentSyncs.map((log) => (
                <View key={log.id} style={styles.syncLogItem}>
                  <View style={styles.syncLogHeader}>
                    <View style={styles.syncLogInfo}>
                      <FontAwesome
                        name={log.success ? 'check-circle' : 'times-circle'}
                        size={16}
                        color={getSyncStatusColor(log.success)}
                      />
                      <Text style={styles.syncLogMethod}>
                        {log.method} {log.direction === 'inbound' ? '←' : '→'}
                      </Text>
                      <Text style={styles.syncLogEndpoint}>
                        {log.endpoint.substring(0, 40)}...
                      </Text>
                    </View>
                    {log.statusCode && (
                      <Text style={[
                        styles.syncLogStatus,
                        { color: log.statusCode < 400 ? Colors.success : Colors.error }
                      ]}>
                        {log.statusCode}
                      </Text>
                    )}
                  </View>

                  <View style={styles.syncLogDetails}>
                    {log.responseTime !== undefined && (
                      <Text style={styles.syncLogDetail}>
                        {formatNumber(log.responseTime)}ms
                      </Text>
                    )}
                    <Text style={styles.syncLogDetail}>
                      {formatDate(log.timestamp)}
                    </Text>
                  </View>

                  {log.errorMessage && (
                    <Text style={styles.syncLogError}>
                      {log.errorMessage}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </GlassSection>

        {/* Info Card */}
        <InfoCard
          icon="info-circle"
          title="SmartPay Integration"
          description="This dashboard monitors the real-time connection between Buffr and Ketchup SmartPay. Health checks run automatically every 30 seconds. Failed syncs are logged for investigation."
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
  section: {
    marginBottom: SECTION_SPACING,
  },
  healthCard: {
    marginBottom: SECTION_SPACING,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  healthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  autoRefreshButton: {
    padding: 8,
  },
  healthDetails: {
    gap: 12,
  },
  healthMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthMetricLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  healthMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: HORIZONTAL_PADDING,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  syncLogsList: {
    gap: 12,
    marginTop: 8,
  },
  syncLogItem: {
    padding: 12,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 8,
    gap: 8,
  },
  syncLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncLogInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  syncLogMethod: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  syncLogEndpoint: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  syncLogStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  syncLogDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  syncLogDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  syncLogError: {
    fontSize: 12,
    color: Colors.error,
    fontStyle: 'italic',
  },
  infoCard: {
    marginTop: SECTION_SPACING,
  },
});
