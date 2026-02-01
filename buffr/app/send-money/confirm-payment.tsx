/**
 * Send Money: Confirm Payment Screen
 *
 * Location: app/send-money/confirm-payment.tsx
 *
 * Purpose: Final step in the send money flow. User confirms all payment details before execution.
 *
 * === PSD-12 COMPLIANCE ===
 * §7.2: 2FA is MANDATORY on ALL payment transactions - no exceptions
 * This screen ALWAYS requires 2FA verification before processing payment
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import defaultStyles from '@/constants/Styles';
import Layout, { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';
import { ScreenHeader, PillButton } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import { useWallets } from '@/contexts/WalletsContext';
import { useCards } from '@/contexts/CardsContext';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useFraudDetection } from '@/hooks/useBuffrAI';
import TwoFactorVerification from '@/components/compliance/TwoFactorVerification';
import FeeTransparency from '@/components/compliance/FeeTransparency';
import { getCurrentLocation } from '@/utils/location';

interface PaymentSource {
  id: string;
  name: string;
  displayName: string;
  type: 'buffr' | 'wallet' | 'card';
  balance?: number;
  currency?: string;
  icon?: string;
  last4?: string;
}

export default function ConfirmPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    contactId?: string;
    contactName?: string;
    contactPhone?: string;
    amount?: string;
    note?: string;
    paymentSourceId?: string;
  }>();

  const { user } = useUser();
  const { wallets, refreshWallets } = useWallets();
  const { cards } = useCards();
  const { refreshTransactions } = useTransactions();
  const { checkFraud, loading: fraudLoading } = useFraudDetection();

  const [paymentSource, setPaymentSource] = useState<PaymentSource | null>(null);
  const [show2FA, setShow2FA] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fraudChecked, setFraudChecked] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  // Initialize payment source from params
  useEffect(() => {
    const sourceId = params.paymentSourceId;
    if (!sourceId) return;

    if (sourceId === 'buffr-account') {
      setPaymentSource({
        id: 'buffr-account',
        name: 'Buffr Account',
        displayName: 'Buffr Account',
        type: 'buffr',
        balance: user?.buffrCardBalance || 0,
        currency: user?.currency || 'N$',
      });
      return;
    }

    const wallet = wallets.find((w) => w.id === sourceId);
    if (wallet) {
      setPaymentSource({
        id: wallet.id,
        name: wallet.name,
        displayName: wallet.name,
        type: 'wallet',
        balance: wallet.balance,
        currency: wallet.currency,
        icon: wallet.icon,
      });
      return;
    }

    const card = cards.find((c) => c.id === sourceId);
    if (card) {
      setPaymentSource({
        id: card.id,
        name: `Card •••• ${card.last4}`,
        displayName: `${card.network} •••• ${card.last4}`,
        type: 'card',
        last4: card.last4,
      });
    }
  }, [params.paymentSourceId, user, wallets, cards]);

  /**
   * Handle payment confirmation
   * Step 1: Fraud check
   * Step 2: MANDATORY 2FA (PSD-12 requirement)
   * Step 3: Process payment
   */
  const handleConfirmAndPay = async () => {
    const amountNum = parseFloat(params.amount || '0');

    setIsProcessing(true);
    try {
      // Step 1: Fraud Detection
      const locationResult = await getCurrentLocation();
      const userLocation = { lat: locationResult.coords.lat, lon: locationResult.coords.lon };
      const deviceFingerprint = `${Platform.OS}_${Platform.Version}`;

      const fraudResult = await checkFraud({
        transaction_id: `txn_${Date.now()}`,
        amount: amountNum,
        merchant_name: params.contactName || 'Unknown',
        merchant_mcc: 6211, // P2P
        user_location: userLocation,
        merchant_location: userLocation,
        timestamp: new Date().toISOString(),
        device_fingerprint: deviceFingerprint,
        beneficiary_account_age_days: 30,
      });

      if (fraudResult.is_fraud || fraudResult.risk_level === 'HIGH' || fraudResult.risk_level === 'CRITICAL') {
        Alert.alert('Security Alert', fraudResult.explanation);
        setIsProcessing(false);
        return;
      }

      setFraudChecked(true);

      // Step 2: MANDATORY 2FA (PSD-12 §7.2)
      // 2FA is ALWAYS required - no exceptions per Bank of Namibia regulations
      setShow2FA(true);

    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred during security check.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Verify 2FA code/biometric
   * In production, this should validate against secure backend
   */
  const handle2FAVerify = async (method: 'pin' | 'biometric', code?: string): Promise<boolean> => {
    try {
      const { apiPost } = await import('@/utils/apiClient');

      // Verify with backend API
      const response = await apiPost<{
        verified: boolean;
        verificationToken: string;
        expiresAt: string;
        method: string;
      }>('/auth/verify-2fa', {
        method,
        pin: method === 'pin' ? code : undefined,
        biometricToken: method === 'biometric' ? 'verified' : undefined, // expo-local-authentication handles verification client-side
        transactionContext: {
          type: 'payment',
          amount: parseFloat(params.amount || '0'),
          recipientId: params.contactId,
        },
      });

      if (response.verified && response.verificationToken) {
        // Store verification token for payment processing
        setVerificationToken(response.verificationToken);
        return true;
      }

      return false;
    } catch (error) {
      // 2FA verification error handled by Alert below
      Alert.alert('Verification Failed', 'Unable to verify your identity. Please try again.');
      return false;
    }
  };

  /**
   * Process payment after successful 2FA
   */
  const processPayment = async () => {
    setIsProcessing(true);
    try {
      const { apiPost } = await import('@/utils/apiClient');
      const response = await apiPost('/payments/send', {
        toUserId: params.contactId,
        toUserName: params.contactName,
        amount: parseFloat(params.amount || '0'),
        note: params.note,
        paymentSource: params.paymentSourceId,
        verificationToken: verificationToken, // Include 2FA verification token (PSD-12 Compliance)
      });

      // Refresh wallets and transactions before navigating to success
      await Promise.all([refreshWallets(), refreshTransactions()]);

      router.replace({
        pathname: '/send-money/success',
        params: {
          amount: params.amount,
          contactName: params.contactName,
          transactionId: response.data?.transactionId || 'TXN-' + Date.now(),
        },
      });
    } catch (error: any) {
      Alert.alert('Payment Failed', error.message || 'Could not complete the payment.');
    } finally {
      setIsProcessing(false);
      setShow2FA(false);
    }
  };

  const handle2FASuccess = async () => {
    await processPayment();
  };

  return (
    <View style={defaultStyles.containerFull}>
      <ScreenHeader title="Confirm Payment" showBackButton onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Payment Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>You are sending</Text>
          <Text style={styles.summaryAmount}>
            {user?.currency || 'N$'}{parseFloat(params.amount || '0').toFixed(2)}
          </Text>
          <Text style={styles.summaryRecipient}>to {params.contactName}</Text>
        </View>

        {/* Payment Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>From</Text>
            <Text style={styles.detailValue}>{paymentSource?.displayName || '...'}</Text>
          </View>

          {params.note && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Note</Text>
              <Text style={styles.detailValue}>{params.note}</Text>
            </View>
          )}

          {/* Fee Transparency (PSD-1 requirement) */}
          <View style={styles.feeRow}>
            <FeeTransparency
              transactionType="send"
              amount={parseFloat(params.amount || '0')}
            />
          </View>
        </View>

        {/* 2FA Notice (PSD-12 compliance) */}
        <View style={styles.securityNotice}>
          <Text style={styles.securityIcon}>🔐</Text>
          <Text style={styles.securityText}>
            This payment requires verification with your PIN or biometrics for your security.
          </Text>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.confirmButtonContainer}>
        <PillButton
          label={isProcessing ? 'Processing...' : 'Confirm & Pay'}
          variant="primary"
          onPress={handleConfirmAndPay}
          disabled={isProcessing || fraudLoading}
        />
      </View>

      {/* 2FA Modal - MANDATORY per PSD-12 */}
      {show2FA && (
        <TwoFactorVerification
          visible={show2FA}
          onVerify={async (method, code) => {
            const verified = await handle2FAVerify(method, code);
            if (verified) {
              await handle2FASuccess();
            }
            return verified;
          }}
          onCancel={() => {
            setShow2FA(false);
            setFraudChecked(false);
          }}
          amount={parseFloat(params.amount || '0')}
          recipientName={params.contactName || 'Recipient'}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: Layout.HORIZONTAL_PADDING,
    paddingBottom: 120,
  },
  summaryCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: SECTION_SPACING,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.8,
  },
  summaryAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.white,
    marginVertical: 8,
  },
  summaryRecipient: {
    fontSize: 16,
    color: Colors.white,
  },
  detailsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  feeRow: {
    paddingTop: 12,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
  },
  securityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  confirmButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: HORIZONTAL_PADDING,
    paddingBottom: 40,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
