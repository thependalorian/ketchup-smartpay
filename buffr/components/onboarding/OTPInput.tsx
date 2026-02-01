/**
 * OTPInput Component
 * 
 * Location: components/onboarding/OTPInput.tsx
 * Purpose: OTP verification input for onboarding
 * 
 * Design: Based on BuffrCrew/Buffr App Design - "Entering OTP.svg"
 * - 6 digit boxes
 * - Auto-advance on input
 * - Error state
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable } from 'react-native';
import Colors from '@/constants/Colors';

interface OTPInputProps {
  length?: number;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  autoFocus?: boolean;
}

export default function OTPInput({
  length = 6,
  value,
  onChangeText,
  error,
  autoFocus = true,
}: OTPInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [autoFocus]);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const handleChange = (text: string) => {
    // Only allow numbers
    const cleaned = text.replace(/\D/g, '').slice(0, length);
    onChangeText(cleaned);
  };

  const digits = value.split('');

  return (
    <View style={styles.container}>
      <Pressable style={styles.boxContainer} onPress={handlePress}>
        {Array.from({ length }).map((_, index) => {
          const isCurrentIndex = index === value.length;
          const isFilled = index < value.length;
          
          return (
            <View
              key={index}
              style={[
                styles.box,
                isFocused && isCurrentIndex && styles.boxFocused,
                isFilled && styles.boxFilled,
                error && styles.boxError,
              ]}
            >
              <Text style={[styles.digit, isFilled && styles.digitFilled]}>
                {digits[index] || ''}
              </Text>
              {isFocused && isCurrentIndex && (
                <View style={styles.cursor} />
              )}
            </View>
          );
        })}
      </Pressable>

      {/* Hidden Input */}
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
      />

      {/* Error Message */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  boxContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.slate100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  boxFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  boxFilled: {
    backgroundColor: Colors.slate100,
    borderColor: Colors.slate200,
  },
  boxError: {
    borderColor: Colors.error,
    backgroundColor: `${Colors.error}10`,
  },
  digit: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  digitFilled: {
    color: Colors.text,
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 24,
    backgroundColor: Colors.primary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    marginTop: 12,
    textAlign: 'center',
  },
});
