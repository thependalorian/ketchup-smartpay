/**
 * PhoneInput Component
 * 
 * Location: components/onboarding/PhoneInput.tsx
 * Purpose: Phone number input with country code for onboarding
 * 
 * Design: Based on BuffrCrew/Buffr App Design - "Enter number.svg"
 * - Large input field
 * - Country code prefix
 * - Numeric keypad styling
 */

import React, { useState, useRef } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  countryCode?: string;
  placeholder?: string;
  error?: string;
  autoFocus?: boolean;
}

export default function PhoneInput({
  value,
  onChangeText,
  countryCode = '+264',
  placeholder = '81 234 5678',
  error,
  autoFocus = true,
}: PhoneInputProps) {
  const inputRef = useRef<TextInput>(null);

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format as XX XXX XXXX
    let formatted = '';
    if (cleaned.length > 0) {
      formatted = cleaned.slice(0, 2);
    }
    if (cleaned.length > 2) {
      formatted += ' ' + cleaned.slice(2, 5);
    }
    if (cleaned.length > 5) {
      formatted += ' ' + cleaned.slice(5, 9);
    }
    
    return formatted;
  };

  const handleChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    onChangeText(formatted);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.inputContainer}
        onPress={() => inputRef.current?.focus()}
        activeOpacity={1}
      >
        {/* Country Code */}
        <View style={styles.countryCode}>
          <Text style={styles.flag}>🇳🇦</Text>
          <Text style={styles.countryCodeText}>{countryCode}</Text>
          <FontAwesome name="chevron-down" size={12} color={Colors.textSecondary} />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Phone Input */}
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.gray}  // ✅ buffr-mobile placeholder color
          keyboardType="phone-pad"
          autoFocus={autoFocus}
          maxLength={12}
        />
      </TouchableOpacity>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={14} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,  // ✅ buffr-mobile style
    borderRadius: 16,  // ✅ buffr-mobile style
    paddingHorizontal: 20,  // ✅ buffr-mobile padding
    height: 56,  // ✅ buffr-mobile height
    borderWidth: 0,  // ✅ buffr-mobile no border
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 12,
  },
  flag: {
    fontSize: 20,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.slate300,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: Colors.text,
    paddingVertical: 0,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
  },
});
