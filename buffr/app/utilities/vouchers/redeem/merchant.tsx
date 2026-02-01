/**
 * Merchant Payment Redemption Flow Screen
 * 
 * Location: app/utilities/vouchers/redeem/merchant.tsx
 * Purpose: Redeem voucher for payment at participating merchant
 * 
 * Flow:
 * 1. QR code scanner (scan merchant QR)
 * 2. Merchant details display
 * 3. Amount confirmation
 * 4. 2FA verification (PSD-12 compliance)
 * 5. Processing
 * 6. Success screen
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import QRCode from 'react-native-qrcode-svg';
import { StandardScreenLayout } from '@/components/layouts';
import { GlassCard, PillButton } from '@/components/common';
import QRCodeScanner from '@/components/qr/QRCodeScanner';
import TwoFactorVerification from '@/components/compliance/TwoFactorVerification';
import { useVouchers, Voucher } from '@/contexts/VouchersContext';
import { useUser } from '@/contexts/UserContext';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';
import { apiPost } from '@/utils/apiClient';

interface Merchant {
  id: string;
  name: string;
  category: string;
  location: string;
  qrCode: string;
}

export default function MerchantPaymentScreen() {
  const router = useRouter();
  const { voucherId } = useLocalSearchParams<{ voucherId: string }>();
  const { user } = useUser();
  const { vouchers, fetchVouchers, redeemVoucher } = useVouchers();

  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [show2FA, setShow2FA] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const currency = user?.currency || 'N$';

  useEffect(() => {
    if (voucherId) {
      fetchVoucherDetails();
    }
  }, [voucherId]);

  const fetchVoucherDetails = async () => {
    try {
      setLoading(true);
      await fetchVouchers();
      const foundVoucher = vouchers.find((v) => v.id === voucherId);
      setVoucher(foundVoucher || null);
    } catch (error) {
      Alert.alert('Error', 'Failed to load voucher details');
      router.back();
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
      const response = await apiPost('/api/v1/merchants/validate-qr', {
        qrCode: qrData,
      });
      
      if (response.success && response.data) {
        setMerchant(response.data.merchant);
      } else {
        Alert.alert('Invalid QR Code', 'This QR code is not from a participating merchant.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to validate merchant QR code');
    }
  };

  const handleConfirm = () => {
    if (!voucher || !merchant) {
      Alert.alert('Error', 'Please scan merchant QR code first');
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

    try {
      setProcessing(true);
      await redeemVoucher(voucher.id, 'merchant_payment', {
        merchantId: merchant.id,
        verificationToken,
      });

      router.push({
        pathname: '/utilities/vouchers/redeem/success',
        params: {
          voucherId: voucher.id,
          amount: voucher.amount.toString(),
          method: 'merchant',
          merchantId: merchant.id,
          merchantName: merchant.name,
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

  if (!voucher) {
    return (
      <StandardScreenLayout title="Merchant Payment">
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Voucher not found</Text>
        </View>
      </StandardScreenLayout>
    );
  }

  return (
    <StandardScreenLayout title="Merchant Payment">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Amount Display */}
        <GlassCard style={styles.amountCard} padding={24} borderRadius={16}>
          <Text style={styles.amountLabel}>Voucher Amount</Text>
          <Text style={styles.amountValue}>
            {currency} {voucher.amount.toFixed(2)}
          </Text>
        </GlassCard>

        {/* Scan QR Section */}
        {!merchant ? (
          <GlassCard style={styles.scanCard} padding={24} borderRadius={16}>
            <View style={styles.scanContent}>
              <FontAwesome name="qrcode" size={64} color={Colors.primary} />
              <Text style={styles.scanTitle}>Scan Merchant QR Code</Text>
              <Text style={styles.scanDescription}>
                Scan the QR code at the merchant's payment terminal to proceed with payment
              </Text>
              <PillButton onPress={handleScanQR} style={styles.scanButton}>
                <FontAwesome name="camera" size={20} color={Colors.white} style={styles.scanButtonIcon} />
                <Text style={styles.scanButtonText}>Scan QR Code</Text>
              </PillButton>
            </View>
          </GlassCard>
        ) : (
          <>
            {/* Merchant Details */}
            <GlassCard style={styles.merchantCard} padding={16} borderRadius={16}>
              <Text style={styles.sectionTitle}>Merchant Details</Text>
              <View style={styles.merchantInfo}>
                <View style={styles.merchantHeader}>
                  <FontAwesome name="store" size={24} color={Colors.primary} />
                  <View style={styles.merchantText}>
                    <Text style={styles.merchantName}>{merchant.name}</Text>
                    <Text style={styles.merchantCategory}>{merchant.category}</Text>
                  </View>
                </View>
                <View style={styles.merchantLocation}>
                  <FontAwesome name="map-marker" size={16} color={Colors.textSecondary} />
                  <Text style={styles.merchantLocationText}>{merchant.location}</Text>
                </View>
              </View>
            </GlassCard>

            {/* Payment Confirmation */}
            <GlassCard style={styles.confirmationCard} padding={24} borderRadius={16}>
              <Text style={styles.sectionTitle}>Payment Summary</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Merchant</Text>
                <Text style={styles.detailValue}>{merchant.name}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Amount</Text>
                <Text style={styles.detailValue}>
                  {currency} {voucher.amount.toFixed(2)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.totalLabel}>Total Payment</Text>
                <Text style={styles.totalValue}>
                  {currency} {voucher.amount.toFixed(2)}
                </Text>
              </View>
            </GlassCard>

            {/* Info Card */}
            <GlassCard style={styles.infoCard} padding={16} borderRadius={16}>
              <View style={styles.infoContent}>
                <FontAwesome name="info-circle" size={20} color={Colors.info} />
                <Text style={styles.infoText}>
                  The payment will be processed immediately. Make sure you're at the merchant location before confirming.
                </Text>
              </View>
            </GlassCard>

            {/* Confirm Button */}
            <PillButton onPress={handleConfirm} style={styles.confirmButton}>
              <Text style={styles.confirmButtonText}>Confirm Payment</Text>
            </PillButton>
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
          amount={voucher.amount}
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
  amountCard: {
    marginBottom: SECTION_SPACING,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanButtonIcon: {
    marginRight: 8,
  },
  scanButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.white,
  },
  merchantCard: {
    marginBottom: SECTION_SPACING,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 20,
  },
  merchantInfo: {
    marginTop: 8,
  },
  merchantHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  merchantLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  merchantLocationText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  confirmationCard: {
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
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.white,
  },
});
