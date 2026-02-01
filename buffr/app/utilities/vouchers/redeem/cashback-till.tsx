/**
 * Cashback at Merchant Till Redemption Flow Screen
 * 
 * Location: app/utilities/vouchers/redeem/cashback-till.tsx
 * Purpose: Redeem voucher with cashback at merchant POS terminal
 * 
 * Flow:
 * 1. Select merchant (or scan QR)
 * 2. Enter payment amount (can be less than voucher amount)
 * 3. Cashback calculation display (merchant-funded, 1-3% typical)
 * 4. 2FA verification (PSD-12 compliance)
 * 5. Processing
 * 6. Success with cashback credited
 * 
 * Key Feature: Reduces NamPost bottlenecks by distributing cash-out load
 * Model: Merchant-funded cashback (M-PESA agent network model)
 * Integration: IPP (Instant Payment Platform) for cashback processing
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
import { useVouchers, Voucher } from '@/contexts/VouchersContext';
import { useUser } from '@/contexts/UserContext';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';
import { apiPost, apiGet } from '@/utils/apiClient';
import logger from '@/utils/logger';

interface Merchant {
  id: string;
  name: string;
  category: string;
  location: string;
  cashbackRate: number; // Percentage (1-3% typical)
  qrCode?: string;
}

export default function CashbackTillScreen() {
  const router = useRouter();
  const { voucherId } = useLocalSearchParams<{ voucherId: string }>();
  const { user } = useUser();
  const { vouchers, fetchVouchers, redeemVoucher } = useVouchers();

  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [cashbackAmount, setCashbackAmount] = useState<number>(0);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [show2FA, setShow2FA] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [nearbyMerchants, setNearbyMerchants] = useState<Merchant[]>([]);

  const currency = user?.currency || 'N$';

  useEffect(() => {
    if (voucherId) {
      fetchVoucherDetails();
      fetchNearbyMerchants();
    }
  }, [voucherId]);

  useEffect(() => {
    if (merchant && paymentAmount) {
      calculateCashback();
    }
  }, [merchant, paymentAmount]);

  const fetchVoucherDetails = async () => {
    try {
      setLoading(true);
      await fetchVouchers();
      const foundVoucher = vouchers.find((v) => v.id === voucherId);
      if (foundVoucher) {
        setVoucher(foundVoucher);
        setPaymentAmount(foundVoucher.amount.toString());
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load voucher details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyMerchants = async () => {
    try {
      const response = await apiGet<any>('/api/v1/merchants/nearby');
      if (response && response.Merchants) {
        const formatted = response.Merchants.map((m: any) => ({
          id: m.MerchantId,
          name: m.Name,
          category: m.Category,
          location: m.Location,
          cashbackRate: m.Cashback?.Rate || 0,
        }));
        setNearbyMerchants(formatted);
      }
    } catch (error) {
      logger.error('Failed to fetch nearby merchants:', error);
      // Continue without nearby merchants
    }
  };

  const calculateCashback = () => {
    if (!merchant || !paymentAmount) {
      setCashbackAmount(0);
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setCashbackAmount(0);
      return;
    }

    const cashback = (amount * merchant.cashbackRate) / 100;
    setCashbackAmount(cashback);
  };

  const handleScanQR = () => {
    setShowScanner(true);
  };

  const handleQRCodeScanned = async (qrData: string) => {
    try {
      setShowScanner(false);
      // Open Banking format request
      const response = await apiPost<any>('/api/v1/merchants/validate-qr', {
        Data: {
          QRCode: qrData,
        },
      });
      
      if (response && response.Merchant) {
        const m = response.Merchant;
        setMerchant({
          id: m.MerchantId,
          name: m.Name,
          category: m.Category,
          location: m.Location,
          cashbackRate: m.Cashback?.Rate || 0,
          qrCode: m.QRCode,
        });
      } else {
        Alert.alert('Invalid QR Code', 'This QR code is not from a participating merchant.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to validate merchant QR code');
    }
  };

  const handleSelectMerchant = (selectedMerchant: Merchant) => {
    setMerchant(selectedMerchant);
  };

  const handleConfirm = () => {
    if (!voucher || !merchant) {
      Alert.alert('Error', 'Please select a merchant first');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    if (amount > voucher.amount) {
      Alert.alert('Error', `Payment amount cannot exceed voucher amount (${currency}${voucher.amount.toFixed(2)})`);
      return;
    }

    setShow2FA(true);
  };

  const handle2FAComplete = async (method: 'pin' | 'biometric', code?: string) => {
    setVerificationToken('verified_token');
    setShow2FA(false);
    await processRedemption();
  };

  const processRedemption = async () => {
    if (!voucher || !merchant || !verificationToken) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      setProcessing(true);
      
      // Redeem voucher with cashback at till
      // Note: This uses the existing voucher redemption endpoint
      // The cashback will be processed via merchant payment endpoint
      await redeemVoucher(voucher.id, 'merchant_payment', {
        merchantId: merchant.id,
        paymentAmount: amount,
        cashbackAmount,
        cashbackRate: merchant.cashbackRate,
        verificationToken,
      });

      router.push({
        pathname: '/utilities/vouchers/redeem/success',
        params: {
          voucherId: voucher.id,
          amount: amount.toString(),
          method: 'cashback_till',
          merchantId: merchant.id,
          merchantName: merchant.name,
          cashbackAmount: cashbackAmount.toString(),
        },
      });
    } catch (error: any) {
      Alert.alert('Payment Failed', error.message || 'Failed to process cashback payment');
      setProcessing(false);
    }
  };

  if (loading || processing) {
    return (
      <StandardScreenLayout title="Cashback at Till">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {processing ? 'Processing payment...' : 'Loading...'}
          </Text>
        </View>
      </StandardScreenLayout>
    );
  }

  if (!voucher) {
    return (
      <StandardScreenLayout title="Cashback at Till">
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Voucher not found</Text>
        </View>
      </StandardScreenLayout>
    );
  }

  return (
    <StandardScreenLayout title="Cashback at Till">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Voucher Amount Display */}
        <GlassCard style={styles.voucherCard} padding={24} borderRadius={16}>
          <Text style={styles.voucherLabel}>Available Voucher Amount</Text>
          <Text style={styles.voucherAmount}>
            {currency} {voucher.amount.toFixed(2)}
          </Text>
        </GlassCard>

        {/* Merchant Selection */}
        {!merchant ? (
          <>
            <GlassCard style={styles.scanCard} padding={24} borderRadius={16}>
              <View style={styles.scanContent}>
                <FontAwesome name="qrcode" size={64} color={Colors.primary} />
                <Text style={styles.scanTitle}>Select Merchant</Text>
                <Text style={styles.scanDescription}>
                  Scan QR code at merchant POS terminal or select from nearby merchants
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

            {/* Nearby Merchants */}
            {nearbyMerchants.length > 0 && (
              <GlassCard style={styles.merchantsCard} padding={16} borderRadius={16}>
                <Text style={styles.sectionTitle}>Nearby Merchants</Text>
                {nearbyMerchants.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.merchantOption}
                    onPress={() => handleSelectMerchant(m)}
                  >
                    <View style={styles.merchantOptionContent}>
                      <FontAwesome name="store" size={20} color={Colors.primary} />
                      <View style={styles.merchantOptionText}>
                        <Text style={styles.merchantOptionName}>{m.name}</Text>
                        <Text style={styles.merchantOptionDetails}>
                          {m.category} • {m.cashbackRate}% cashback
                        </Text>
                      </View>
                    </View>
                    <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </GlassCard>
            )}
          </>
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
              <Text style={styles.amountHint}>
                Maximum: {currency} {voucher.amount.toFixed(2)}
              </Text>
            </GlassCard>

            {/* Cashback Calculation */}
            {paymentAmount && parseFloat(paymentAmount) > 0 && (
              <GlassCard style={styles.cashbackCard} padding={16} borderRadius={16}>
                <View style={styles.cashbackHeader}>
                  <FontAwesome name="gift" size={20} color={Colors.success} />
                  <Text style={styles.cashbackTitle}>Cashback Earned</Text>
                </View>
                <View style={styles.cashbackDetails}>
                  <View style={styles.cashbackRow}>
                    <Text style={styles.cashbackLabel}>Payment Amount</Text>
                    <Text style={styles.cashbackValue}>
                      {currency} {parseFloat(paymentAmount || '0').toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.cashbackRow}>
                    <Text style={styles.cashbackLabel}>Cashback Rate</Text>
                    <Text style={styles.cashbackValue}>{merchant.cashbackRate}%</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.cashbackRow}>
                    <Text style={styles.cashbackTotalLabel}>Cashback Amount</Text>
                    <Text style={styles.cashbackTotalValue}>
                      {currency} {cashbackAmount.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={styles.cashbackInfo}>
                  <FontAwesome name="info-circle" size={14} color={Colors.info} />
                  <Text style={styles.cashbackInfoText}>
                    Cashback will be credited to your wallet after payment
                  </Text>
                </View>
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
                  {currency} {parseFloat(paymentAmount || '0').toFixed(2)}
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
                <Text style={styles.totalLabel}>Total Credit to Wallet</Text>
                <Text style={styles.totalValue}>
                  {currency} {cashbackAmount.toFixed(2)}
                </Text>
              </View>
            </GlassCard>

            {/* Info Card */}
            <GlassCard style={styles.infoCard} padding={16} borderRadius={16}>
              <View style={styles.infoContent}>
                <FontAwesome name="info-circle" size={20} color={Colors.info} />
                <Text style={styles.infoText}>
                  Pay at the merchant POS terminal. The payment amount will be deducted from your voucher, 
                  and cashback will be instantly credited to your Buffr wallet. This reduces NamPost 
                  bottlenecks by distributing cash-out across the merchant network.
                </Text>
              </View>
            </GlassCard>

            {/* Confirm Button */}
            <PillButton
              label="Confirm Payment"
              variant="primary"
              onPress={handleConfirm}
              style={styles.confirmButton}
              disabled={!paymentAmount || parseFloat(paymentAmount || '0') <= 0}
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
      {voucher && merchant && (
        <TwoFactorVerification
          visible={show2FA}
          onVerify={handle2FAComplete}
          onCancel={() => {
            setShow2FA(false);
            setVerificationToken(null);
          }}
          amount={parseFloat(paymentAmount || '0')}
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
  voucherCard: {
    marginBottom: SECTION_SPACING,
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  voucherLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  voucherAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
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
  merchantsCard: {
    marginBottom: SECTION_SPACING,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 20,
  },
  merchantOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  merchantOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  merchantOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  merchantOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  merchantOptionDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  merchantCard: {
    marginBottom: SECTION_SPACING,
  },
  merchantHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
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
    marginTop: 8,
  },
  cashbackBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
    marginLeft: 6,
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
  cashbackCard: {
    marginBottom: SECTION_SPACING,
    backgroundColor: Colors.success + '10',
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  cashbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cashbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  cashbackDetails: {
    marginTop: 8,
  },
  cashbackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cashbackLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  cashbackValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  cashbackTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  cashbackTotalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.success,
  },
  cashbackInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cashbackInfoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 6,
    lineHeight: 16,
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
