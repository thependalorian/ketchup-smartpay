/**
 * Cashback Dashboard Screen
 * 
 * Location: app/cashback/index.tsx
 * Purpose: Display cashback balance, history, and available offers
 * 
 * Features:
 * - Total cashback balance
 * - Recent cashback transactions
 * - Available cashback offers
 * - Cashback statistics
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
import { GlassCard, PillButton } from '@/components/common';
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
}

interface CashbackOffer {
  id: string;
  merchantName: string;
  cashbackRate: number;
  validUntil: string;
  description: string;
}

export default function CashbackDashboardScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [cashbackBalance, setCashbackBalance] = useState<number>(0);
  const [recentTransactions, setRecentTransactions] = useState<CashbackTransaction[]>([]);
  const [availableOffers, setAvailableOffers] = useState<CashbackOffer[]>([]);
  const [loading, setLoading] = useState(true);

  const currency = user?.currency || 'N$';

  useEffect(() => {
    fetchCashbackData();
  }, []);

  const fetchCashbackData = async () => {
    try {
      setLoading(true);
      
      // Fetch cashback balance (Open Banking format)
      const balanceResponse = await apiGet<any>('/api/v1/cashback/balance');
      if (balanceResponse && balanceResponse.Balance) {
        setCashbackBalance(balanceResponse.Balance.Amount || 0);
      }

      // Fetch recent transactions (Open Banking format)
      const historyResponse = await apiGet<any>('/api/v1/cashback/history?limit=5');
      if (historyResponse && historyResponse.CashbackTransactions) {
        const formatted = historyResponse.CashbackTransactions.slice(0, 5).map((t: any) => ({
          id: t.CashbackTransactionId,
          merchantName: t.MerchantName || 'Unknown',
          amount: t.PaymentAmount,
          cashbackAmount: t.CashbackAmount,
          cashbackRate: t.CashbackRate,
          transactionDate: t.CreatedDateTime,
        }));
        setRecentTransactions(formatted);
      }

      // Fetch available offers (Open Banking format)
      const offersResponse = await apiGet<any>('/api/v1/cashback/offers');
      if (offersResponse && offersResponse.Offers) {
        const formatted = offersResponse.Offers.map((o: any) => ({
          id: o.OfferId,
          merchantName: o.MerchantName,
          cashbackRate: o.CashbackRate,
          validUntil: o.ValidUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          description: o.Description,
        }));
        setAvailableOffers(formatted);
      }
    } catch (error) {
      logger.error('Failed to fetch cashback data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StandardScreenLayout title="Cashback">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </StandardScreenLayout>
    );
  }

  return (
    <StandardScreenLayout title="Cashback">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Cashback Balance */}
        <GlassCard style={styles.balanceCard} padding={24} borderRadius={16}>
          <View style={styles.balanceContent}>
            <Text style={styles.balanceLabel}>Total Cashback</Text>
            <Text style={styles.balanceAmount}>
              {currency} {cashbackBalance.toFixed(2)}
            </Text>
            <Text style={styles.balanceSubtext}>
              Available in your Buffr wallet
            </Text>
          </View>
        </GlassCard>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
            <PillButton
              label="View History"
              icon="history"
              variant="outline"
              onPress={() => router.push('/cashback/history')}
              style={styles.actionButton}
            />
            <PillButton
              label="How to Earn"
              icon="gift"
              variant="outline"
              onPress={() => router.push('/cashback/earn')}
              style={styles.actionButton}
            />
        </View>

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Cashback</Text>
              <TouchableOpacity onPress={() => router.push('/cashback/history')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {recentTransactions.map((transaction) => (
              <GlassCard key={transaction.id} style={styles.transactionCard} padding={16} borderRadius={12}>
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionMerchant}>{transaction.merchantName}</Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.transactionDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.cashbackBadge}>
                    <FontAwesome name="gift" size={14} color={Colors.success} />
                    <Text style={styles.cashbackAmount}>
                      +{currency} {transaction.cashbackAmount.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDetailText}>
                    Payment: {currency} {transaction.amount.toFixed(2)} • 
                    Rate: {transaction.cashbackRate}%
                  </Text>
                </View>
              </GlassCard>
            ))}
          </View>
        )}

        {/* Available Offers */}
        {availableOffers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Offers</Text>
            {availableOffers.map((offer) => (
              <GlassCard key={offer.id} style={styles.offerCard} padding={16} borderRadius={16}>
                <View style={styles.offerHeader}>
                  <View style={styles.offerInfo}>
                    <Text style={styles.offerMerchant}>{offer.merchantName}</Text>
                    <Text style={styles.offerDescription}>{offer.description}</Text>
                    <Text style={styles.offerValid}>
                      Valid until: {new Date(offer.validUntil).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.offerRate}>
                    <Text style={styles.offerRateText}>{offer.cashbackRate}%</Text>
                    <Text style={styles.offerRateLabel}>Cashback</Text>
                  </View>
                </View>
              </GlassCard>
            ))}
          </View>
        )}

        {/* Empty State */}
        {recentTransactions.length === 0 && availableOffers.length === 0 && (
          <EmptyState
            icon="gift"
            iconSize={64}
            iconColor={Colors.textSecondary}
            title="No cashback yet"
            message="Start earning cashback by paying at participating merchants"
            actionLabel="Learn How to Earn"
            onAction={() => router.push('/cashback/earn')}
          />
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
  balanceCard: {
    marginBottom: SECTION_SPACING,
    backgroundColor: Colors.success + '10',
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  balanceContent: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.success,
    marginBottom: 8,
  },
  balanceSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12, // Consistent gap between action buttons
    marginBottom: SECTION_SPACING,
  },
  actionButton: {
    flex: 1,
  },
  section: {
    marginBottom: SECTION_SPACING,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  transactionCard: {
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionMerchant: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  cashbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.success + '20',
    gap: 8,
  },
  cashbackAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
  transactionDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  transactionDetailText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  offerCard: {
    marginBottom: 12, // Consistent spacing between offer cards
    backgroundColor: Colors.primary + '10',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  offerInfo: {
    flex: 1,
  },
  offerMerchant: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  offerDescription: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  offerValid: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  offerRate: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary + '20',
  },
  offerRateText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  offerRateLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
