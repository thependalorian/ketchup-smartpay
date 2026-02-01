/**
 * Request Money: Success Screen
 * 
 * Location: app/request-money/success.tsx
 * Purpose: Final screen in the request money flow, confirming a successful request
 * 
 * Features:
 * - Success confirmation with icon
 * - Request details display
 * - Navigation to view request or return home
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

export default function RequestMoneySuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    requestId?: string;
    contactName?: string;
    amount?: string;
  }>();
  const { user } = useUser();

  const handleDone = () => {
    router.replace('/(tabs)');
  };

  const handleViewRequest = () => {
    if (params.requestId) {
      router.push(`/requests/${params.requestId}`);
    }
  };

  return (
    <View style={defaultStyles.containerFull}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <FontAwesome name="check-circle" size={100} color={Colors.success} />
        </View>
        <Text style={styles.title}>Request Sent!</Text>
        <Text style={styles.subtitle}>
          You have successfully requested{' '}
          <Text style={styles.bold}>
            {user?.currency || 'N$'}
            {parseFloat(params.amount || '0').toFixed(2)}
          </Text>{' '}
          from <Text style={styles.bold}>{params.contactName || 'Contact'}</Text>.
        </Text>
        <Text style={styles.infoText}>
          They will receive a notification and can pay the request from their Buffr account.
        </Text>
      </View>

      <View style={styles.footer}>
        {params.requestId && (
          <PillButton
            label="View Request"
            variant="outline"
            onPress={handleViewRequest}
          />
        )}
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
    marginBottom: 16,
  },
  bold: {
    fontWeight: '600',
    color: Colors.text,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
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
