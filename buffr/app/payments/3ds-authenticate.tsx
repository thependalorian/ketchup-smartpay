/**
 * 3D Secure Authentication Screen
 * 
 * Location: app/payments/3ds-authenticate.tsx
 * Purpose: Handle 3D Secure authentication flow with Bankserv
 * 
 * Features:
 * - Display 3DS form POST to Bankserv
 * - Handle callback from Bankserv
 * - Complete payment after authentication
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenHeader, ErrorState } from '@/components/common';
import Colors from '@/constants/Colors';
import { useAdumoPayment } from '@/hooks/useAdumoPayment';
import { formatCurrency } from '@/utils/formatters';

interface ThreeDSecureFormData {
  acsUrl: string;
  paReq: string;
  termUrl: string;
  md: string;
}

export default function ThreeDSecureAuthScreen() {
  const { id: transactionId, amount, cvv } = useLocalSearchParams<{
    id: string;
    amount: string;
    cvv?: string;
  }>();
  const router = useRouter();
  const { process3DSecure, loading } = useAdumoPayment();
  const [error, setError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const amountNum = parseFloat(amount || '0');

  // Handle 3DS callback from Bankserv
  const handle3DSCallback = async (callbackData: any) => {
    if (!transactionId || !amountNum) {
      setError('Missing transaction or amount information');
      return;
    }

    setAuthenticating(true);
    try {
      const result = await process3DSecure(transactionId, amountNum, cvv);

      if (result.success) {
        Alert.alert(
          'Payment Successful',
          `Payment of ${formatCurrency(amountNum)} completed successfully`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to previous screen or to success screen
                router.back();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Payment Failed',
          result.statusMessage || '3D Secure authentication failed',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete 3D Secure authentication');
      Alert.alert('Error', err.message || 'Authentication failed');
    } finally {
      setAuthenticating(false);
    }
  };

  // For React Native, we need to use WebView to handle the 3DS form POST
  // This is a simplified version - in production, you'd need to handle the form POST properly
  const handleBack = () => {
    Alert.alert(
      'Cancel Authentication',
      'Are you sure you want to cancel? The payment will not be processed.',
      [
        { text: 'Continue', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  if (!transactionId || !amountNum) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="3D Secure Authentication" onBack={handleBack} />
        <ErrorState
          title="Invalid Request"
          message="Missing transaction or amount information"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="3D Secure Authentication" onBack={handleBack} />

      {authenticating ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            Completing authentication...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <ErrorState title="Authentication Error" message={error} />
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Secure Authentication Required</Text>
            <Text style={styles.infoText}>
              {`You will be redirected to your bank's secure authentication page`}
              to verify this payment of {formatCurrency(amountNum)}.
            </Text>
            <Text style={styles.infoSubtext}>
              Please complete the authentication on the next screen.
            </Text>
          </View>

          {/* In production, this would be a WebView that posts the form to Bankserv */}
          {/* For now, show a message that this needs to be implemented */}
          <View style={styles.webViewPlaceholder}>
            <Text style={styles.placeholderText}>
              3D Secure WebView will be displayed here
            </Text>
            <Text style={styles.placeholderSubtext}>
              In production, this will POST the form to Bankserv and handle the
              callback automatically.
            </Text>
          </View>

          {/* Note: In a real implementation, you would:
              1. Create a WebView component
              2. POST the form data (acsUrl, paReq, termUrl, md) to Bankserv
              3. Handle the callback from Bankserv on the termUrl
              4. Extract TransactionIndex and paresPayload from the callback
              5. Call the authenticate endpoint
              6. Complete the payment flow
          */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: Colors.info + '20',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    gap: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  infoSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  webViewPlaceholder: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 12,
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
