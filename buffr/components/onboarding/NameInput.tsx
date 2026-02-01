/**
 * NameInput Component
 * 
 * Location: components/onboarding/NameInput.tsx
 * Purpose: Name input field for onboarding profile setup
 * 
 * Design: Based on BuffrCrew/Buffr App Design - "After Setting Up Name.svg"
 */

import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

interface NameInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  autoFocus?: boolean;
}

export default function NameInput({
  value,
  onChangeText,
  placeholder = 'Enter your name',
  label,
  error,
  autoFocus = false,
}: NameInputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[styles.inputContainer, error && styles.inputError]}>
        <FontAwesome name="user-o" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.gray}  // ✅ buffr-mobile placeholder color
          autoFocus={autoFocus}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <FontAwesome name="check-circle" size={18} color={Colors.success} />
        )}
      </View>

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
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,  // ✅ buffr-mobile style
    borderRadius: 16,  // ✅ buffr-mobile style
    paddingHorizontal: 20,  // ✅ buffr-mobile padding
    height: 56,  // ✅ buffr-mobile height
    gap: 12,
    borderWidth: 0,  // ✅ buffr-mobile no border
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    fontSize: 20,  // ✅ buffr-mobile fontSize
    fontWeight: '500',
    color: Colors.dark,  // ✅ buffr-mobile text color
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
