/**
 * Scheduled Bills Screen
 * 
 * Location: app/bills/scheduled.tsx
 * Purpose: Display and manage scheduled bill payments
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
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StandardScreenLayout } from '@/components/layouts';
import { GlassCard, PillButton } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';
import { apiGet, apiPost } from '@/utils/apiClient';
import logger from '@/utils/logger';

interface ScheduledBill {
  id: string;
  billName: string;
  provider: string;
  amount: number;
  dueDate: string;
  scheduleType: 'monthly' | 'weekly' | 'custom';
  isActive: boolean;
  nextPaymentDate: string;
}

export default function ScheduledBillsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [scheduledBills, setScheduledBills] = useState<ScheduledBill[]>([]);
  const [loading, setLoading] = useState(true);

  const currency = user?.currency || 'N$';

  useEffect(() => {
    fetchScheduledBills();
  }, []);

  const fetchScheduledBills = async () => {
    try {
      setLoading(true);
      const response = await apiGet<any>('/api/v1/bills/scheduled');
      if (response && response.ScheduledBills) {
        const formatted = response.ScheduledBills.map((sb: any) => ({
          id: sb.ScheduledBillId,
          billId: sb.BillId,
          billName: sb.BillName,
          provider: sb.Provider,
          amount: sb.Amount,
          dueDate: sb.NextPaymentDate,
          scheduleType: sb.ScheduleType.toLowerCase() as 'monthly' | 'weekly' | 'custom',
          isActive: sb.IsActive,
          nextPaymentDate: sb.NextPaymentDate,
        }));
        setScheduledBills(formatted);
      }
    } catch (error) {
      logger.error('Failed to fetch scheduled bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSchedule = async (scheduledBillId: string, isActive: boolean) => {
    try {
      // Open Banking format request
      await apiPost(`/api/v1/bills/scheduled/${scheduledBillId}/toggle`, {
        Data: {
          IsActive: !isActive,
        },
      });
      fetchScheduledBills(); // Refresh list
    } catch (error: any) {
      logger.error('Failed to toggle schedule:', error);
    }
  };

  const handleEditSchedule = (billId: string) => {
    // Navigate to edit schedule screen (to be implemented)
    router.push(`/bills/scheduled/${billId}/edit`);
  };

  if (loading) {
    return (
      <StandardScreenLayout title="Scheduled Bills">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </StandardScreenLayout>
    );
  }

  return (
    <StandardScreenLayout title="Scheduled Bills">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {scheduledBills.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="calendar" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No scheduled bills</Text>
            <Text style={styles.emptySubtext}>
              Schedule bills for automatic payments
            </Text>
            <PillButton
              label="Add Scheduled Bill"
              variant="primary"
              onPress={() => router.push('/bills')}
              style={styles.addButton}
            />
          </View>
        ) : (
          scheduledBills.map((bill) => (
            <GlassCard key={bill.id} style={styles.billCard} padding={16} borderRadius={16}>
              <View style={styles.billHeader}>
                <View style={styles.billInfo}>
                  <Text style={styles.billName}>{bill.billName}</Text>
                  <Text style={styles.billProvider}>{bill.provider}</Text>
                  <Text style={styles.billSchedule}>
                    {bill.scheduleType === 'monthly' ? 'Monthly' : 
                     bill.scheduleType === 'weekly' ? 'Weekly' : 'Custom'} payment
                  </Text>
                </View>
                <Switch
                  value={bill.isActive}
                  onValueChange={() => handleToggleSchedule(bill.id, bill.isActive)}
                  trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
                  thumbColor={bill.isActive ? Colors.primary : Colors.textSecondary}
                />
              </View>
              <View style={styles.billDetails}>
                <View style={styles.billDetailRow}>
                  <FontAwesome name="money" size={16} color={Colors.textSecondary} />
                  <Text style={styles.billDetailText}>
                    {currency} {bill.amount.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.billDetailRow}>
                  <FontAwesome name="calendar" size={16} color={Colors.textSecondary} />
                  <Text style={styles.billDetailText}>
                    Next: {new Date(bill.nextPaymentDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditSchedule(bill.id)}
              >
                <FontAwesome name="edit" size={14} color={Colors.primary} />
                <Text style={styles.editButtonText}>Edit Schedule</Text>
              </TouchableOpacity>
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
    marginBottom: SECTION_SPACING,
    textAlign: 'center',
  },
  addButton: {
    marginTop: 16,
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
  billSchedule: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  billDetails: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  billDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  billDetailText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary + '10',
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
});
