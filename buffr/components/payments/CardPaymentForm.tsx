/**
 * Card Payment Form Component
 * 
 * Location: components/payments/CardPaymentForm.tsx
 * Purpose: Secure card input form for payments
 * 
 * Features:
 * - Card number input (masked)
 * - Expiry date input
 * - CVV input (secure)
 * - Cardholder name input
 * - Validation
 * - Save card option
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING } from '@/components/layouts';

export interface CardPaymentFormData {
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  cardHolderFullName: string;
  saveCardDetails?: boolean;
}

interface CardPaymentFormProps {
  onSubmit: (data: CardPaymentFormData) => void;
  onCancel?: () => void;
  loading?: boolean;
  allowSaveCard?: boolean;
  initialData?: Partial<CardPaymentFormData>;
}

export default function CardPaymentForm({
  onSubmit,
  onCancel,
  loading = false,
  allowSaveCard = true,
  initialData,
}: CardPaymentFormProps) {
  const [cardNumber, setCardNumber] = useState(initialData?.cardNumber || '');
  const [expiryMonth, setExpiryMonth] = useState(
    initialData?.expiryMonth?.toString().padStart(2, '0') || ''
  );
  const [expiryYear, setExpiryYear] = useState(
    initialData?.expiryYear?.toString() || ''
  );
  const [cvv, setCvv] = useState(initialData?.cvv || '');
  const [cardHolderName, setCardHolderName] = useState(
    initialData?.cardHolderFullName || ''
  );
  const [saveCard, setSaveCard] = useState(initialData?.saveCardDetails || false);
  const [showCvv, setShowCvv] = useState(false);
  
  // If initial data has card number but we're only collecting CVV, hide card number field
  const isCvvOnly = !!initialData?.cardHolderFullName && !initialData?.cardNumber;

  const formatCardNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    // Limit to 16 digits
    const limited = cleaned.slice(0, 16);
    // Add spaces every 4 digits
    return limited.replace(/(.{4})/g, '$1 ').trim();
  };

  const handleCardNumberChange = (text: string) => {
    const formatted = formatCardNumber(text);
    setCardNumber(formatted);
  };

  const handleExpiryMonthChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 2);
    const month = parseInt(cleaned);
    if (cleaned === '' || (month >= 1 && month <= 12)) {
      setExpiryMonth(cleaned);
    }
  };

  const handleExpiryYearChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    const currentYear = new Date().getFullYear();
    const year = parseInt(cleaned);
    if (cleaned === '' || (year >= currentYear && year <= currentYear + 20)) {
      setExpiryYear(cleaned);
    }
  };

  const handleCvvChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    setCvv(cleaned);
  };

  const validateForm = (): boolean => {
    if (!isCvvOnly) {
      const cardNumberDigits = cardNumber.replace(/\D/g, '');
      if (cardNumberDigits.length < 13 || cardNumberDigits.length > 19) {
        Alert.alert('Invalid Card', 'Please enter a valid card number');
        return false;
      }

      if (!expiryMonth || parseInt(expiryMonth) < 1 || parseInt(expiryMonth) > 12) {
        Alert.alert('Invalid Expiry', 'Please enter a valid expiry month (01-12)');
        return false;
      }

      if (!expiryYear || expiryYear.length !== 4) {
        Alert.alert('Invalid Expiry', 'Please enter a valid expiry year (YYYY)');
        return false;
      }

      const currentDate = new Date();
      const expiryDate = new Date(
        parseInt(expiryYear),
        parseInt(expiryMonth) - 1
      );
      if (expiryDate < currentDate) {
        Alert.alert('Expired Card', 'This card has expired');
        return false;
      }

      if (!cardHolderName.trim()) {
        Alert.alert('Invalid Name', 'Please enter the cardholder name');
        return false;
      }
    }

    if (cvv.length < 3 || cvv.length > 4) {
      Alert.alert('Invalid CVV', 'Please enter a valid CVV (3-4 digits)');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    if (isCvvOnly && initialData) {
      // CVV only mode - use initial data and new CVV
      onSubmit({
        cardNumber: initialData.cardNumber || '',
        expiryMonth: initialData.expiryMonth || 0,
        expiryYear: initialData.expiryYear || 0,
        cvv,
        cardHolderFullName: initialData.cardHolderFullName || '',
        saveCardDetails: false, // Already saved
      });
    } else {
      const cardNumberDigits = cardNumber.replace(/\D/g, '');
      onSubmit({
        cardNumber: cardNumberDigits,
        expiryMonth: parseInt(expiryMonth),
        expiryYear: parseInt(expiryYear),
        cvv,
        cardHolderFullName: cardHolderName.trim(),
        saveCardDetails: allowSaveCard ? saveCard : false,
      });
    }
  };

  return (
    <View style={styles.container}>
      {!isCvvOnly && (
        <View style={styles.section}>
          <Text style={styles.label}>Card Number</Text>
          <TextInput
            style={styles.input}
            placeholder="1234 5678 9012 3456"
            placeholderTextColor={Colors.textSecondary}
            value={cardNumber}
            onChangeText={handleCardNumberChange}
            keyboardType="numeric"
            maxLength={19} // 16 digits + 3 spaces
            autoComplete="cc-number"
          />
        </View>
      )}

      {!isCvvOnly && (
        <View style={styles.row}>
          <View style={[styles.section, styles.flex1]}>
            <Text style={styles.label}>Expiry Month</Text>
            <TextInput
              style={styles.input}
              placeholder="MM"
              placeholderTextColor={Colors.textSecondary}
              value={expiryMonth}
              onChangeText={handleExpiryMonthChange}
              keyboardType="numeric"
              maxLength={2}
              autoComplete="cc-exp-month"
            />
          </View>

          <View style={[styles.section, styles.flex1]}>
            <Text style={styles.label}>Expiry Year</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY"
              placeholderTextColor={Colors.textSecondary}
              value={expiryYear}
              onChangeText={handleExpiryYearChange}
              keyboardType="numeric"
              maxLength={4}
              autoComplete="cc-exp-year"
            />
          </View>
        </View>
      )}

      <View style={[styles.section, styles.flex1]}>
        <Text style={styles.label}>CVV</Text>
        <View style={styles.cvvContainer}>
          <TextInput
            style={[styles.input, styles.cvvInput]}
            placeholder="123"
            placeholderTextColor={Colors.textSecondary}
            value={cvv}
            onChangeText={handleCvvChange}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry={!showCvv}
            autoComplete="cc-csc"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowCvv(!showCvv)}
          >
            <FontAwesome
              name={showCvv ? 'eye' : 'eye-slash'}
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {!isCvvOnly && (
        <View style={styles.section}>
          <Text style={styles.label}>Cardholder Name</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            placeholderTextColor={Colors.textSecondary}
            value={cardHolderName}
            onChangeText={setCardHolderName}
            autoCapitalize="words"
            autoComplete="cc-name"
          />
        </View>
      )}
      
      {isCvvOnly && (
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Enter CVV for card ending in {initialData?.cardNumber?.slice(-4) || '****'}
          </Text>
        </View>
      )}

      {allowSaveCard && (
        <TouchableOpacity
          style={styles.saveCardContainer}
          onPress={() => setSaveCard(!saveCard)}
          activeOpacity={0.7}
        >
          <FontAwesome
            name={saveCard ? 'check-square' : 'square-o'}
            size={20}
            color={saveCard ? Colors.primary : Colors.textSecondary}
          />
          <Text style={styles.saveCardText}>
            Save card for future payments
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.buttonRow}>
        {onCancel && (
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, styles.submitButton, loading && styles.disabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: HORIZONTAL_PADDING,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  cvvContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cvvInput: {
    flex: 1,
    borderWidth: 0,
  },
  eyeButton: {
    padding: 16,
  },
  saveCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  saveCardText: {
    fontSize: 14,
    color: Colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  cancelButton: {
    backgroundColor: Colors.backgroundGray,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  disabled: {
    opacity: 0.6,
  },
  infoCard: {
    backgroundColor: Colors.info + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
  },
});
