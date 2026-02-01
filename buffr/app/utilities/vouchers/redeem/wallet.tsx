/**
 * Wallet Redemption Flow Screen
 * 
 * Location: app/utilities/vouchers/redeem/wallet.tsx
 * Purpose: Redeem voucher by crediting to Buffr wallet
 * 
 * Flow:
 * 1. Confirmation screen (amount, wallet selection)
 * 2. 2FA verification (PSD-12 compliance)
 * 3. Processing
 * 4. Success screen
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
import { StandardScreenLayout } from '@/components/layouts';
import { GlassCard, PillButton } from '@/components/common';
import TwoFactorVerification from '@/components/compliance/TwoFactorVerification';
import { useVouchers, Voucher } from '@/contexts/VouchersContext';
import { useUser } from '@/contexts/UserContext';
import { useWallets } from '@/contexts/WalletsContext';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';

export default function WalletRedemptionScreen() {
  const router = useRouter();
  const { voucherId } = useLocalSearchParams<{ voucherId: string }>();
  const { user } = useUser();
  const { wallets, getDefaultWallet } = useWallets();
  const { vouchers, fetchVouchers, redeemVoucher } = useVouchers();

  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [show2FA, setShow2FA] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const currency = user?.currency || 'N$';

  useEffect(() => {
    if (voucherId) {
      fetchVoucherDetails();
    }
    const defaultWallet = getDefaultWallet();
    if (defaultWallet) {
      setSelectedWalletId(defaultWallet.id);
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
    if (!voucher || !selectedWalletId) {
      Alert.alert('Error', 'Please select a wallet');
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
    if (!voucher || !selectedWalletId || !verificationToken) return;

    try {
      setProcessing(true);
      await redeemVoucher(voucher.id, 'wallet', {
        walletId: selectedWalletId,
        verificationToken,
      });

      router.push({
        pathname: '/utilities/vouchers/redeem/success',
        params: {
          voucherId: voucher.id,
          amount: voucher.amount.toString(),
          method: 'wallet',
        },
      });
    } catch (error: any) {
      Alert.alert('Redemption Failed', error.message || 'Failed to redeem voucher');
      setProcessing(false);
    }
  };

  if (loading || processing) {
    return (
      <StandardScreenLayout title="Redeem to Wallet">
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
      <StandardScreenLayout title="Redeem to Wallet">
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Voucher not found</Text>
        </View>
      </StandardScreenLayout>
    );
  }

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);

  return (
    <StandardScreenLayout title="Redeem to Wallet">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Confirmation Card */}
        <GlassCard style={styles.confirmationCard} padding={24} borderRadius={16}>
          <Text style={styles.sectionTitle}>Redemption Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Voucher Amount</Text>
            <Text style={styles.detailValue}>
              {currency} {voucher.amount.toFixed(2)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Destination Wallet</Text>
            <Text style={styles.detailValue}>
              {selectedWallet?.name || 'Default Wallet'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.totalLabel}>Total Credit</Text>
            <Text style={styles.totalValue}>
              {currency} {voucher.amount.toFixed(2)}
            </Text>
          </View>
        </GlassCard>

        {/* Wallet Selection */}
        {wallets.length > 1 && (
          <GlassCard style={styles.walletCard} padding={16} borderRadius={16}>
            <Text style={styles.sectionTitle}>Select Wallet</Text>
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
                  <Text style={styles.walletName}>{wallet.name}</Text>
                </View>
                {selectedWalletId === wallet.id && (
                  <FontAwesome name="check-circle" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </GlassCard>
        )}

        {/* Info Card */}
        <GlassCard style={styles.infoCard} padding={16} borderRadius={16}>
          <View style={styles.infoContent}>
            <FontAwesome name="info-circle" size={20} color={Colors.info} />
            <Text style={styles.infoText}>
              The voucher amount will be instantly credited to your selected wallet.
              This action requires 2FA verification for security.
            </Text>
          </View>
        </GlassCard>

        {/* Confirm Button */}
        <PillButton
          onPress={handleConfirm}
          style={styles.confirmButton}
          disabled={!selectedWalletId}
        >
          <Text style={styles.confirmButtonText}>Confirm Redemption</Text>
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
          recipientName={selectedWallet?.name || 'Buffr Wallet'}
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
  confirmationCard: {
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
  walletName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginLeft: 12,
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
