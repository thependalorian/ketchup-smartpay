/**
 * Transaction Receipt Screen
 * 
 * Location: app/transactions/receipt.tsx
 * Purpose: High-fidelity digital receipt for successful transactions
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING } from '@/constants/Layout';
import { GlassCard, PillButton } from '@/components/common';
import { LinearGradient } from 'expo-linear-gradient';
import { log } from '@/utils/logger';

export default function ReceiptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    amount: string;
    recipient: string;
    date: string;
    type: string;
    reference: string;
  }>();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Buffr Transaction Receipt\nAmount: N$ ${params.amount}\nTo: ${params.recipient}\nRef: ${params.reference}`,
      });
    } catch (error) {
      log.error('Error sharing receipt:', error);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.background} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/transactions')}>
          <FontAwesome name="times" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipt</Text>
        <TouchableOpacity onPress={handleShare}>
          <FontAwesome name="share-alt" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.successIconContainer}>
          <View style={styles.successCircle}>
            <FontAwesome name="check" size={40} color={Colors.success} />
          </View>
        </View>

        <Text style={styles.successText}>Payment Successful</Text>
        <Text style={styles.amountText}>N$ {params.amount}</Text>

        <GlassCard tint="dark" intensity={20} style={styles.receiptCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Recipient</Text>
            <Text style={styles.value}>{params.recipient}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{params.date || new Date().toLocaleDateString()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Reference</Text>
            <Text style={styles.value}>{params.reference || 'BUF-98234-X'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Completed</Text>
            </View>
          </View>
        </GlassCard>
      </View>

      <View style={styles.footer}>
        <PillButton
          label="Done"
          variant="primary"
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  successText: {
    fontSize: 16,
    color: Colors.success,
    fontWeight: '600',
    marginBottom: 8,
  },
  amountText: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 40,
  },
  receiptCard: {
    width: '100%',
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: Colors.white + '80',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.white + '0D',
  },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
  footer: {
    padding: HORIZONTAL_PADDING,
    paddingBottom: 40,
  },
});