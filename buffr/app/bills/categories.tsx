/**
 * Bill Categories Screen
 * 
 * Location: app/bills/categories.tsx
 * Purpose: Display bills in a specific category
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

interface Bill {
  id: string;
  name: string;
  provider: string;
  accountNumber: string;
  amount: number;
  dueDate: string;
  category: string;
}

export default function BillCategoriesScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const { user } = useUser();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState<string>('All Bills');

  const currency = user?.currency || 'N$';

  useEffect(() => {
    fetchBills();
  }, [category]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const endpoint = category 
        ? `/api/v1/bills?category=${category}`
        : '/api/v1/bills';
      
      const response = await apiGet<any>(endpoint);
      if (response && response.Bills) {
        const formatted = response.Bills.map((bill: any) => ({
          id: bill.BillId,
          name: bill.Name,
          provider: bill.Provider,
          accountNumber: bill.AccountNumber,
          amount: bill.Amount,
          dueDate: bill.DueDate,
          category: bill.Category,
          minimumAmount: bill.MinimumAmount,
        }));
        setBills(formatted);
      }

      // Set category name
      if (category) {
        const categoryNames: Record<string, string> = {
          utilities: 'Utilities',
          water: 'Water',
          internet: 'Internet',
          tv: 'TV & Media',
          insurance: 'Insurance',
          other: 'Other',
        };
        setCategoryName(categoryNames[category] || 'Bills');
      }
    } catch (error) {
      logger.error('Failed to fetch bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBillPress = (billId: string) => {
    router.push(`/bills/pay/${billId}`);
  };

  if (loading) {
    return (
      <StandardScreenLayout title={categoryName}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </StandardScreenLayout>
    );
  }

  return (
    <StandardScreenLayout title={categoryName}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {bills.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="file-text" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No bills found</Text>
            <Text style={styles.emptySubtext}>
              Add a bill to get started with bill payments
            </Text>
          </View>
        ) : (
          bills.map((bill) => (
            <GlassCard
              key={bill.id}
              style={styles.billCard}
              padding={16}
              borderRadius={16}
              onPress={() => handleBillPress(bill.id)}
            >
              <View style={styles.billHeader}>
                <View style={styles.billInfo}>
                  <Text style={styles.billName}>{bill.name}</Text>
                  <Text style={styles.billProvider}>{bill.provider}</Text>
                  <Text style={styles.billAccount}>Account: {bill.accountNumber}</Text>
                </View>
                <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
              </View>
              <View style={styles.billFooter}>
                <View>
                  <Text style={styles.billAmountLabel}>Amount Due</Text>
                  <Text style={styles.billAmount}>
                    {currency} {bill.amount.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.billDueDate}>
                  <FontAwesome name="calendar" size={14} color={Colors.textSecondary} />
                  <Text style={styles.billDueDateText}>
                    Due: {new Date(bill.dueDate).toLocaleDateString()}
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
  billCard: {
    marginBottom: 16,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  billInfo: {
    flex: 1,
  },
  billName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  billProvider: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  billAccount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  billFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  billAmountLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  billAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  billDueDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  billDueDateText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
