/**
 * Pay Bill Screen
 * 
 * Location: app/bills/pay/[billId].tsx
 * Purpose: Pay a specific bill with amount confirmation and 2FA
 * 
 * Flow:
 * 1. Bill details display
 * 2. Amount confirmation (can pay partial)
 * 3. Payment method selection
 * 4. 2FA verification
 * 5. Processing
 * 6. Success
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
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StandardScreenLayout } from '@/components/layouts';
import { GlassCard, PillButton } from '@/components/common';
import TwoFactorVerification from '@/components/compliance/TwoFactorVerification';
import { useUser } from '@/contexts/UserContext';
import { useWallets } from '@/contexts/WalletsContext';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';
import { apiGet, apiPost } from '@/utils/apiClient';
import logger from '@/utils/logger';

interface Bill {
  id: string;
  name: string;
  provider: string;
  accountNumber: string;
  amount: number;
  dueDate: string;
  category: string;
  minimumAmount?: number;
}

export default function PayBillScreen() {
  const router = useRouter();
  const { billId } = useLocalSearchParams<{ billId: string }>();
  const { user } = useUser();
  const { wallets, getDefaultWallet } = useWallets();

  const [bill, setBill] = useState<Bill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [show2FA, setShow2FA] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const currency = user?.currency || 'N$';

  useEffect(() => {
    if (billId) {
      fetchBillDetails();
      const defaultWallet = getDefaultWallet();
      if (defaultWallet) {
        setSelectedWalletId(defaultWallet.id);
      }
    }
  }, [billId]);

  useEffect(() => {
    if (bill) {
      setPaymentAmount(bill.amount.toString());
    }
  }, [bill]);

  const fetchBillDetails = async () => {
    try {
      setLoading(true);
      const response = await apiGet<any>(`/api/v1/bills/${billId}`);
      if (response && response.Bill) {
        const billData = response.Bill;
        setBill({
          id: billData.BillId,
          name: billData.Name,
          provider: billData.Provider,
          accountNumber: billData.AccountNumber,
          amount: billData.Amount,
          dueDate: billData.DueDate,
          category: billData.Category,
          minimumAmount: billData.MinimumAmount,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load bill details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!bill || !selectedWalletId) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    if (bill.minimumAmount && amount < bill.minimumAmount) {
      Alert.alert('Error', `Minimum payment is ${currency}${bill.minimumAmount.toFixed(2)}`);
      return;
    }

    if (amount > bill.amount) {
      Alert.alert('Error', `Payment amount cannot exceed bill amount (${currency}${bill.amount.toFixed(2)})`);
      return;
    }

    setShow2FA(true);
  };

  const handle2FAComplete = async (method: 'pin' | 'biometric', code?: string) => {
    setVerificationToken('verified_token');
    setShow2FA(false);
    await processPayment();
  };

  const processPayment = async () => {
    if (!bill || !selectedWalletId || !verificationToken) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      setProcessing(true);
      
      // Open Banking format request
      await apiPost('/api/v1/bills/pay', {
        Data: {
          Initiation: {
            BillId: bill.id,
            Amount: amount.toString(),
            WalletId: selectedWalletId,
          },
        },
        verificationToken,
      });

      router.push({
        pathname: '/bills/history',
        params: {
          paymentSuccess: 'true',
          billId: bill.id,
        },
      });
    } catch (error: any) {
      Alert.alert('Payment Failed', error.message || 'Failed to process bill payment');
      setProcessing(false);
    }
  };

  if (loading || processing) {
    return (
      <StandardScreenLayout title="Pay Bill">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {processing ? 'Processing payment...' : 'Loading...'}
          </Text>
        </View>
      </StandardScreenLayout>
    );
  }

  if (!bill) {
    return (
      <StandardScreenLayout title="Pay Bill">
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Bill not found</Text>
        </View>
      </StandardScreenLayout>
    );
  }

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
  const paymentAmountNum = parseFloat(paymentAmount || '0');

  return (
    <StandardScreenLayout title="Pay Bill">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Bill Details */}
        <GlassCard style={styles.billCard} padding={24} borderRadius={16}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Provider</Text>
            <Text style={styles.detailValue}>{bill.provider}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Account Number</Text>
            <Text style={styles.detailValue}>{bill.accountNumber}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Due Date</Text>
            <Text style={styles.detailValue}>
              {new Date(bill.dueDate).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.totalLabel}>Total Amount Due</Text>
            <Text style={styles.totalValue}>
              {currency} {bill.amount.toFixed(2)}
            </Text>
          </View>
        </GlassCard>

        {/* Payment Amount Input */}
        <GlassCard style={styles.amountCard} padding={24} borderRadius={16}>
          <Text style={styles.sectionTitle}>Payment Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>{currency}</Text>
            <TextInput
              style={styles.amountInput}
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
          <Text style={styles.amountHint}>
            {bill.minimumAmount 
              ? `Minimum: ${currency}${bill.minimumAmount.toFixed(2)} • Maximum: ${currency}${bill.amount.toFixed(2)}`
              : `Maximum: ${currency}${bill.amount.toFixed(2)}`}
          </Text>
        </GlassCard>

        {/* Wallet Selection */}
        {wallets.length > 1 && (
          <GlassCard style={styles.walletCard} padding={16} borderRadius={16}>
            <Text style={styles.sectionTitle}>Pay From</Text>
            {wallets.map((wallet) => (
              <TouchableOpacity
                key={wallet.id}
                style={[
                  styles.walletOption,
                  selectedWalletId === wallet.id && styles.walletOptionSelected,
                ]}
                onPress={() => setSelectedWalletId(wallet.id)}
              >
                <View style={styles.walletInfo}>
                  <FontAwesome
                    name="credit-card"
                    size={20}
                    color={Colors.primary}
                  />
                  <View style={styles.walletText}>
                    <Text style={styles.walletName}>{wallet.name}</Text>
                    <Text style={styles.walletBalance}>
                      Balance: {currency} {wallet.balance.toFixed(2)}
                    </Text>
                  </View>
                </View>
                {selectedWalletId === wallet.id && (
                  <FontAwesome name="check-circle" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </GlassCard>
        )}

        {/* Payment Summary */}
        <GlassCard style={styles.summaryCard} padding={24} borderRadius={16}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bill</Text>
            <Text style={styles.detailValue}>{bill.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Amount</Text>
            <Text style={styles.detailValue}>
              {currency} {paymentAmountNum.toFixed(2)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>From Wallet</Text>
            <Text style={styles.detailValue}>
              {selectedWallet?.name || 'Default Wallet'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.totalLabel}>Total Payment</Text>
            <Text style={styles.totalValue}>
              {currency} {paymentAmountNum.toFixed(2)}
            </Text>
          </View>
        </GlassCard>

        {/* Info Card */}
        <GlassCard style={styles.infoCard} padding={16} borderRadius={16}>
          <View style={styles.infoContent}>
            <FontAwesome name="info-circle" size={20} color={Colors.info} />
            <Text style={styles.infoText}>
              The payment will be processed immediately. Make sure you have sufficient 
              balance in your selected wallet. This action requires 2FA verification for security.
            </Text>
          </View>
        </GlassCard>

        {/* Confirm Button */}
        <PillButton
          label="Confirm Payment"
          variant="primary"
          onPress={handleConfirm}
          style={styles.confirmButton}
          disabled={!selectedWalletId || paymentAmountNum <= 0}
        />
      </ScrollView>

      {/* 2FA Verification Modal */}
      {bill && selectedWallet && (
        <TwoFactorVerification
          visible={show2FA}
          onVerify={handle2FAComplete}
          onCancel={() => {
            setShow2FA(false);
            setVerificationToken(null);
          }}
          amount={paymentAmountNum}
          recipientName={bill.provider}
        />
      )}
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.error,
  },
  billCard: {
    marginBottom: SECTION_SPACING,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  amountCard: {
    marginBottom: SECTION_SPACING,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
  },
  amountHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  walletCard: {
    marginBottom: SECTION_SPACING,
  },
  walletOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  walletOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletText: {
    flex: 1,
    marginLeft: 12,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryCard: {
    marginBottom: SECTION_SPACING,
  },
  infoCard: {
    marginBottom: SECTION_SPACING,
    backgroundColor: Colors.info + '10',
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    marginLeft: 12,
    lineHeight: 20,
  },
  confirmButton: {
    marginTop: 8,
  },
});
