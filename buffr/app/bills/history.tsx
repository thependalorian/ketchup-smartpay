/**
 * Bill Payment History Screen
 * 
 * Location: app/bills/history.tsx
 * Purpose: Display history of bill payments
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StandardScreenLayout } from '@/components/layouts';
import { GlassCard } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';
import { apiGet } from '@/utils/apiClient';
import logger from '@/utils/logger';

interface BillPayment {
  id: string;
  billName: string;
  provider: string;
  amount: number;
  paymentDate: string;
  status: 'completed' | 'pending' | 'failed';
  receiptUrl?: string;
}

export default function BillHistoryScreen() {
  const router = useRouter();
  const { paymentSuccess, billId } = useLocalSearchParams<{ paymentSuccess?: string; billId?: string }>();
  const { user } = useUser();
  const [payments, setPayments] = useState<BillPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const currency = user?.currency || 'N$';

  useEffect(() => {
    fetchPaymentHistory();
    
    // Show success message if payment was successful
    if (paymentSuccess === 'true') {
      // Could show a toast notification here
    }
  }, [paymentSuccess, billId]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await apiGet<any>('/api/v1/bills/history');
      if (response && response.Payments) {
        const formatted = response.Payments.map((p: any) => ({
          id: p.PaymentId,
          billName: p.BillName,
          provider: p.Provider,
          amount: p.Amount,
          paymentDate: p.PaymentDate,
          status: p.Status.toLowerCase() as 'completed' | 'pending' | 'failed',
          receiptUrl: p.ReceiptUrl,
        }));
        setPayments(formatted);
      }
    } catch (error) {
      logger.error('Failed to fetch bill payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentPress = (paymentId: string) => {
    router.push(`/transactions/${paymentId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'failed':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <StandardScreenLayout title="Bill Payment History">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </StandardScreenLayout>
    );
  }

  return (
    <StandardScreenLayout title="Bill Payment History">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {payments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="history" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No payment history</Text>
            <Text style={styles.emptySubtext}>
              Your bill payments will appear here
            </Text>
          </View>
        ) : (
          payments.map((payment) => (
            <GlassCard
              key={payment.id}
              style={styles.paymentCard}
              padding={16}
              borderRadius={16}
              onPress={() => handlePaymentPress(payment.id)}
            >
              <View style={styles.paymentHeader}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentName}>{payment.billName}</Text>
                  <Text style={styles.paymentProvider}>{payment.provider}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(payment.status) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(payment.status) },
                    ]}
                  >
                    {payment.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.paymentFooter}>
                <View>
                  <Text style={styles.paymentAmountLabel}>Amount Paid</Text>
                  <Text style={styles.paymentAmount}>
                    {currency} {payment.amount.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.paymentDate}>
                  <FontAwesome name="calendar" size={14} color={Colors.textSecondary} />
                  <Text style={styles.paymentDateText}>
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </Text>
                </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  paymentCard: {
    marginBottom: 16,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  paymentProvider: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  paymentAmountLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  paymentDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentDateText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
