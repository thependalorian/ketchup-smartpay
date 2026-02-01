/**
 * Pay Request Screen
 * 
 * Location: app/pay-request/[id].tsx
 * Purpose: Pay a money request from a contact
 * 
 * Features:
 * - Request details with glass cards
 * - Payment source selection
 * - Confirm and pay
 * - Decline request option
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
import { ScreenHeader, ContactDetailCard, PayFromSelector, PaymentSource, PillButton, GlassCard } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import { useWallets } from '@/contexts/WalletsContext';
import { useCards } from '@/contexts/CardsContext';
import Layout from '@/constants/Layout';
import { log } from '@/utils/logger';

interface MoneyRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserPhone: string;
  amount: number;
  note?: string;
  status: 'pending' | 'partial' | 'paid' | 'cancelled';
}

export default function PayRequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const { wallets, getWalletById } = useWallets();
  const { cards, getDefaultCard } = useCards();
  const currency = user?.currency || 'N$';
  
  const [request, setRequest] = useState<MoneyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentSource, setSelectedPaymentSource] = useState<PaymentSource | null>(null);
  const [showPayFromSelector, setShowPayFromSelector] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

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

  // Initialize with default payment source
  useEffect(() => {
    if (!selectedPaymentSource && user && !showPayFromSelector) {
      setSelectedPaymentSource({
        id: 'buffr-account',
        name: 'Buffr Account',
        displayName: 'Buffr Account',
        type: 'buffr',
        balance: user.buffrCardBalance,
        currency: currency,
      });
    }
  }, [user, selectedPaymentSource, showPayFromSelector, currency]);

  const handlePay = async () => {
    if (!selectedPaymentSource) {
      Alert.alert('Error', 'Please select a payment source');
      return;
    }

    if (!request) return;

    // Check balance
    if (selectedPaymentSource.balance && selectedPaymentSource.balance < request.amount) {
      Alert.alert('Insufficient Balance', 'You do not have enough funds in the selected account');
      return;
    }

    Alert.alert(
      'Confirm Payment',
      `Pay ${currency} ${request.amount.toLocaleString()} to ${request.fromUserName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay',
          onPress: async () => {
            setIsPaying(true);
            try {
              const { apiPut } = await import('@/utils/apiClient');
              await apiPut(`/requests/${request.id}`, {
                action: 'pay',
                amount: request.amount,
                paymentSource: selectedPaymentSource.id,
              });
              
              Alert.alert(
                'Payment Successful',
                `You paid ${currency} ${request.amount.toLocaleString()} to ${request.fromUserName}`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      router.replace({
                        pathname: '/requests/[id]',
                        params: { id: request.id },
                      });
                    },
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Payment failed. Please try again.');
              log.error('Error paying request:', error);
            } finally {
              setIsPaying(false);
            }
          },
        },
      ]
    );
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              const { apiPut } = await import('@/utils/apiClient');
              await apiPut(`/requests/${params.id}`, { action: 'decline' });
              
              Alert.alert('Request Declined', 'The money request has been declined.');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to decline request');
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
        <ScreenHeader title="Pay Request" showBackButton onBack={handleBack} />
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Request not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader title="Pay Request" showBackButton onBack={handleBack} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Request From Card - Glass Effect */}
        <GlassCard style={styles.contactCard} padding={16} borderRadius={16}>
          <Text style={styles.cardLabel}>Requested By</Text>
          <ContactDetailCard
            contact={{
              id: request.fromUserId,
              name: request.fromUserName,
              phoneNumber: request.fromUserPhone,
            }}
          />
        </GlassCard>

        {/* Amount Card - Glass Effect */}
        <GlassCard style={styles.amountCard} padding={20} borderRadius={16}>
          <Text style={styles.cardLabel}>Amount to Pay</Text>
          <View style={styles.amountDisplay}>
            <Text style={styles.currencySymbol}>{currency}</Text>
            <Text style={styles.amountValue}>
              {request.amount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
        </GlassCard>

        {/* Note Card - Glass Effect (if note exists) */}
        {request.note && (
          <GlassCard style={styles.noteCard} padding={16} borderRadius={16}>
            <Text style={styles.cardLabel}>Note</Text>
            <Text style={styles.noteText}>{request.note}</Text>
          </GlassCard>
        )}

        {/* Payment Source Card - Glass Effect */}
        <GlassCard style={styles.paymentSourceCard} padding={16} borderRadius={16}>
          <Text style={styles.cardLabel}>Pay From</Text>
          <TouchableOpacity
            style={styles.paymentSourceButton}
            onPress={() => setShowPayFromSelector(true)}
          >
            <View style={styles.paymentSourceInfo}>
              <FontAwesome
                name={
                  selectedPaymentSource?.type === 'wallet'
                    ? 'credit-card'
                    : selectedPaymentSource?.type === 'card'
                    ? 'credit-card'
                    : 'bank'
                }
                size={20}
                color={Colors.primary}
              />
              <View style={styles.paymentSourceDetails}>
                <Text style={styles.paymentSourceName}>
                  {selectedPaymentSource?.displayName || 'Select Payment Source'}
                </Text>
                {selectedPaymentSource?.balance !== undefined && (
                  <Text style={styles.paymentSourceBalance}>
                    Balance: {currency} {selectedPaymentSource.balance.toLocaleString()}
                  </Text>
                )}
              </View>
            </View>
            <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </GlassCard>

        {/* Info Card - Glass Effect */}
        <GlassCard style={styles.infoCard} padding={16} borderRadius={16}>
          <View style={styles.infoRow}>
            <FontAwesome name="info-circle" size={18} color={Colors.info} />
            <Text style={styles.infoText}>
              The payment will be processed immediately and the request will be marked as paid.
            </Text>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <PillButton
          label={isPaying ? 'Processing...' : 'Pay Request'}
          variant="primary"
          onPress={handlePay}
          disabled={isPaying || !selectedPaymentSource}
        />
        <TouchableOpacity
          style={styles.declineButton}
          onPress={handleDecline}
          disabled={isPaying}
        >
          <Text style={styles.declineButtonText}>Decline Request</Text>
        </TouchableOpacity>
      </View>

      {/* Pay From Selector Modal */}
      <PayFromSelector
        visible={showPayFromSelector}
        onClose={() => setShowPayFromSelector(false)}
        onSelectSource={(source: PaymentSource) => {
          setSelectedPaymentSource(source);
          setShowPayFromSelector(false);
        }}
        selectedSourceId={selectedPaymentSource?.id}
      />
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
  noteCard: {
    marginBottom: Layout.SECTION_SPACING,
  },
  noteText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  paymentSourceCard: {
    marginBottom: Layout.SECTION_SPACING,
  },
  paymentSourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  paymentSourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  paymentSourceDetails: {
    flex: 1,
    gap: 4,
  },
  paymentSourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  paymentSourceBalance: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoCard: {
    marginBottom: Layout.SECTION_SPACING,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  declineButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
});
