/**
 * Merchant Payment Screen
 * 
 * Location: app/merchants/pay.tsx
 * Purpose: Pay at merchant with QR code or manual entry
 * 
 * Flow:
 * 1. Scan merchant QR or select merchant
 * 2. Enter payment amount
 * 3. Confirm payment details
 * 4. 2FA verification
 * 5. Processing
 * 6. Success with cashback
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
import QRCodeScanner from '@/components/qr/QRCodeScanner';
import TwoFactorVerification from '@/components/compliance/TwoFactorVerification';
import { useUser } from '@/contexts/UserContext';
import { useWallets } from '@/contexts/WalletsContext';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';
import { apiGet, apiPost } from '@/utils/apiClient';
import logger from '@/utils/logger';

interface Merchant {
  id: string;
  name: string;
  category: string;
  cashbackRate: number;
  qrCode?: string;
}

export default function MerchantPaymentScreen() {
  const router = useRouter();
  const { merchantId } = useLocalSearchParams<{ merchantId?: string }>();
  const { user } = useUser();
  const { wallets, getDefaultWallet } = useWallets();

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [show2FA, setShow2FA] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const currency = user?.currency || 'N$';

  useEffect(() => {
    if (merchantId) {
      fetchMerchantDetails();
    }
    const defaultWallet = getDefaultWallet();
    if (defaultWallet) {
      setSelectedWalletId(defaultWallet.id);
    }
  }, [merchantId]);

  const fetchMerchantDetails = async () => {
    try {
      setLoading(true);
      const response = await apiGet<any>(`/api/v1/merchants/${merchantId}`);
      if (response && response.Merchant) {
        const m = response.Merchant;
        setMerchant({
          id: m.MerchantId,
          name: m.Name,
          category: m.Category,
          cashbackRate: m.Cashback?.Rate || 0,
          qrCode: m.QRCode,
        });
      }
    } catch (error) {
      logger.error('Failed to fetch merchant details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    setShowScanner(true);
  };

  const handleQRCodeScanned = async (qrData: string) => {
    try {
      setShowScanner(false);
      const response = await apiPost<{ merchant: Merchant }>('/api/v1/merchants/validate-qr', {
        qrCode: qrData,
      });
      
      if (response && response.merchant) {
        setMerchant(response.merchant);
      } else {
        Alert.alert('Invalid QR Code', 'This QR code is not from a participating merchant.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to validate merchant QR code');
    }
  };

  const calculateCashback = () => {
    if (!merchant || !paymentAmount) return 0;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return 0;
    return (amount * merchant.cashbackRate) / 100;
  };

  const handleConfirm = () => {
    if (!merchant) {
      Alert.alert('Error', 'Please select or scan a merchant first');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    if (!selectedWalletId) {
      Alert.alert('Error', 'Please select a wallet');
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
    if (!merchant || !selectedWalletId || !verificationToken) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      setProcessing(true);
      const cashback = calculateCashback();
      
      // Open Banking format request
      await apiPost('/api/v1/merchants/pay', {
        Data: {
          Initiation: {
            MerchantId: merchant.id,
            Amount: amount.toString(),
            WalletId: selectedWalletId,
            CashbackRate: merchant.cashbackRate.toString(),
          },
        },
        verificationToken,
      });

      router.push({
        pathname: '/merchants/pay/success',
        params: {
          merchantId: merchant.id,
          merchantName: merchant.name,
          amount: amount.toString(),
          cashbackAmount: cashback.toFixed(2),
        },
      });
    } catch (error: any) {
      Alert.alert('Payment Failed', error.message || 'Failed to process merchant payment');
      setProcessing(false);
    }
  };

  if (loading || processing) {
    return (
      <StandardScreenLayout title="Merchant Payment">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {processing ? 'Processing payment...' : 'Loading...'}
          </Text>
        </View>
      </StandardScreenLayout>
    );
  }

  const cashbackAmount = calculateCashback();
  const paymentAmountNum = parseFloat(paymentAmount || '0');
  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);

  return (
    <StandardScreenLayout title="Merchant Payment">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Merchant Selection */}
        {!merchant ? (
          <GlassCard style={styles.scanCard} padding={24} borderRadius={16}>
            <View style={styles.scanContent}>
              <FontAwesome name="qrcode" size={64} color={Colors.primary} />
              <Text style={styles.scanTitle}>Scan Merchant QR Code</Text>
              <Text style={styles.scanDescription}>
                Scan the QR code at the merchant's payment terminal to proceed with payment
              </Text>
              <PillButton
                label="Scan QR Code"
                icon="camera"
                variant="primary"
                onPress={handleScanQR}
                style={styles.scanButton}
              />
            </View>
          </GlassCard>
        ) : (
          <>
            {/* Merchant Details */}
            <GlassCard style={styles.merchantCard} padding={16} borderRadius={16}>
              <View style={styles.merchantHeader}>
                <TouchableOpacity onPress={() => setMerchant(null)} style={styles.backButton}>
                  <FontAwesome name="arrow-left" size={16} color={Colors.primary} />
                </TouchableOpacity>
                <View style={styles.merchantInfo}>
                  <FontAwesome name="store" size={24} color={Colors.primary} />
                  <View style={styles.merchantText}>
                    <Text style={styles.merchantName}>{merchant.name}</Text>
                    <Text style={styles.merchantCategory}>{merchant.category}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.cashbackBadge}>
                <FontAwesome name="gift" size={16} color={Colors.success} />
                <Text style={styles.cashbackBadgeText}>
                  {merchant.cashbackRate}% Cashback Available
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
            </GlassCard>

            {/* Cashback Calculation */}
            {paymentAmountNum > 0 && cashbackAmount > 0 && (
              <GlassCard style={styles.cashbackCard} padding={16} borderRadius={16}>
                <View style={styles.cashbackHeader}>
                  <FontAwesome name="gift" size={20} color={Colors.success} />
                  <Text style={styles.cashbackTitle}>Cashback Earned</Text>
                </View>
                <Text style={styles.cashbackAmount}>
                  {currency} {cashbackAmount.toFixed(2)}
                </Text>
                <Text style={styles.cashbackInfo}>
                  Cashback will be credited to your wallet after payment
                </Text>
              </GlassCard>
            )}

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
                      <FontAwesome name="credit-card" size={20} color={Colors.primary} />
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
                <Text style={styles.detailLabel}>Merchant</Text>
                <Text style={styles.detailValue}>{merchant.name}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Amount</Text>
                <Text style={styles.detailValue}>
                  {currency} {paymentAmountNum.toFixed(2)}
                </Text>
              </View>

              {cashbackAmount > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cashback</Text>
                  <Text style={[styles.detailValue, styles.cashbackHighlight]}>
                    +{currency} {cashbackAmount.toFixed(2)}
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.totalLabel}>Total Deducted</Text>
                <Text style={styles.totalValue}>
                  {currency} {paymentAmountNum.toFixed(2)}
                </Text>
              </View>
            </GlassCard>

            {/* Confirm Button */}
            <PillButton
              label="Confirm Payment"
              variant="primary"
              onPress={handleConfirm}
              style={styles.confirmButton}
              disabled={!paymentAmount || paymentAmountNum <= 0 || !selectedWalletId}
            />
          </>
        )}
      </ScrollView>

      {/* QR Code Scanner Modal */}
      {showScanner && (
        <QRCodeScanner
          onQRCodeScanned={handleQRCodeScanned}
          onClose={() => setShowScanner(false)}
          title="Scan Merchant QR Code"
        />
      )}

      {/* 2FA Verification Modal */}
      {merchant && selectedWallet && (
        <TwoFactorVerification
          visible={show2FA}
          onVerify={handle2FAComplete}
          onCancel={() => {
            setShow2FA(false);
            setVerificationToken(null);
          }}
          amount={paymentAmountNum}
          recipientName={merchant.name}
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
  scanCard: {
    marginBottom: SECTION_SPACING,
    alignItems: 'center',
  },
  scanContent: {
    alignItems: 'center',
  },
  scanTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  scanDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: SECTION_SPACING,
    lineHeight: 20,
  },
  scanButton: {
    minWidth: 200,
  },
  merchantCard: {
    marginBottom: SECTION_SPACING,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  merchantHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  merchantInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  merchantText: {
    flex: 1,
    marginLeft: 12,
  },
  merchantName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  merchantCategory: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  cashbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.success + '20',
    borderWidth: 1,
    borderColor: Colors.success + '40',
    gap: 8,
  },
  cashbackBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },
  amountCard: {
    marginBottom: SECTION_SPACING,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 20,
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
  cashbackCard: {
    marginBottom: SECTION_SPACING,
    backgroundColor: Colors.success + '10',
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  cashbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cashbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  cashbackAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.success,
    marginBottom: 8,
  },
  cashbackInfo: {
    fontSize: 12,
    color: Colors.textSecondary,
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
    marginBottom: 12, // Consistent spacing between wallet options
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
  cashbackHighlight: {
    color: Colors.success,
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
  confirmButton: {
    marginTop: 8,
  },
});
