/**
 * Send Money: Success Screen
 * 
 * Location: app/send-money/success.tsx
 * 
 * Purpose: Final screen in the send money flow, confirming a successful transaction.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { HORIZONTAL_PADDING } from '@/constants/Layout';
import { PillButton } from '@/components/common';
import { useUser } from '@/contexts/UserContext';

export default function SuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    amount?: string;
    contactName?: string;
    transactionId?: string;
  }>();
  const { user } = useUser();

  const handleDone = () => {
    router.replace('/(tabs)');
  };

  const handleViewReceipt = () => {
    if (params.transactionId) {
      router.push(`/transactions/${params.transactionId}`);
    }
  };

  return (
    <View style={defaultStyles.containerFull}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <FontAwesome name="check-circle" size={100} color={Colors.success} />
        </View>
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>
          You have successfully sent{' '}
          <Text style={styles.bold}>
            {user?.currency || 'N$'}
            {parseFloat(params.amount || '0').toFixed(2)}
          </Text>{' '}
          to <Text style={styles.bold}>{params.contactName}</Text>.
        </Text>
      </View>

      <View style={styles.footer}>
        <PillButton
          label="View Receipt"
          variant="outline"
          onPress={handleViewReceipt}
          disabled={!params.transactionId}
        />
        <PillButton label="Done" variant="primary" onPress={handleDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: HORIZONTAL_PADDING,
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  bold: {
    fontWeight: '600',
    color: Colors.text,
  },
  footer: {
    padding: HORIZONTAL_PADDING,
    paddingBottom: 40,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
});
