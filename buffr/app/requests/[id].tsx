/**
 * Request Status Screen
 * 
 * Location: app/requests/[id].tsx
 * Purpose: View and manage money request status
 * 
 * Features:
 * - Request details with glass cards
 * - Payment progress (for partial payments)
 * - Pay request option
 * - Cancel request option
 * - Real estate planning
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import defaultStyles from '@/constants/Styles';
import { ScreenHeader, ContactDetailCard, PillButton, GlassCard, StatusBadge } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import Layout from '@/constants/Layout';
import { log } from '@/utils/logger';

interface MoneyRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserPhone: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  paidAmount: number;
  note?: string;
  status: 'pending' | 'partial' | 'paid' | 'cancelled';
  createdAt: Date;
  paidAt?: Date;
}

export default function RequestStatusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const currency = user?.currency || 'N$';
  
  const [request, setRequest] = useState<MoneyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Load request data from API
  useEffect(() => {
    const loadRequest = async () => {
      setLoading(true);
      try {
        const { apiGet } = await import('@/utils/apiClient');
        const requestData = await apiGet<MoneyRequest>(`/requests/${params.id}`);
        setRequest(requestData);
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to load request');
        log.error('Error loading request:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadRequest();
    }
  }, [params.id]);

  const handlePayRequest = () => {
    router.push({
      pathname: '/pay-request/[id]',
      params: { id: params.id },
    });
  };

  const handleCancelRequest = async () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              const { apiPut } = await import('@/utils/apiClient');
              await apiPut(`/requests/${params.id}`, { action: 'cancel' });
              
              Alert.alert('Request Cancelled', 'The money request has been cancelled.');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel request');
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={[defaultStyles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading request...</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={defaultStyles.container}>
        <ScreenHeader title="Request" showBackButton onBack={handleBack} />
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Request not found</Text>
        </View>
      </View>
    );
  }

  const isRequestFromMe = request.fromUserId === user?.id;
  const remainingAmount = request.amount - request.paidAmount;
  const progressPercentage = (request.paidAmount / request.amount) * 100;

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader title="Money Request" showBackButton onBack={handleBack} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badge */}
        <View style={styles.statusSection}>
          <StatusBadge
            status={
              request.status === 'paid'
                ? 'success'
                : request.status === 'cancelled'
                ? 'error'
                : request.status === 'partial'
                ? 'warning'
                : 'info'
            }
            label={
              request.status === 'paid'
                ? 'Paid'
                : request.status === 'cancelled'
                ? 'Cancelled'
                : request.status === 'partial'
                ? 'Partially Paid'
                : 'Pending'
            }
          />
        </View>

        {/* Request From/To Card - Glass Effect */}
        <GlassCard style={styles.contactCard} padding={16} borderRadius={16}>
          <Text style={styles.cardLabel}>
            {isRequestFromMe ? 'Requested From' : 'Requested By'}
          </Text>
          <ContactDetailCard
            contact={{
              id: isRequestFromMe ? request.toUserId : request.fromUserId,
              name: isRequestFromMe ? request.toUserName : request.fromUserName,
              phoneNumber: isRequestFromMe ? '' : request.fromUserPhone,
            }}
          />
        </GlassCard>

        {/* Amount Card - Glass Effect */}
        <GlassCard style={styles.amountCard} padding={16} borderRadius={16}>
          <Text style={styles.cardLabel}>Request Amount</Text>
          <View style={styles.amountDisplay}>
            <Text style={styles.currencySymbol}>{currency}</Text>
            <Text style={styles.amountValue}>
              {request.amount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
          
          {/* Progress Bar (if partial payment) */}
          {request.status === 'partial' && (
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercentage}%` },
                  ]}
                />
              </View>
              <View style={styles.progressInfo}>
                <Text style={styles.progressText}>
                  Paid: {currency} {request.paidAmount.toLocaleString()}
                </Text>
                <Text style={styles.progressText}>
                  Remaining: {currency} {remainingAmount.toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        </GlassCard>

        {/* Note Card - Glass Effect (if note exists) */}
        {request.note && (
          <GlassCard style={styles.noteCard} padding={16} borderRadius={16}>
            <Text style={styles.cardLabel}>Note</Text>
            <Text style={styles.noteText}>{request.note}</Text>
          </GlassCard>
        )}

        {/* Request Info Card - Glass Effect */}
        <GlassCard style={styles.infoCard} padding={16} borderRadius={16}>
          <View style={styles.infoRow}>
            <FontAwesome name="calendar" size={16} color={Colors.textSecondary} />
            <Text style={styles.infoText}>
              Created: {request.createdAt.toLocaleDateString()}
            </Text>
          </View>
          {request.paidAt && (
            <View style={styles.infoRow}>
              <FontAwesome name="check-circle" size={16} color={Colors.success} />
              <Text style={styles.infoText}>
                Paid: {request.paidAt.toLocaleDateString()}
              </Text>
            </View>
          )}
        </GlassCard>
      </ScrollView>

      {/* Action Buttons */}
      {!isRequestFromMe && request.status === 'pending' && (
        <View style={styles.buttonContainer}>
          <PillButton
            label="Pay Request"
            variant="primary"
            onPress={handlePayRequest}
            disabled={isPaying || isCancelling}
          />
        </View>
      )}
      
      {isRequestFromMe && request.status !== 'paid' && request.status !== 'cancelled' && (
        <View style={styles.buttonContainer}>
          <PillButton
            label={isCancelling ? 'Cancelling...' : 'Cancel Request'}
            variant="secondary"
            onPress={handleCancelRequest}
            disabled={isPaying || isCancelling}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
    paddingTop: Layout.SECTION_SPACING,
    paddingBottom: Layout.LARGE_SECTION_SPACING,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  statusSection: {
    marginBottom: Layout.SECTION_SPACING,
    alignItems: 'center',
  },
  contactCard: {
    marginBottom: Layout.SECTION_SPACING,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  amountCard: {
    marginBottom: Layout.SECTION_SPACING,
    alignItems: 'center',
  },
  amountDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
    gap: 8,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  amountValue: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressSection: {
    width: '100%',
    marginTop: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  noteCard: {
    marginBottom: Layout.SECTION_SPACING,
  },
  noteText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  infoCard: {
    marginBottom: Layout.SECTION_SPACING,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  buttonContainer: {
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
