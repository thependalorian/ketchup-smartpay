/**
 * Fees & Charges Screen
 * 
 * Location: app/profile/fees.tsx
 * Purpose: Display all fees and charges transparently (PSD-3 Section 14.3)
 * 
 * Regulatory Requirement: PSD-3 Section 14.3 - All fees must be transparently displayed
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ScreenHeader, SectionHeader } from '@/components/common';
import Colors from '@/constants/Colors';
import defaultStyles from '@/constants/Styles';
import Layout from '@/constants/Layout';

const FEE_CATEGORIES = [
  {
    title: 'Transaction Fees',
    fees: [
      { service: 'Send Money', fee: 'Free', description: 'No fee for sending money to other Buffr users' },
      { service: 'Receive Money', fee: 'Free', description: 'No fee for receiving money' },
      { service: 'QR Code Payment', fee: 'Free', description: 'No fee for QR code payments' },
    ],
  },
  {
    title: 'Account Fees',
    fees: [
      { service: 'Account Opening', fee: 'Free', description: 'No fee to open a Buffr account' },
      { service: 'Account Maintenance', fee: 'Free', description: 'No monthly maintenance fee' },
      { service: 'Balance Inquiry', fee: 'Free', description: 'No fee for checking balance' },
    ],
  },
  {
    title: 'Withdrawal Fees',
    fees: [
      { service: 'ATM Withdrawal', fee: 'N$ 5.00', description: 'Per withdrawal transaction' },
      { service: 'Bank Transfer', fee: 'N$ 2.50', description: 'Per transfer to external bank account' },
    ],
  },
  {
    title: 'Deposit Fees',
    fees: [
      { service: 'Bank Deposit', fee: 'Free', description: 'No fee for bank deposits' },
      { service: 'Card Deposit', fee: 'Free', description: 'No fee for card deposits' },
    ],
  },
  {
    title: 'Other Fees',
    fees: [
      { service: 'Statement Request', fee: 'Free', description: 'No fee for account statements' },
      { service: 'Account Closure', fee: 'Free', description: 'No fee for closing account' },
    ],
  },
];

export default function FeesScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader title="Fees & Charges" onBack={handleBack} showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Regulatory Notice */}
        <View style={styles.noticeBanner}>
          <FontAwesome name="info-circle" size={20} color={Colors.primary} />
          <Text style={styles.noticeText}>
            All fees are displayed transparently as required by Bank of Namibia regulations (PSD-3 Section 14.3). 
            You will pay exactly the price displayed.
          </Text>
        </View>

        {/* Fee Categories */}
        {FEE_CATEGORIES.map((category, categoryIndex) => (
          <View key={category.title} style={styles.section}>
            <SectionHeader title={category.title} />
            <View style={styles.feesCard}>
              {category.fees.map((fee, feeIndex) => (
                <View key={fee.service}>
                  <View style={styles.feeItem}>
                    <View style={styles.feeInfo}>
                      <Text style={styles.feeService}>{fee.service}</Text>
                      <Text style={styles.feeDescription}>{fee.description}</Text>
                    </View>
                    <Text style={styles.feeAmount}>{fee.fee}</Text>
                  </View>
                  {feeIndex < category.fees.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Important Notes */}
        <View style={styles.section}>
          <SectionHeader title="Important Notes" />
          <View style={styles.notesCard}>
            <View style={styles.noteItem}>
              <FontAwesome name="check-circle" size={16} color={Colors.success} />
              <Text style={styles.noteText}>
                All fees are displayed before you complete a transaction
              </Text>
            </View>
            <View style={styles.noteItem}>
              <FontAwesome name="check-circle" size={16} color={Colors.success} />
              <Text style={styles.noteText}>
                Fees are not bundled or hidden - you see exactly what you pay
              </Text>
            </View>
            <View style={styles.noteItem}>
              <FontAwesome name="check-circle" size={16} color={Colors.success} />
              <Text style={styles.noteText}>
                Fees may be updated with 30 days notice as per regulatory requirements
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primaryMuted,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: Layout.HORIZONTAL_PADDING,
    marginTop: 16,
    marginBottom: Layout.SECTION_SPACING,
    gap: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  section: {
    marginBottom: Layout.LARGE_SECTION_SPACING,
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
  },
  feesCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  feeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  feeInfo: {
    flex: 1,
    paddingRight: 16,
  },
  feeService: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  feeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  notesCard: {
    backgroundColor: Colors.backgroundGray,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});
