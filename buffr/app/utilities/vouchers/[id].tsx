/**
 * Voucher Detail Screen
 * 
 * Location: app/utilities/vouchers/[id].tsx
 * Purpose: Display detailed voucher information and redemption options
 * 
 * Features:
 * - Voucher details (amount, expiry, issuer, description)
 * - QR code display for redemption
 * - Redemption method selection
 * - Status badge and expiry warning
 * - Redemption history
 * 
 * Based on: Buffr App Design wireframes + Apple HIG
 * Design System: Uses exact values from wireframes (16.5pt padding, 11.5pt borderRadius)
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
import { GlassCard, StatusBadge, PillButton, EmptyState } from '@/components/common';
import TwoFactorVerification from '@/components/compliance/TwoFactorVerification';
import { useVouchers, Voucher } from '@/contexts/VouchersContext';
import { useUser } from '@/contexts/UserContext';
import { useWallets } from '@/contexts/WalletsContext';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';
import { defaultStyles } from '@/constants/Styles';

export default function VoucherDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const { getDefaultWallet } = useWallets();
  const { vouchers, fetchVouchers, redeemVoucher } = useVouchers();
  
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [show2FA, setShow2FA] = useState(false);
  const [selectedRedemptionMethod, setSelectedRedemptionMethod] = useState<'wallet' | 'cash_out' | 'bank_transfer' | 'merchant_payment' | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [pendingRedemption, setPendingRedemption] = useState<{ method: string; redeemAsCash: boolean } | null>(null);

  const currency = user?.currency || 'N$';

  useEffect(() => {
    if (id) {
      fetchVoucherDetails();
    }
  }, [id]);

  const fetchVoucherDetails = async () => {
    try {
      setLoading(true);
      await fetchVouchers();
      const foundVoucher = vouchers.find((v) => v.id === id);
      setVoucher(foundVoucher || null);
    } catch (error) {
      Alert.alert('Error', 'Failed to load voucher details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleRedemptionMethodSelect = (method: 'wallet' | 'cash_out' | 'bank_transfer' | 'merchant_payment') => {
    if (!voucher || voucher.status !== 'available') {
      Alert.alert('Error', 'This voucher is not available for redemption');
      return;
    }

    setSelectedRedemptionMethod(method);
    setPendingRedemption({
      method,
      redeemAsCash: method === 'cash_out',
    });
    setShow2FA(true);
  };

  const handle2FAComplete = async (method: 'pin' | 'biometric', code?: string) => {
    // 2FA verification logic here
    // For now, simulate verification
    setVerificationToken('verified_token');
    setShow2FA(false);
    
    if (pendingRedemption && voucher) {
      await processRedemption(pendingRedemption.method, pendingRedemption.redeemAsCash);
    }
  };

  const processRedemption = async (redemptionMethod: string, redeemAsCash: boolean) => {
    if (!voucher || !verificationToken) return;

    try {
      const redemptionPoint = redeemAsCash ? 'nampost_branch' : undefined;
      
      await redeemVoucher(voucher.id, redemptionMethod as any, {
        redemptionPoint,
        walletId: getDefaultWallet()?.id,
        verificationToken,
      });

      Alert.alert(
        'Voucher Redeemed',
        redeemAsCash
          ? `Cash payout of ${currency}${voucher.amount} has been processed.`
          : `${currency}${voucher.amount} has been credited to your Buffr account.`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Redemption Failed', error.message || 'Failed to redeem voucher');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getVoucherIcon = (type: string) => {
    switch (type) {
      case 'government':
        return 'building';
      case 'electricity':
        return 'bolt';
      case 'water':
        return 'tint';
      default:
        return 'gift';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return Colors.success;
      case 'redeemed':
        return Colors.primary;
      case 'expired':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <StandardScreenLayout title="Voucher Details">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </StandardScreenLayout>
    );
  }

  if (!voucher) {
    return (
      <StandardScreenLayout title="Voucher Details">
        <EmptyState
          icon="ticket"
          title="Voucher Not Found"
          message="The voucher you're looking for doesn't exist or has been removed."
        />
      </StandardScreenLayout>
    );
  }

  const isExpired = voucher.expiryDate && new Date(voucher.expiryDate) < new Date();
  const isAvailable = voucher.status === 'available' && !isExpired;

  return (
    <StandardScreenLayout title="Voucher Details">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Voucher Header Card */}
        <GlassCard style={styles.headerCard} padding={24} borderRadius={16}>
          <View style={styles.headerContent}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: getStatusColor(voucher.status) + '20' },
              ]}
            >
              <FontAwesome
                name={getVoucherIcon(voucher.type) as any}
                size={32}
                color={getStatusColor(voucher.status)}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.voucherTitle}>{voucher.title}</Text>
              {voucher.issuer && (
                <Text style={styles.voucherIssuer}>{voucher.issuer}</Text>
              )}
            </View>
            <StatusBadge
              status={
                voucher.status === 'available'
                  ? 'success'
                  : voucher.status === 'redeemed'
                  ? 'completed'
                  : 'error'
              }
            />
          </View>

          {/* Amount Display */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Voucher Value</Text>
            <Text style={styles.amountValue}>
              {currency} {voucher.amount.toFixed(2)}
            </Text>
          </View>
        </GlassCard>

        {/* Voucher Details */}
        <GlassCard style={styles.detailsCard} padding={16} borderRadius={16}>
          <Text style={styles.sectionTitle}>Voucher Information</Text>
          
          {voucher.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{voucher.description}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>
              {voucher.type.charAt(0).toUpperCase() + voucher.type.slice(1)}
            </Text>
          </View>

          {voucher.expiryDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expiry Date</Text>
              <Text
                style={[
                  styles.detailValue,
                  isExpired && { color: Colors.error },
                ]}
              >
                {formatDate(voucher.expiryDate)}
                {isExpired && ' (Expired)'}
              </Text>
            </View>
          )}

          {voucher.redeemedAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Redeemed On</Text>
              <Text style={styles.detailValue}>
                {formatDate(voucher.redeemedAt)}
              </Text>
            </View>
          )}

          {voucher.voucherCode && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Voucher Code</Text>
              <Text style={[styles.detailValue, styles.codeText]}>
                {voucher.voucherCode}
              </Text>
            </View>
          )}
        </GlassCard>

        {/* QR Code Display (if available) */}
        {isAvailable && (voucher.namqrCode || voucher.voucherCode) && (
          <GlassCard style={styles.qrCard} padding={24} borderRadius={16}>
            <Text style={styles.sectionTitle}>Redemption QR Code</Text>
            <View style={styles.qrContainer}>
              <QRCode
                value={voucher.namqrCode || voucher.voucherCode || ''}
                size={200}
                backgroundColor={Colors.white}
                color={Colors.text}
              />
            </View>
            <Text style={styles.qrHint}>
              Show this QR code at redemption point or scan for merchant payment
            </Text>
          </GlassCard>
        )}

        {/* Redemption Methods (if available) */}
        {isAvailable && (
          <View style={styles.redemptionSection}>
            <Text style={styles.sectionTitle}>Redeem Voucher</Text>
            <Text style={styles.sectionSubtitle}>
              Choose how you want to redeem this voucher
            </Text>

            {/* Wallet Redemption */}
            <TouchableOpacity
              onPress={() => handleRedemptionMethodSelect('wallet')}
              activeOpacity={0.7}
            >
              <GlassCard style={styles.redemptionMethod} padding={16} borderRadius={16}>
                <View style={styles.methodContent}>
                  <View style={styles.methodIcon}>
                    <FontAwesome name="wallet" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.methodText}>
                    <Text style={styles.methodTitle}>Credit to Buffr Wallet</Text>
                    <Text style={styles.methodDescription}>
                      Instant credit to your default wallet
                    </Text>
                  </View>
                  <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
                </View>
              </GlassCard>
            </TouchableOpacity>

            {/* NamPost Cash-Out */}
            <TouchableOpacity
              onPress={() => handleRedemptionMethodSelect('cash_out')}
              activeOpacity={0.7}
            >
              <GlassCard style={styles.redemptionMethod} padding={16} borderRadius={16}>
                <View style={styles.methodContent}>
                  <View style={styles.methodIcon}>
                    <FontAwesome name="money" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.methodText}>
                    <Text style={styles.methodTitle}>NamPost Cash-Out</Text>
                    <Text style={styles.methodDescription}>
                      Collect cash at any NamPost branch
                    </Text>
                  </View>
                  <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
                </View>
              </GlassCard>
            </TouchableOpacity>

            {/* Bank Transfer */}
            <TouchableOpacity
              onPress={() => handleRedemptionMethodSelect('bank_transfer')}
              activeOpacity={0.7}
            >
              <GlassCard style={styles.redemptionMethod} padding={16} borderRadius={16}>
                <View style={styles.methodContent}>
                  <View style={styles.methodIcon}>
                    <FontAwesome name="bank" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.methodText}>
                    <Text style={styles.methodTitle}>Bank Transfer</Text>
                    <Text style={styles.methodDescription}>
                      Transfer to your linked bank account
                    </Text>
                  </View>
                  <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
                </View>
              </GlassCard>
            </TouchableOpacity>

            {/* Merchant Payment */}
            <TouchableOpacity
              onPress={() => handleRedemptionMethodSelect('merchant_payment')}
              activeOpacity={0.7}
            >
              <GlassCard style={styles.redemptionMethod} padding={16} borderRadius={16}>
                <View style={styles.methodContent}>
                  <View style={styles.methodIcon}>
                    <FontAwesome name="shopping-cart" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.methodText}>
                    <Text style={styles.methodTitle}>Merchant Payment</Text>
                    <Text style={styles.methodDescription}>
                      Use voucher for payment at participating merchants
                    </Text>
                  </View>
                  <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
                </View>
              </GlassCard>
            </TouchableOpacity>

            {/* Cashback at Till */}
            <TouchableOpacity
              onPress={() => router.push(`/utilities/vouchers/redeem/cashback-till?voucherId=${voucher.id}`)}
              activeOpacity={0.7}
            >
              <GlassCard style={styles.redemptionMethod} padding={16} borderRadius={16}>
                <View style={styles.methodContent}>
                  <View style={styles.methodIcon}>
                    <FontAwesome name="gift" size={24} color={Colors.success} />
                  </View>
                  <View style={styles.methodText}>
                    <Text style={styles.methodTitle}>Cashback at Till</Text>
                    <Text style={styles.methodDescription}>
                      Pay at merchant POS and earn 1-3% cashback (merchant-funded)
                    </Text>
                  </View>
                  <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
                </View>
              </GlassCard>
            </TouchableOpacity>
          </View>
        )}

        {/* Expired/Unavailable Message */}
        {!isAvailable && (
          <GlassCard style={styles.warningCard} padding={16} borderRadius={16}>
            <View style={styles.warningContent}>
              <FontAwesome
                name="exclamation-triangle"
                size={24}
                color={Colors.error}
              />
              <Text style={styles.warningText}>
                {isExpired
                  ? 'This voucher has expired and cannot be redeemed.'
                  : 'This voucher is not available for redemption.'}
              </Text>
            </View>
          </GlassCard>
        )}
      </ScrollView>

      {/* 2FA Verification Modal */}
      {pendingRedemption && voucher && (
        <TwoFactorVerification
          visible={show2FA}
          onVerify={handle2FAComplete}
          onCancel={() => {
            setShow2FA(false);
            setPendingRedemption(null);
            setVerificationToken(null);
          }}
          amount={voucher.amount}
          recipientName={
            pendingRedemption.method === 'wallet'
              ? 'Buffr Wallet'
              : pendingRedemption.method === 'cash_out'
              ? 'NamPost Cash-Out'
              : pendingRedemption.method === 'bank_transfer'
              ? 'Bank Transfer'
              : 'Merchant Payment'
          }
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
  headerCard: {
    marginBottom: SECTION_SPACING,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  voucherTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  voucherIssuer: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  amountSection: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
  },
  detailsCard: {
    marginBottom: SECTION_SPACING,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    flex: 2,
    textAlign: 'right',
  },
  codeText: {
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  qrCard: {
    marginBottom: SECTION_SPACING,
    alignItems: 'center',
  },
  qrContainer: {
    padding: HORIZONTAL_PADDING,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginVertical: HORIZONTAL_PADDING,
  },
  qrHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  redemptionSection: {
    marginBottom: SECTION_SPACING,
  },
  redemptionMethod: {
    marginBottom: 12, // Consistent spacing between redemption methods
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodText: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  warningCard: {
    marginBottom: SECTION_SPACING,
    backgroundColor: Colors.error + '10',
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: Colors.error,
    marginLeft: 12,
  },
});
