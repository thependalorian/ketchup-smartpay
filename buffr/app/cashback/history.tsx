/**
 * Cashback History Screen
 * 
 * Location: app/cashback/history.tsx
 * Purpose: Display complete cashback transaction history
 * 
 * Based on: Buffr App Design wireframes + Apple HIG
 * Design System: Uses exact values from wireframes
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StandardScreenLayout } from '@/components/layouts';
import { GlassCard, EmptyState } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';
import { apiGet } from '@/utils/apiClient';
import logger from '@/utils/logger';

interface CashbackTransaction {
  id: string;
  merchantName: string;
  amount: number;
  cashbackAmount: number;
  cashbackRate: number;
  transactionDate: string;
  status: 'completed' | 'pending';
}

export default function CashbackHistoryScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [transactions, setTransactions] = useState<CashbackTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const currency = user?.currency || 'N$';

  useEffect(() => {
    fetchCashbackHistory();
  }, []);

  const fetchCashbackHistory = async () => {
    try {
      setLoading(true);
      const response = await apiGet<any>('/api/v1/cashback/history');
      if (response && response.CashbackTransactions) {
        const formatted = response.CashbackTransactions.map((t: any) => ({
          id: t.CashbackTransactionId,
          merchantName: t.MerchantName || 'Unknown',
          amount: t.PaymentAmount,
          cashbackAmount: t.CashbackAmount,
          cashbackRate: t.CashbackRate,
          transactionDate: t.CreatedDateTime,
          status: t.Status.toLowerCase() as 'completed' | 'pending',
        }));
        setTransactions(formatted);
      }
    } catch (error) {
      logger.error('Failed to fetch cashback history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionPress = (transactionId: string) => {
    router.push(`/transactions/${transactionId}`);
  };

  if (loading) {
    return (
      <StandardScreenLayout title="Cashback History">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </StandardScreenLayout>
    );
  }

  return (
    <StandardScreenLayout title="Cashback History">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {transactions.length === 0 ? (
          <EmptyState
            icon="gift"
            iconSize={64}
            iconColor={Colors.textSecondary}
            title="No cashback history"
            message="Your cashback transactions will appear here"
          />
        ) : (
          transactions.map((transaction) => (
            <GlassCard
              key={transaction.id}
              style={styles.transactionCard}
              padding={16}
              borderRadius={16}
              onPress={() => handleTransactionPress(transaction.id)}
            >
              <View style={styles.transactionHeader}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionMerchant}>{transaction.merchantName}</Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.transactionDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View style={styles.cashbackBadge}>
                  <FontAwesome name="gift" size={16} color={Colors.success} />
                  <Text style={styles.cashbackAmount}>
                    +{currency} {transaction.cashbackAmount.toFixed(2)}
                  </Text>
                </View>
              </View>
              <View style={styles.transactionDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Amount</Text>
                  <Text style={styles.detailValue}>
                    {currency} {transaction.amount.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cashback Rate</Text>
                  <Text style={styles.detailValue}>{transaction.cashbackRate}%</Text>
                </View>
                {transaction.status === 'pending' && (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Pending</Text>
                  </View>
                )}
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </StandardScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: HORIZONTAL_PADDING,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionCard: {
    marginBottom: 12, // Consistent spacing between transaction cards
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionMerchant: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  cashbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.success + '20',
    gap: 8,
  },
  cashbackAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.success,
  },
  transactionDetails: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.warning + '20',
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.warning,
  },
});
