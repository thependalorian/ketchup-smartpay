/**
 * Redemption Success Screen
 * 
 * Location: app/utilities/vouchers/redeem/success.tsx
 * Purpose: Display success confirmation after voucher redemption
 * 
 * Features:
 * - Success animation/icon
 * - Redemption details
 * - Receipt information
 * - Next actions (view transaction, go home)
 * 
 * Based on: Buffr App Design wireframes + Apple HIG
 * Design System: Uses exact values from wireframes
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StandardScreenLayout } from '@/components/layouts';
import { GlassCard, PillButton } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';

export default function RedemptionSuccessScreen() {
  const router = useRouter();
  const { voucherId, amount, method, agentName, merchantName, bankId } = useLocalSearchParams<{
    voucherId: string;
    amount: string;
    method: string;
    agentName?: string;
    merchantName?: string;
    bankId?: string;
  }>();
  const { user } = useUser();

  const currency = user?.currency || 'N$';

  const getMethodName = () => {
    switch (method) {
      case 'wallet':
        return 'Buffr Wallet';
      case 'nampost':
        return 'NamPost Cash-Out';
      case 'agent':
        return agentName ? `${agentName} (Agent)` : 'Agent Cash-Out';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'merchant':
        return merchantName || 'Merchant Payment';
      default:
        return 'Redemption';
    }
  };

  const getMethodIcon = () => {
    switch (method) {
      case 'wallet':
        return 'wallet';
      case 'nampost':
        return 'money';
      case 'agent':
        return 'user';
      case 'bank_transfer':
        return 'bank';
      case 'merchant':
        return 'shopping-cart';
      default:
        return 'check-circle';
    }
  };

  const getMethodDescription = () => {
    switch (method) {
      case 'wallet':
        return 'The amount has been credited to your Buffr wallet.';
      case 'nampost':
        return 'Visit any NamPost branch with your ID to collect cash.';
      case 'agent':
        return 'Visit the agent location to collect your cash.';
      case 'bank_transfer':
        return 'The transfer will be processed within 1-3 business days.';
      case 'merchant':
        return 'Payment has been processed successfully.';
      default:
        return 'Redemption completed successfully.';
    }
  };

  return (
    <StandardScreenLayout title="Redemption Successful" showBackButton={false}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <View style={styles.successIconCircle}>
            <FontAwesome name="check-circle" size={64} color={Colors.success} />
          </View>
        </View>

        {/* Success Message */}
        <Text style={styles.successTitle}>Redemption Successful!</Text>
        <Text style={styles.successMessage}>
          Your voucher has been redeemed successfully
        </Text>

        {/* Redemption Details Card */}
        <GlassCard style={styles.detailsCard} padding={24} borderRadius={16}>
          <Text style={styles.sectionTitle}>Redemption Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>
              {currency} {parseFloat(amount || '0').toFixed(2)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Method</Text>
            <View style={styles.methodInfo}>
              <FontAwesome
                name={getMethodIcon() as any}
                size={16}
                color={Colors.primary}
                style={styles.methodIcon}
              />
              <Text style={styles.detailValue}>{getMethodName()}</Text>
            </View>
          </View>

          {agentName && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Agent</Text>
              <Text style={styles.detailValue}>{agentName}</Text>
            </View>
          )}

          {merchantName && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Merchant</Text>
              <Text style={styles.detailValue}>{merchantName}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <Text style={styles.descriptionText}>{getMethodDescription()}</Text>
        </GlassCard>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <PillButton
            onPress={() => router.push('/(tabs)/transactions')}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>View Transaction</Text>
          </PillButton>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)')}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    alignItems: 'center',
  },
  successIconContainer: {
    marginTop: 40,
    marginBottom: SECTION_SPACING,
  },
  successIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: SECTION_SPACING,
    textAlign: 'center',
  },
  detailsCard: {
    width: '100%',
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
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    marginRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actionsContainer: {
    width: '100%',
    marginTop: 8,
  },
  actionButton: {
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.white,
  },
  secondaryButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
  },
});
