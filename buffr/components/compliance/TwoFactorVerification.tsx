/**
 * Two-Factor Verification Component
 * 
 * Location: components/compliance/TwoFactorVerification.tsx
 * Purpose: A modal to handle 2FA (PIN or Biometric) for critical actions.
 * 
 * Fulfills PSD-12 requirement for 2FA on every payment transaction.
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';

const PIN_LENGTH = 4;

interface TwoFactorVerificationProps {
  visible: boolean;
  onVerify: (method: 'pin' | 'biometric', code?: string) => Promise<boolean>;
  onCancel: () => void;
  amount: number;
  recipientName: string;
}

export default function TwoFactorVerification({
  visible,
  onVerify,
  onCancel,
  amount,
  recipientName,
}: TwoFactorVerificationProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'pin' | 'biometric' | 'initial'>('initial');

  const ref = useBlurOnFulfill({ value: pin, cellCount: PIN_LENGTH });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value: pin,
    setValue: setPin,
  });

  useEffect(() => {
    if (visible) {
      // Reset state when modal becomes visible
      setPin('');
      setLoading(false);
      setError(null);
      setAuthMethod('initial');
      handleBiometricAuth(); // Attempt biometric auth first
    }
  }, [visible]);

  const handleBiometricAuth = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled) {
      setAuthMethod('biometric');
      setLoading(true);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: amount > 0 ? 'Confirm Payment' : 'Show Balance',
        cancelLabel: 'Use PIN',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        const verified = await onVerify('biometric');
        if (!verified) {
          setError('Biometric verification failed. Please try again.');
        }
      } else {
        // User cancelled or fallback, switch to PIN
        setAuthMethod('pin');
      }
      setLoading(false);
    } else {
      // No biometrics, default to PIN
      setAuthMethod('pin');
    }
  };

  const handlePinFulfill = async (code: string) => {
    setLoading(true);
    setError(null);
    const verified = await onVerify('pin', code);
    if (!verified) {
      setError('Incorrect PIN. Please try again.');
      setPin(''); // Clear PIN on failure
    }
    setLoading(false);
  };

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      handlePinFulfill(pin);
    }
  }, [pin]);

  const renderContent = () => {
    if (authMethod === 'initial' || (authMethod === 'biometric' && loading)) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Authenticating...</Text>
        </View>
      );
    }

    if (authMethod === 'pin') {
      return (
        <>
          <Text style={styles.title}>Enter Your PIN</Text>
          <Text style={styles.subtitle}>
            {amount > 0 
              ? `Confirm payment of ${recipientName.includes('N$') ? recipientName : `N$ ${amount.toFixed(2)} to ${recipientName}`}`
              : `Authenticate to ${recipientName.toLowerCase()}`
            }
          </Text>

          <CodeField
            ref={ref}
            {...props}
            value={pin}
            onChangeText={setPin}
            cellCount={PIN_LENGTH}
            rootStyle={styles.codeFieldRoot}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            renderCell={({ index, symbol, isFocused }) => (
              <View
                key={index}
                style={[styles.cell, isFocused && styles.focusCell]}
                onLayout={getCellOnLayoutHandler(index)}
              >
                <Text style={styles.cellText}>
                  {symbol || (isFocused ? <Cursor /> : null)}
                </Text>
              </View>
            )}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.white} />
            </View>
          )}
        </>
      );
    }

    return null;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
            <FontAwesome name="times" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: Colors.background,
    borderRadius: 24,
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  codeFieldRoot: {
    width: 280,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: 24,
  },
  cell: {
    width: 50,
    height: 50,
    lineHeight: 48,
    fontSize: 24,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusCell: {
    borderColor: Colors.primary,
  },
  cellText: {
    color: Colors.text,
    fontSize: 24,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
});