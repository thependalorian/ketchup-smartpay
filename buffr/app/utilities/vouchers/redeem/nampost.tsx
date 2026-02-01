/**
 * NamPost Cash-Out Redemption Flow Screen
 * 
 * Location: app/utilities/vouchers/redeem/nampost.tsx
 * Purpose: Redeem voucher for cash at NamPost branch
 * 
 * Flow:
 * 1. QR code display for branch scanning
 * 2. Instructions for cash collection
 * 3. 2FA verification (PSD-12 compliance)
 * 4. Processing
 * 5. Success with receipt
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
import TwoFactorVerification from '@/components/compliance/TwoFactorVerification';
import { useVouchers, Voucher } from '@/contexts/VouchersContext';
import { useUser } from '@/contexts/UserContext';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';

export default function NamPostCashOutScreen() {
  const router = useRouter();
  const { voucherId } = useLocalSearchParams<{ voucherId: string }>();
  const { user } = useUser();
  const { vouchers, fetchVouchers, redeemVoucher } = useVouchers();

  const [voucher, setVoucher] = useState<Voucher | null>(null);
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

  const handleConfirm = () => {
    if (!voucher) return;
    setShow2FA(true);
  };

  const handle2FAComplete = async (method: 'pin' | 'biometric', code?: string) => {
    setVerificationToken('verified_token');
    setShow2FA(false);
    await processRedemption();
  };

  const processRedemption = async () => {
    if (!voucher || !verificationToken) return;

    try {
      setProcessing(true);
      await redeemVoucher(voucher.id, 'cash_out', {
        redemptionPoint: 'nampost_branch',
        verificationToken,
      });

      router.push({
        pathname: '/utilities/vouchers/redeem/success',
        params: {
          voucherId: voucher.id,
          amount: voucher.amount.toString(),
          method: 'nampost',
        },
      });
    } catch (error: any) {
      Alert.alert('Redemption Failed', error.message || 'Failed to redeem voucher');
      setProcessing(false);
    }
  };

  if (loading || processing) {
    return (
      <StandardScreenLayout title="NamPost Cash-Out">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {processing ? 'Processing redemption...' : 'Loading...'}
          </Text>
        </View>
      </StandardScreenLayout>
    );
  }

  if (!voucher) {
    return (
      <StandardScreenLayout title="NamPost Cash-Out">
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Voucher not found</Text>
        </View>
      </StandardScreenLayout>
    );
  }

  const qrValue = voucher.namqrCode || voucher.voucherCode || voucher.id;

  return (
    <StandardScreenLayout title="NamPost Cash-Out">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Amount Display */}
        <GlassCard style={styles.amountCard} padding={24} borderRadius={16}>
          <Text style={styles.amountLabel}>Cash Amount</Text>
          <Text style={styles.amountValue}>
            {currency} {voucher.amount.toFixed(2)}
          </Text>
        </GlassCard>

        {/* QR Code Display */}
        <GlassCard style={styles.qrCard} padding={24} borderRadius={16}>
          <Text style={styles.sectionTitle}>Show QR Code at NamPost</Text>
          <View style={styles.qrContainer}>
            <QRCode
              value={qrValue}
              size={250}
              backgroundColor={Colors.white}
              color={Colors.text}
            />
          </View>
          <Text style={styles.qrHint}>
            Present this QR code at any NamPost branch to collect your cash
          </Text>
        </GlassCard>

        {/* Instructions */}
        <GlassCard style={styles.instructionsCard} padding={16} borderRadius={16}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>1</Text>
            </View>
            <Text style={styles.instructionText}>
              Visit any NamPost branch with valid ID
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>2</Text>
            </View>
            <Text style={styles.instructionText}>
              Show the QR code to the cashier
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              Collect your cash and receipt
            </Text>
          </View>
        </GlassCard>

        {/* Info Card */}
        <GlassCard style={styles.infoCard} padding={16} borderRadius={16}>
          <View style={styles.infoContent}>
            <FontAwesome name="info-circle" size={20} color={Colors.info} />
            <Text style={styles.infoText}>
              You must collect the cash within 30 days. After confirmation, 
              the QR code will be valid for cash collection at any NamPost branch.
            </Text>
          </View>
        </GlassCard>

        {/* Confirm Button */}
        <PillButton onPress={handleConfirm} style={styles.confirmButton}>
          <Text style={styles.confirmButtonText}>Confirm Cash-Out</Text>
        </PillButton>
      </ScrollView>

      {/* 2FA Verification Modal */}
      {voucher && (
        <TwoFactorVerification
          visible={show2FA}
          onVerify={handle2FAComplete}
          onCancel={() => {
            setShow2FA(false);
            setVerificationToken(null);
          }}
          amount={voucher.amount}
          recipientName="NamPost Cash-Out"
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
  qrCard: {
    marginBottom: SECTION_SPACING,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  qrContainer: {
    padding: 24,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginVertical: 20,
  },
  qrHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  instructionsCard: {
    marginBottom: SECTION_SPACING,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  instructionNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
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
