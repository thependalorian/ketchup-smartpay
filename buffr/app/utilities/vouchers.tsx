/**
 * Vouchers Screen
 * 
 * Location: app/utilities/vouchers.tsx
 * Purpose: Government voucher disbursements and prepaid utility vouchers
 * 
 * Features:
 * - View available government vouchers
 * - Redeem vouchers for cash or credit to Buffr account
 * - Prepaid utility vouchers (electricity, water)
 * - Voucher history
 * - Voucher status tracking
 * 
 * Namibia-Specific:
 * - Government voucher disbursement system integration
 * - Prepaid electricity vouchers (NamPower, City of Windhoek, REDs)
 * - Prepaid water vouchers (NamWater, City of Windhoek)
 * - E-governance vouchers (permits, licenses)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import QRCode from 'react-native-qrcode-svg';
import { GlassCard, GlassSection, PillButton, EmptyState, InfoCard } from '@/components/common';
import { StandardScreenLayout } from '@/components/layouts';
import VoucherList from '@/components/vouchers/VoucherList';
import TwoFactorVerification from '@/components/compliance/TwoFactorVerification';
import QRCodeDisplay from '@/components/qr/QRCodeDisplay';
import QRCodeScanner from '@/components/qr/QRCodeScanner';
import { useUser } from '@/contexts/UserContext';
import { useWallets } from '@/contexts/WalletsContext';
import { useVouchers, VoucherType, Voucher } from '@/contexts/VouchersContext';
import Colors from '@/constants/Colors';
import { SECTION_SPACING, HORIZONTAL_PADDING } from '@/constants/Layout';
import { apiPost } from '@/utils/apiClient';
import { log } from '@/utils/logger';

export default function VouchersScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { getDefaultWallet } = useWallets();
  const {
    availableVouchers: contextAvailableVouchers,
    loading,
    fetchVouchers,
    refreshVouchers,
    getVouchersByType,
    redeemVoucher,
  } = useVouchers();
  const currency = user?.currency || 'N$';

  const [selectedType, setSelectedType] = useState<VoucherType | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [pendingRedemption, setPendingRedemption] = useState<{ voucher: Voucher; redeemAsCash: boolean } | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isProcessingQR, setIsProcessingQR] = useState(false);

  const VOUCHER_TYPES = [
    { id: 'government', name: 'Government', icon: 'building' },
    { id: 'electricity', name: 'Electricity', icon: 'bolt' },
    { id: 'water', name: 'Water', icon: 'tint' },
    { id: 'other', name: 'Other', icon: 'gift' },
  ];

  // Fetch vouchers on mount
  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshVouchers();
    setRefreshing(false);
  };

  // Filter vouchers by selected type
  const filteredVouchers = selectedType
    ? getVouchersByType(selectedType).filter((v) => v.status === 'available')
    : contextAvailableVouchers;

  // Handle voucher redemption
  /**
   * Handle voucher redemption with 2FA (PSD-12 Compliance)
   * Step 1: Show confirmation alert
   * Step 2: Show 2FA modal (MANDATORY)
   * Step 3: Process redemption with verification token
   */
  const handleRedeem = (voucher: Voucher, redeemAsCash: boolean) => {
    Alert.alert(
      'Redeem Voucher',
      redeemAsCash
        ? `Redeem this voucher for cash payout of ${currency}${voucher.amount}?`
        : `Credit ${currency}${voucher.amount} to your Buffr account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            // Store pending redemption and show 2FA modal
            setPendingRedemption({ voucher, redeemAsCash });
            setShow2FA(true);
          },
        },
      ]
    );
  };

  /**
   * Verify 2FA (PIN or biometric) before processing redemption
   */
  const handle2FAVerify = async (method: 'pin' | 'biometric', code?: string): Promise<boolean> => {
    try {
      // Call 2FA verification endpoint
      const response = await apiPost('/auth/verify-2fa', {
        method,
        pin: method === 'pin' ? code : undefined,
        biometricToken: method === 'biometric' ? 'verified' : undefined,
        transactionContext: {
          type: 'voucher_redemption',
          amount: pendingRedemption?.voucher.amount,
        },
      });

      if (response.verified && response.verificationToken) {
        setVerificationToken(response.verificationToken);
        return true;
      }

      return false;
    } catch (error) {
      log.error('2FA verification error:', error);
      return false;
    }
  };

  /**
   * Process voucher redemption after successful 2FA verification
   */
  const processRedemption = async () => {
    if (!pendingRedemption || !verificationToken) {
      Alert.alert('Error', 'Missing redemption details or verification token');
      return;
    }

    try {
      const { voucher, redeemAsCash } = pendingRedemption;

      // Determine redemption method
      const redemptionMethod = redeemAsCash ? 'cash_out' : 'wallet';
      const redemptionPoint = redeemAsCash ? 'nampost_branch' : undefined;

      // Use context method for redemption (automatically refreshes vouchers)
      await redeemVoucher(voucher.id, redemptionMethod, {
        redemptionPoint,
        walletId: getDefaultWallet()?.id,
        verificationToken,
      });

      Alert.alert(
        'Voucher Redeemed',
        redeemAsCash
          ? `Cash payout of ${currency}${voucher.amount} has been processed.`
          : `${currency}${voucher.amount} has been credited to your Buffr account.`
      );

      // Reset state
      setPendingRedemption(null);
      setVerificationToken(null);
      setShow2FA(false);
    } catch (error: any) {
      Alert.alert('Redemption Failed', error.message || 'Failed to redeem voucher');
    }
  };

  /**
   * Handle 2FA verification completion
   */
  const handle2FAComplete = async (method: 'pin' | 'biometric', code?: string) => {
    const verified = await handle2FAVerify(method, code);
    
    if (verified) {
      setShow2FA(false);
      // Process redemption with verification token
      await processRedemption();
    } else {
      Alert.alert('Verification Failed', '2FA verification failed. Please try again.');
    }
  };

  /**
   * Handle 2FA cancellation
   */
  const handle2FACancel = () => {
    setShow2FA(false);
    setPendingRedemption(null);
    setVerificationToken(null);
  };

  /**
   * Handle QR code scanned from voucher
   */
  const handleQRCodeScanned = async (qrData: string) => {
    setIsProcessingQR(true);
    try {
      // Try to find voucher by QR code
      const { apiPost } = await import('@/utils/apiClient');
      const response = await apiPost('/utilities/vouchers/find-by-qr', {
        qrCode: qrData,
      });

      if (response.voucher) {
        // Navigate to voucher details or redeem
        Alert.alert(
          'Voucher Found',
          `Found voucher: ${response.voucher.title} (${currency}${response.voucher.amount})`,
          [
            { text: 'Cancel', onPress: () => setShowQRScanner(false) },
            {
              text: 'View',
              onPress: () => {
                setShowQRScanner(false);
                // Could navigate to voucher detail screen
                refreshVouchers();
              },
            },
          ]
        );
      } else {
        Alert.alert('Voucher Not Found', 'This QR code does not match any voucher.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process QR code');
    } finally {
      setIsProcessingQR(false);
    }
  };

  return (
    <StandardScreenLayout
      title="Vouchers"
      showBackButton
      onBack={() => router.back()}
      scrollContentStyle={styles.scrollContent}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Quick Actions */}
        <GlassSection title="Quick Actions" style={styles.section}>
          <View style={styles.quickActionsRow}>
            <PillButton
              label="Scan QR Code"
              variant="primary"
              onPress={() => setShowQRScanner(true)}
              style={styles.scanButton}
              icon="qrcode"
            />
            <PillButton
              label="View History"
              variant="outline"
              onPress={() => router.push('/utilities/vouchers/history')}
              style={styles.historyButton}
              icon="history"
            />
          </View>
        </GlassSection>

        {/* Type Filter */}
        <GlassSection title="Voucher Types" style={styles.section}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typeScroll}
          >
            {VOUCHER_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                onPress={() => setSelectedType(type.id as VoucherType)}
                activeOpacity={0.7}
              >
                <GlassCard
                  style={[
                    styles.typeCard,
                    selectedType === type.id && styles.typeCardSelected,
                  ]}
                  padding={12}
                  borderRadius={20}
                >
                  <View style={styles.typeCardContent}>
                    <FontAwesome
                      name={type.icon as any}
                      size={20}
                      color={selectedType === type.id ? Colors.primary : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.typeName,
                        selectedType === type.id && styles.typeNameSelected,
                      ]}
                    >
                      {type.name}
                    </Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </GlassSection>

        {/* Available Vouchers - Using VoucherList Component */}
        {filteredVouchers.length > 0 && (
          <VoucherList
            vouchers={filteredVouchers}
            onVoucherPress={(voucher) => {
              router.push(`/utilities/vouchers/${voucher.id}`);
            }}
            refreshing={refreshing}
            onRefresh={onRefresh}
            showFilters={false}
          />
        )}

        {/* Empty State */}
        {filteredVouchers.length === 0 && !loading && (
          <EmptyState
            icon="ticket"
            title="No Vouchers Available"
            message={
              selectedType
                ? `You don't have any ${VOUCHER_TYPES.find(t => t.id === selectedType)?.name.toLowerCase()} vouchers available.`
                : "You don't have any vouchers available at the moment."
            }
          />
        )}

        {/* Info Card */}
        <InfoCard
          icon="info-circle"
          title="Vouchers Info"
          description="Government vouchers can be redeemed for cash or credited to your Buffr account. Utility vouchers (electricity, water) are automatically applied to your meter."
          variant="info"
          style={styles.infoCard}
        />
      </ScrollView>

      {/* 2FA Verification Modal (PSD-12 Compliance) */}
      {pendingRedemption && (
        <TwoFactorVerification
          visible={show2FA}
          onVerify={handle2FAComplete}
          onCancel={handle2FACancel}
          amount={pendingRedemption.voucher.amount}
          recipientName={pendingRedemption.redeemAsCash ? 'Cash Payout' : 'Buffr Wallet'}
        />
      )}

      {/* QR Code Scanner Modal */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowQRScanner(false)}
      >
        <QRCodeScanner
          onQRCodeScanned={handleQRCodeScanned}
          onClose={() => setShowQRScanner(false)}
          title="Scan Voucher QR Code"
        />
      </Modal>
    </StandardScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: SECTION_SPACING,
  },
  typeScroll: {
    gap: 12,
    paddingRight: HORIZONTAL_PADDING,
  },
  typeCard: {
    // GlassCard handles padding and background
  },
  typeCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primary + '10',
  },
  typeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  typeNameSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  vouchersList: {
    gap: 16,
  },
  voucherCard: {
    marginBottom: 0,
  },
  voucherHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  voucherIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voucherInfo: {
    flex: 1,
    gap: 4,
  },
  voucherTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  voucherIssuer: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  voucherDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  voucherMeta: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  voucherAmount: {
    alignItems: 'flex-end',
  },
  voucherAmountText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  voucherCodeContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 8,
    gap: 4,
  },
  voucherCodeLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  voucherCode: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'monospace',
  },
  voucherActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  redeemButton: {
    flex: 1,
  },
  infoCard: {
    marginTop: SECTION_SPACING,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  scanButton: {
    flex: 1,
  },
  historyButton: {
    flex: 1,
  },
});
