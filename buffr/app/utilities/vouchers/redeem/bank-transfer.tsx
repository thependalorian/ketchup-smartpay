/**
 * Bank Transfer Redemption Flow Screen
 * 
 * Location: app/utilities/vouchers/redeem/bank-transfer.tsx
 * Purpose: Redeem voucher by transferring to linked bank account
 * 
 * Flow:
 * 1. Bank account selection
 * 2. Confirmation (amount, bank details)
 * 3. 2FA verification (PSD-12 compliance)
 * 4. Processing
 * 5. Success screen
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
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';
import { apiGet } from '@/utils/apiClient';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  accountHolderName: string;
  isVerified: boolean;
}

export default function BankTransferRedemptionScreen() {
  const router = useRouter();
  const { voucherId } = useLocalSearchParams<{ voucherId: string }>();
  const { user } = useUser();
  const { vouchers, fetchVouchers, redeemVoucher } = useVouchers();

  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const currency = user?.currency || 'N$';

  useEffect(() => {
    if (voucherId) {
      fetchVoucherDetails();
      fetchBankAccounts();
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

  const fetchBankAccounts = async () => {
    try {
      setLoadingBanks(true);
      const response = await apiGet('/api/v1/bank-accounts');
      if (response.success && response.data) {
        const accounts = response.data.accounts || [];
        setBankAccounts(accounts);
        const verifiedAccount = accounts.find((acc: BankAccount) => acc.isVerified);
        if (verifiedAccount) {
          setSelectedBankId(verifiedAccount.id);
        } else if (accounts.length > 0) {
          setSelectedBankId(accounts[0].id);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch bank accounts:', error);
      Alert.alert('Error', 'Failed to load bank accounts. Please link a bank account first.');
      router.back();
    } finally {
      setLoadingBanks(false);
    }
  };

  const handleAddBank = () => {
    router.push('/add-bank');
  };

  const handleConfirm = () => {
    if (!voucher || !selectedBankId) {
      Alert.alert('Error', 'Please select a bank account');
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
    if (!voucher || !selectedBankId || !verificationToken) return;

    try {
      setProcessing(true);
      await redeemVoucher(voucher.id, 'bank_transfer', {
        bankAccountId: selectedBankId,
        verificationToken,
      });

      router.push({
        pathname: '/utilities/vouchers/redeem/success',
        params: {
          voucherId: voucher.id,
          amount: voucher.amount.toString(),
          method: 'bank_transfer',
          bankId: selectedBankId,
        },
      });
    } catch (error: any) {
      Alert.alert('Redemption Failed', error.message || 'Failed to redeem voucher');
      setProcessing(false);
    }
  };

  if (loading || processing) {
    return (
      <StandardScreenLayout title="Bank Transfer">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {processing ? 'Processing transfer...' : 'Loading...'}
          </Text>
        </View>
      </StandardScreenLayout>
    );
  }

  if (!voucher) {
    return (
      <StandardScreenLayout title="Bank Transfer">
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Voucher not found</Text>
        </View>
      </StandardScreenLayout>
    );
  }

  const selectedBank = bankAccounts.find((acc) => acc.id === selectedBankId);

  return (
    <StandardScreenLayout title="Bank Transfer">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Confirmation Card */}
        <GlassCard style={styles.confirmationCard} padding={24} borderRadius={16}>
          <Text style={styles.sectionTitle}>Transfer Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transfer Amount</Text>
            <Text style={styles.detailValue}>
              {currency} {voucher.amount.toFixed(2)}
            </Text>
          </View>

          {selectedBank && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Bank</Text>
                <Text style={styles.detailValue}>{selectedBank.bankName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Account Number</Text>
                <Text style={styles.detailValue}>
                  ****{selectedBank.accountNumber.slice(-4)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Account Holder</Text>
                <Text style={styles.detailValue}>{selectedBank.accountHolderName}</Text>
              </View>
            </>
          )}

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.totalLabel}>Total Transfer</Text>
            <Text style={styles.totalValue}>
              {currency} {voucher.amount.toFixed(2)}
            </Text>
          </View>
        </GlassCard>

        {/* Bank Account Selection */}
        {loadingBanks ? (
          <View style={styles.loadingBanks}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingBanksText}>Loading bank accounts...</Text>
          </View>
        ) : bankAccounts.length > 0 ? (
          <GlassCard style={styles.banksCard} padding={16} borderRadius={16}>
            <Text style={styles.sectionTitle}>Select Bank Account</Text>
            {bankAccounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                style={[
                  styles.bankOption,
                  selectedBankId === account.id && styles.bankOptionSelected,
                ]}
                onPress={() => setSelectedBankId(account.id)}
              >
                <View style={styles.bankInfo}>
                  <View style={styles.bankHeader}>
                    <FontAwesome name="bank" size={20} color={Colors.primary} />
                    <Text style={styles.bankName}>{account.bankName}</Text>
                    {account.isVerified && (
                      <View style={styles.verifiedBadge}>
                        <FontAwesome name="check-circle" size={12} color={Colors.success} />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.accountNumber}>
                    {account.accountType} • ****{account.accountNumber.slice(-4)}
                  </Text>
                  <Text style={styles.accountHolder}>{account.accountHolderName}</Text>
                </View>
                {selectedBankId === account.id && (
                  <FontAwesome name="check-circle" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </GlassCard>
        ) : (
          <GlassCard style={styles.emptyCard} padding={24} borderRadius={16}>
            <FontAwesome name="bank" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Bank Accounts</Text>
            <Text style={styles.emptyText}>
              Link a bank account to transfer voucher funds
            </Text>
            <PillButton onPress={handleAddBank} style={styles.addBankButton}>
              <Text style={styles.addBankButtonText}>Link Bank Account</Text>
            </PillButton>
          </GlassCard>
        )}

        {/* Info Card */}
        {selectedBank && (
          <GlassCard style={styles.infoCard} padding={16} borderRadius={16}>
            <View style={styles.infoContent}>
              <FontAwesome name="info-circle" size={20} color={Colors.info} />
              <Text style={styles.infoText}>
                The transfer will be processed within 1-3 business days. 
                You will receive a notification once the transfer is completed.
              </Text>
            </View>
          </GlassCard>
        )}

        {/* Confirm Button */}
        {selectedBank && (
          <PillButton onPress={handleConfirm} style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>Confirm Transfer</Text>
          </PillButton>
        )}
      </ScrollView>

      {/* 2FA Verification Modal */}
      {voucher && selectedBank && (
        <TwoFactorVerification
          visible={show2FA}
          onVerify={handle2FAComplete}
          onCancel={() => {
            setShow2FA(false);
            setVerificationToken(null);
          }}
          amount={voucher.amount}
          recipientName={`${selectedBank.bankName} Account`}
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
  loadingBanks: {
    alignItems: 'center',
    padding: 40,
    marginBottom: SECTION_SPACING,
  },
  loadingBanksText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  banksCard: {
    marginBottom: SECTION_SPACING,
  },
  bankOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  bankOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  bankInfo: {
    flex: 1,
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.success,
    marginLeft: 4,
  },
  accountNumber: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  accountHolder: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  emptyCard: {
    alignItems: 'center',
    marginBottom: SECTION_SPACING,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    marginBottom: SECTION_SPACING,
  },
  addBankButton: {
    minWidth: 200,
  },
  addBankButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
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
