/**
 * Bill Payments Home Screen
 * 
 * Location: app/bills/index.tsx
 * Purpose: Main screen for bill payments - categories and quick access
 * 
 * Features:
 * - Bill categories (utilities, services, etc.)
 * - Quick pay options
 * - Scheduled bills
 * - Payment history
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

interface BillCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  billCount?: number;
}

interface ScheduledBill {
  id: string;
  billName: string;
  amount: number;
  dueDate: string;
  category: string;
}

export default function BillsHomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [categories, setCategories] = useState<BillCategory[]>([]);
  const [scheduledBills, setScheduledBills] = useState<ScheduledBill[]>([]);
  const [loading, setLoading] = useState(true);

  const currency = user?.currency || 'N$';

  useEffect(() => {
    fetchBillData();
  }, []);

  const fetchBillData = async () => {
    try {
      setLoading(true);
      
      // Fetch bill categories (Open Banking format)
      const categoriesResponse = await apiGet<any>('/api/v1/bills/categories');
      if (categoriesResponse && categoriesResponse.Categories) {
        const formatted = categoriesResponse.Categories.map((cat: any) => ({
          id: cat.CategoryId,
          name: cat.Name,
          icon: cat.Icon,
          color: Colors.primary,
          billCount: cat.BillCount || 0,
        }));
        setCategories(formatted);
      }

      // Fetch scheduled bills (Open Banking format)
      const scheduledResponse = await apiGet<any>('/api/v1/bills/scheduled');
      if (scheduledResponse && scheduledResponse.ScheduledBills) {
        const formatted = scheduledResponse.ScheduledBills.map((sb: any) => ({
          id: sb.ScheduledBillId,
          billName: sb.BillName,
          amount: sb.Amount,
          dueDate: sb.NextPaymentDate,
          category: sb.Category,
          scheduleType: sb.ScheduleType.toLowerCase() as 'monthly' | 'weekly' | 'custom',
          isActive: sb.IsActive,
          nextPaymentDate: sb.NextPaymentDate,
        }));
        setScheduledBills(formatted);
      }
    } catch (error) {
      logger.error('Failed to fetch bill data:', error);
      // Set default categories if API fails
      setCategories([
        { id: 'utilities', name: 'Utilities', icon: 'bolt', color: Colors.warning },
        { id: 'water', name: 'Water', icon: 'tint', color: Colors.info },
        { id: 'internet', name: 'Internet', icon: 'wifi', color: Colors.primary },
        { id: 'tv', name: 'TV & Media', icon: 'tv', color: Colors.error },
        { id: 'insurance', name: 'Insurance', icon: 'shield', color: Colors.success },
        { id: 'other', name: 'Other', icon: 'file-text', color: Colors.textSecondary },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    router.push(`/bills/categories?category=${categoryId}`);
  };

  const handleScheduledBillPress = (billId: string) => {
    router.push(`/bills/pay/${billId}`);
  };

  if (loading) {
    return (
      <StandardScreenLayout title="Bill Payments">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </StandardScreenLayout>
    );
  }

  return (
    <StandardScreenLayout title="Bill Payments">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Scheduled Bills Section */}
        {scheduledBills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Scheduled Bills</Text>
              <TouchableOpacity onPress={() => router.push('/bills/scheduled')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {scheduledBills.slice(0, 3).map((bill) => (
              <TouchableOpacity
                key={bill.id}
                onPress={() => handleScheduledBillPress(bill.id)}
                activeOpacity={0.7}
              >
                <GlassCard
                  style={styles.scheduledBillCard}
                  padding={16}
                  borderRadius={12}
                >
                  <View style={styles.scheduledBillContent}>
                    <View style={styles.scheduledBillInfo}>
                      <Text style={styles.scheduledBillName}>{bill.billName}</Text>
                      <Text style={styles.scheduledBillDue}>
                        Due: {new Date(bill.dueDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.scheduledBillAmount}>
                      <Text style={styles.scheduledBillAmountText}>
                        {currency} {bill.amount.toFixed(2)}
                      </Text>
                      <FontAwesome name="chevron-right" size={14} color={Colors.textSecondary} />
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bill Categories Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Categories</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => handleCategoryPress(category.id)}
                activeOpacity={0.7}
              >
                <GlassCard style={styles.categoryCard} padding={16} borderRadius={16}>
                  <View
                    style={[
                      styles.categoryIconContainer,
                      { backgroundColor: category.color + '20' },
                    ]}
                  >
                    <FontAwesome
                      name={category.icon as any}
                      size={24}
                      color={category.color}
                    />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  {category.billCount !== undefined && category.billCount > 0 && (
                    <Text style={styles.categoryCount}>{category.billCount} bills</Text>
                  )}
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <PillButton
              label="Payment History"
              icon="history"
              variant="outline"
              onPress={() => router.push('/bills/history')}
              style={styles.quickActionButton}
            />
            <PillButton
              label="Scheduled Bills"
              icon="calendar"
              variant="outline"
              onPress={() => router.push('/bills/scheduled')}
              style={styles.quickActionButton}
            />
          </View>
        </View>
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
  scheduledBillCard: {
    marginBottom: 12, // Consistent spacing between list items
  },
  scheduledBillContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduledBillInfo: {
    flex: 1,
  },
  scheduledBillName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  scheduledBillDue: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  scheduledBillAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduledBillAmountText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '30%',
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
  },
});
