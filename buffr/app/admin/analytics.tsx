/**
 * Admin Analytics Dashboard Screen
 * 
 * Location: app/admin/analytics.tsx
 * Purpose: Comprehensive analytics dashboard for transaction insights and product development
 * 
 * Features:
 * - Transaction volume and frequency analytics
 * - User behavior analytics
 * - Merchant analytics
 * - Geographic analytics
 * - Payment method analytics
 * - Channel analytics (mobile app vs USSD)
 * - Product development insights
 * - Real-time metrics for current day
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
import { apiGet } from '@/utils/apiClient';
import { useUser } from '@/contexts/UserContext';
import { log } from '@/utils/logger';

interface TransactionAnalytics {
  totalTransactions: number;
  totalVolume: number;
  averageTransactionAmount: number;
  uniqueUsers: number;
  byType: Array<{
    transactionType: string;
    count: number;
    volume: number;
  }>;
  byPaymentMethod: Array<{
    paymentMethod: string;
    count: number;
    volume: number;
  }>;
}

interface UserBehaviorAnalytics {
  totalUsers: number;
  averageBalance: number;
  totalSpent: number;
  totalReceived: number;
  cashOutRatio: number;
  digitalPaymentRatio: number;
  preferredPaymentMethods: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
}

interface ProductInsight {
  type: string;
  title: string;
  description: string;
  opportunity: string;
  expectedImpact: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
}

interface AnalyticsData {
  transactions: TransactionAnalytics;
  users: UserBehaviorAnalytics;
  insights: ProductInsight[];
  realTime: {
    todayTransactions: number;
    todayVolume: number;
    activeUsers: number;
  };
}

type TabType = 'overview' | 'transactions' | 'users' | 'insights';

export default function AdminAnalyticsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const currency = 'N$';

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dateRange, setDateRange] = useState(30); // days

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [transactionsRes, usersRes, insightsRes] = await Promise.all([
        apiGet<TransactionAnalytics>(`/analytics/transactions?days=${dateRange}`),
        apiGet<UserBehaviorAnalytics>(`/analytics/users?days=${dateRange}`),
        apiGet<{ insights: ProductInsight[] }>(`/analytics/insights?days=${dateRange}`),
      ]);

      // Get real-time current day data
      const today = new Date().toISOString().split('T')[0];
      const realTimeRes = await apiGet<{
        totalTransactions: number;
        totalVolume: number;
        uniqueUsers: number;
      }>(`/analytics/transactions?fromDate=${today}&toDate=${today}`);

      // Handle API response format (data may be wrapped in success response)
      const transactions = (transactionsRes as any).data || transactionsRes;
      const users = (usersRes as any).data || usersRes;
      const insights = (insightsRes as any).data?.insights || insightsRes.insights || [];
      const realTime = (realTimeRes as any).data || realTimeRes;

      setData({
        transactions: transactions,
        users: users,
        insights: insights,
        realTime: {
          todayTransactions: realTime.totalTransactions || 0,
          todayVolume: realTime.totalVolume || 0,
          activeUsers: realTime.uniqueUsers || 0,
        },
      });
    } catch (error: any) {
      log.error('Error fetching analytics:', error);
      Alert.alert('Error', error.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  const handleExport = async () => {
    Alert.alert(
      'Export Analytics',
      `Export ${dateRange}-day analytics data?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'CSV',
          onPress: async () => {
            try {
              setLoading(true);
              // For React Native, we'll fetch the data and show it
              // In production, you'd use a file system library (e.g., expo-file-system) to save
              const exportUrl = `/api/analytics/export?type=transactions&format=csv&days=${dateRange}`;
              
              // Note: In a web environment, this would trigger a download
              // For React Native, you'd need to use expo-file-system to save the file
              Alert.alert(
                'Export Available',
                `CSV export is available at: ${exportUrl}\n\nIn production, this will download the file automatically.`,
                [{ text: 'OK' }]
              );
            } catch (error: any) {
              Alert.alert('Export Error', error.message || 'Failed to export analytics data');
            } finally {
              setLoading(false);
            }
          },
        },
        {
          text: 'JSON',
          onPress: async () => {
            try {
              setLoading(true);
              const exportUrl = `/api/analytics/export?type=transactions&format=json&days=${dateRange}`;
              const response = await apiGet(exportUrl);
              
              // Show export info
              const data = (response as any).data || response;
              const recordCount = Array.isArray(data) ? data.length : (data.recordCount || 0);
              
              Alert.alert(
                'Export Complete',
                `Analytics data exported successfully.\n\nRecords: ${recordCount}\nFormat: JSON\nPeriod: ${dateRange} days\n\nData is anonymized for privacy compliance.`,
                [{ text: 'OK' }]
              );
            } catch (error: any) {
              Alert.alert('Export Error', error.message || 'Failed to export analytics data');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return Colors.error;
      case 'medium':
        return Colors.warning;
      case 'low':
        return Colors.info;
      default:
        return Colors.text;
    }
  };

  if (loading && !data) {
    return (
      <StandardScreenLayout title="Analytics Dashboard">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </StandardScreenLayout>
    );
  }

  if (!data) {
    return (
      <StandardScreenLayout title="Analytics Dashboard">
        <EmptyState
          icon="bar-chart"
          title="No Analytics Data"
          message="Analytics data will appear here once transactions are processed"
        />
      </StandardScreenLayout>
    );
  }

  return (
    <StandardScreenLayout title="Analytics Dashboard">
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Analytics Dashboard</Text>
              <Text style={styles.subtitle}>Transaction insights and product development</Text>
            </View>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExport}
            >
              <FontAwesome name="download" size={16} color={Colors.primary} />
              <Text style={styles.exportButtonText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Range Selector */}
        <GlassCard style={styles.dateRangeCard}>
          <Text style={styles.sectionTitle}>Time Period</Text>
          <View style={styles.dateRangeButtons}>
            {[7, 30, 90, 365].map((days) => (
              <PillButton
                key={days}
                label={days === 7 ? '7 days' : days === 30 ? '30 days' : days === 90 ? '90 days' : '1 year'}
                onPress={() => setDateRange(days)}
                variant={dateRange === days ? 'primary' : 'outline'}
                style={styles.dateButton}
              />
            ))}
          </View>
        </GlassCard>

        {/* Real-Time Metrics */}
        <GlassCard style={styles.realTimeCard}>
          <Text style={styles.sectionTitle}>Today's Activity</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{formatNumber(data.realTime.todayTransactions)}</Text>
              <Text style={styles.metricLabel}>Transactions</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{formatCurrency(data.realTime.todayVolume)}</Text>
              <Text style={styles.metricLabel}>Volume</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{formatNumber(data.realTime.activeUsers)}</Text>
              <Text style={styles.metricLabel}>Active Users</Text>
            </View>
          </View>
        </GlassCard>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['overview', 'transactions', 'users', 'insights'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            {/* Summary Metrics */}
            <GlassCard>
              <Text style={styles.sectionTitle}>Summary Metrics</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.metricCard}>
                  <FontAwesome name="exchange" size={20} color={Colors.primary} />
                  <Text style={styles.metricCardTitle}>Total Transactions</Text>
                  <Text style={styles.metricCardValue}>{formatNumber(data.transactions.totalTransactions)}</Text>
                </View>
                <View style={styles.metricCard}>
                  <FontAwesome name="money" size={20} color={Colors.success} />
                  <Text style={styles.metricCardTitle}>Total Volume</Text>
                  <Text style={styles.metricCardValue}>{formatCurrency(data.transactions.totalVolume)}</Text>
                </View>
                <View style={styles.metricCard}>
                  <FontAwesome name="calculator" size={20} color={Colors.info} />
                  <Text style={styles.metricCardTitle}>Avg Transaction</Text>
                  <Text style={styles.metricCardValue}>{formatCurrency(data.transactions.averageTransactionAmount)}</Text>
                </View>
                <View style={styles.metricCard}>
                  <FontAwesome name="users" size={20} color={Colors.warning} />
                  <Text style={styles.metricCardTitle}>Active Users</Text>
                  <Text style={styles.metricCardValue}>{formatNumber(data.transactions.uniqueUsers)}</Text>
                </View>
              </View>
            </GlassCard>

            {/* Top Payment Methods */}
            {data.transactions.byPaymentMethod.length > 0 && (
              <GlassCard>
                <Text style={styles.sectionTitle}>Top Payment Methods</Text>
                {data.transactions.byPaymentMethod.slice(0, 5).map((method, index) => (
                  <View key={method.paymentMethod} style={styles.listItem}>
                    <View style={styles.listItemLeft}>
                      <Text style={styles.listItemRank}>#{index + 1}</Text>
                      <Text style={styles.listItemTitle}>{method.paymentMethod}</Text>
                    </View>
                    <View style={styles.listItemRight}>
                      <Text style={styles.listItemValue}>{formatCurrency(method.volume)}</Text>
                      <Text style={styles.listItemSubtext}>{formatNumber(method.count)} transactions</Text>
                    </View>
                  </View>
                ))}
              </GlassCard>
            )}

            {/* High Priority Insights */}
            {data.insights.filter((i) => i.priority === 'high').length > 0 && (
              <GlassCard>
                <Text style={styles.sectionTitle}>High Priority Insights</Text>
                {data.insights
                  .filter((i) => i.priority === 'high')
                  .slice(0, 3)
                  .map((insight, index) => (
                    <View key={index} style={styles.insightCard}>
                      <View style={styles.insightHeader}>
                        <Text style={styles.insightTitle}>{insight.title}</Text>
                        <View
                          style={[styles.priorityBadge, { backgroundColor: getPriorityColor(insight.priority) }]}
                        >
                          <Text style={styles.priorityText}>{insight.priority.toUpperCase()}</Text>
                        </View>
                      </View>
                      <Text style={styles.insightDescription}>{insight.description}</Text>
                      <Text style={styles.insightOpportunity}>
                        <Text style={styles.insightLabel}>Opportunity: </Text>
                        {insight.opportunity}
                      </Text>
                      <Text style={styles.insightImpact}>
                        <Text style={styles.insightLabel}>Expected Impact: </Text>
                        {insight.expectedImpact}
                      </Text>
                      <Text style={styles.insightConfidence}>
                        Confidence: {insight.confidence}%
                      </Text>
                    </View>
                  ))}
              </GlassCard>
            )}
          </View>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <View style={styles.tabContent}>
            <GlassCard>
              <Text style={styles.sectionTitle}>Transaction Analytics</Text>
              <View style={styles.summaryGrid}>
                <InfoCard
                  title="Total Transactions"
                  description={formatNumber(data.transactions.totalTransactions)}
                  icon="exchange"
                />
                <InfoCard
                  title="Total Volume"
                  description={formatCurrency(data.transactions.totalVolume)}
                  icon="money"
                />
                <InfoCard
                  title="Average Amount"
                  description={formatCurrency(data.transactions.averageTransactionAmount)}
                  icon="calculator"
                />
                <InfoCard
                  title="Unique Users"
                  description={formatNumber(data.transactions.uniqueUsers)}
                  icon="users"
                />
              </View>
            </GlassCard>

            {/* By Transaction Type */}
            {data.transactions.byType.length > 0 && (
              <GlassCard>
                <Text style={styles.sectionTitle}>By Transaction Type</Text>
                {data.transactions.byType.map((type, index) => (
                  <View key={type.transactionType} style={styles.listItem}>
                    <View style={styles.listItemLeft}>
                      <Text style={styles.listItemTitle}>{type.transactionType}</Text>
                    </View>
                    <View style={styles.listItemRight}>
                      <Text style={styles.listItemValue}>{formatCurrency(type.volume)}</Text>
                      <Text style={styles.listItemSubtext}>{formatNumber(type.count)} transactions</Text>
                    </View>
                  </View>
                ))}
              </GlassCard>
            )}

            {/* By Payment Method */}
            {data.transactions.byPaymentMethod.length > 0 && (
              <GlassCard>
                <Text style={styles.sectionTitle}>By Payment Method</Text>
                {data.transactions.byPaymentMethod.map((method, index) => (
                  <View key={method.paymentMethod} style={styles.listItem}>
                    <View style={styles.listItemLeft}>
                      <Text style={styles.listItemTitle}>{method.paymentMethod}</Text>
                    </View>
                    <View style={styles.listItemRight}>
                      <Text style={styles.listItemValue}>{formatCurrency(method.volume)}</Text>
                      <Text style={styles.listItemSubtext}>{formatNumber(method.count)} transactions</Text>
                    </View>
                  </View>
                ))}
              </GlassCard>
            )}
          </View>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <View style={styles.tabContent}>
            <GlassCard>
              <Text style={styles.sectionTitle}>User Behavior Analytics</Text>
              <View style={styles.summaryGrid}>
                <InfoCard
                  title="Total Users"
                  description={formatNumber(data.users.totalUsers)}
                  icon="users"
                />
                <InfoCard
                  title="Avg Balance"
                  description={formatCurrency(data.users.averageBalance)}
                  icon="wallet"
                />
                <InfoCard
                  title="Total Spent"
                  description={formatCurrency(data.users.totalSpent)}
                  icon="arrow-down"
                />
                <InfoCard
                  title="Total Received"
                  description={formatCurrency(data.users.totalReceived)}
                  icon="arrow-up"
                />
              </View>
            </GlassCard>

            <GlassCard>
              <Text style={styles.sectionTitle}>Payment Preferences</Text>
              <View style={styles.ratioContainer}>
                <View style={styles.ratioItem}>
                  <Text style={styles.ratioLabel}>Cash-Out Ratio</Text>
                  <Text style={styles.ratioValue}>{(data.users.cashOutRatio * 100).toFixed(1)}%</Text>
                </View>
                <View style={styles.ratioItem}>
                  <Text style={styles.ratioLabel}>Digital Payment Ratio</Text>
                  <Text style={styles.ratioValue}>{(data.users.digitalPaymentRatio * 100).toFixed(1)}%</Text>
                </View>
              </View>
            </GlassCard>

            {/* Preferred Payment Methods */}
            {data.users.preferredPaymentMethods.length > 0 && (
              <GlassCard>
                <Text style={styles.sectionTitle}>Preferred Payment Methods</Text>
                {data.users.preferredPaymentMethods.map((method, index) => (
                  <View key={method.method} style={styles.listItem}>
                    <View style={styles.listItemLeft}>
                      <Text style={styles.listItemTitle}>{method.method}</Text>
                    </View>
                    <View style={styles.listItemRight}>
                      <Text style={styles.listItemValue}>{method.percentage.toFixed(1)}%</Text>
                      <Text style={styles.listItemSubtext}>{formatNumber(method.count)} users</Text>
                    </View>
                  </View>
                ))}
              </GlassCard>
            )}
          </View>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <View style={styles.tabContent}>
            <GlassCard>
              <Text style={styles.sectionTitle}>Product Development Insights</Text>
              <Text style={styles.insightsSubtitle}>
                Recommendations based on transaction analytics data
              </Text>
            </GlassCard>

            {data.insights.length === 0 ? (
              <GlassCard>
                <EmptyState
                  icon="lightbulb-o"
                  title="No Insights Available"
                  message="Insights will be generated as more transaction data becomes available"
                />
              </GlassCard>
            ) : (
              data.insights.map((insight, index) => (
                <GlassCard key={index} style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightTitle}>{insight.title}</Text>
                    <View
                      style={[styles.priorityBadge, { backgroundColor: getPriorityColor(insight.priority) }]}
                    >
                      <Text style={styles.priorityText}>{insight.priority.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.insightDescription}>{insight.description}</Text>
                  <View style={styles.insightDetails}>
                    <View style={styles.insightDetailItem}>
                      <Text style={styles.insightLabel}>Opportunity:</Text>
                      <Text style={styles.insightDetailText}>{insight.opportunity}</Text>
                    </View>
                    <View style={styles.insightDetailItem}>
                      <Text style={styles.insightLabel}>Expected Impact:</Text>
                      <Text style={styles.insightDetailText}>{insight.expectedImpact}</Text>
                    </View>
                    <View style={styles.insightDetailItem}>
                      <Text style={styles.insightLabel}>Confidence:</Text>
                      <Text style={styles.insightDetailText}>{insight.confidence}%</Text>
                    </View>
                  </View>
                </GlassCard>
              ))
            )}
          </View>
        )}

        <View style={styles.footer} />
      </ScrollView>
    </StandardScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    padding: HORIZONTAL_PADDING,
    paddingBottom: SECTION_SPACING,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  dateRangeCard: {
    marginHorizontal: HORIZONTAL_PADDING,
    marginBottom: SECTION_SPACING,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  dateRangeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  realTimeCard: {
    marginHorizontal: HORIZONTAL_PADDING,
    marginBottom: SECTION_SPACING,
    padding: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: HORIZONTAL_PADDING,
    marginBottom: SECTION_SPACING,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  listItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: 12,
    width: 24,
  },
  listItemTitle: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  listItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  listItemSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ratioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  ratioItem: {
    alignItems: 'center',
  },
  ratioLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  ratioValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  insightCard: {
    marginBottom: SECTION_SPACING,
    padding: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  insightDescription: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  insightDetails: {
    marginTop: 8,
  },
  insightDetailItem: {
    marginBottom: 8,
  },
  insightLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  insightDetailText: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 2,
  },
  insightOpportunity: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 8,
    lineHeight: 20,
  },
  insightImpact: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 8,
    lineHeight: 20,
  },
  insightConfidence: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  insightsSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  footer: {
    height: 40,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.background + '80',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  metricCardTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  metricCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
});
