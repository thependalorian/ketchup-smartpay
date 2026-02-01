/**
 * Fee Transparency Component
 * 
 * Location: components/compliance/FeeTransparency.tsx
 * Purpose: Display transparent fee information (PSD-3 Section 14.3)
 * 
 * Regulatory Requirement: PSD-3 Section 14.3 - "All fees and charges related to 
 * e-money services should be transparently displayed in the e-money issuers' outlets, 
 * transacting platforms, banking halls and websites, and should not be misleading 
 * or bundled, so as to ensure customers pay exactly the price that is publicly displayed."
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

interface FeeTransparencyProps {
  transactionType: 'send' | 'receive' | 'withdraw' | 'deposit';
  amount: number;
  onPress?: () => void;
}

const FEE_STRUCTURE = {
  send: {
    label: 'Send Money',
    fee: 0, // N$0 for sending money
    description: 'No fee for sending money',
  },
  receive: {
    label: 'Receive Money',
    fee: 0, // N$0 for receiving money
    description: 'No fee for receiving money',
  },
  withdraw: {
    label: 'Withdraw',
    fee: 5, // N$5 withdrawal fee
    description: 'N$5 fee per withdrawal',
  },
  deposit: {
    label: 'Deposit',
    fee: 0, // N$0 for deposits
    description: 'No fee for deposits',
  },
};

export default function FeeTransparency({
  transactionType,
  amount,
  onPress,
}: FeeTransparencyProps) {
  const feeInfo = FEE_STRUCTURE[transactionType];
  const totalAmount = amount + feeInfo.fee;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <FontAwesome name="info-circle" size={16} color={Colors.primary} />
        <Text style={styles.title}>Transaction Fees</Text>
      </View>
      
      <View style={styles.feeDetails}>
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Transaction Amount:</Text>
          <Text style={styles.feeValue}>N$ {amount.toFixed(2)}</Text>
        </View>
        
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>{feeInfo.label} Fee:</Text>
          <Text style={styles.feeValue}>
            {feeInfo.fee === 0 ? 'Free' : `N$ ${feeInfo.fee.toFixed(2)}`}
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.feeRow}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalValue}>N$ {totalAmount.toFixed(2)}</Text>
        </View>
      </View>
      
      <Text style={styles.description}>{feeInfo.description}</Text>
      
      {onPress && (
        <View style={styles.viewDetails}>
          <Text style={styles.viewDetailsText}>View All Fees</Text>
          <FontAwesome name="chevron-right" size={12} color={Colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundGray,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  feeDetails: {
    marginBottom: 12,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
});
