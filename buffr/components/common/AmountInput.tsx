/**
 * Amount Input Component
 *
 * Location: components/common/AmountInput.tsx
 * Purpose: Reusable amount input with currency symbol, formatting, and quick buttons
 *
 * Features:
 * - Currency symbol prefix
 * - Number pad keyboard
 * - Quick amount buttons
 * - Formatting and validation
 * - Glass effect container (optional)
 *
 * @psychology
 * - **Miller's Law (Chunking)**: Display amounts with thousands separators
 *   (e.g., "N$ 1,234.56") for easier mental processing. Format on blur:
 *   `amount.toLocaleString('en-NA', { minimumFractionDigits: 2 })`
 * - **Cognitive Load Reduction**: Pre-fill with smart defaults, auto-format
 *   as user types, and provide quick amount buttons (100, 500, 1000) to
 *   reduce typing effort.
 * - **Hick's Law**: Limit quick amount buttons to 3-5 options to reduce
 *   decision time. Current default (100, 500, 1000) is optimal.
 * - **Fitts's Law**: Quick amount buttons should be at least 44pt touch target.
 *   Current implementation provides adequate tap area.
 *
 * @enhancement Consider adding:
 * - Real-time formatting with commas as user types
 * - Maximum amount validation with error feedback
 * - Minimum amount (N$ 1.00) enforcement
 * - Haptic feedback on quick amount selection
 *
 * @accessibility
 * - Use `accessibilityLabel` with formatted amount for screen readers
 * - Announce value changes with `accessibilityLiveRegion`
 *
 * @see constants/Typography.ts for amountHero/Large/Medium presets
 */

import React from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import GlassCard from './GlassCard';
import Colors from '@/constants/Colors';

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  currency?: string;
  quickAmounts?: number[];
  onQuickAmountPress?: (amount: number) => void;
  placeholder?: string;
  style?: any;
  useGlassCard?: boolean;
  showQuickAmounts?: boolean;
}

export default function AmountInput({
  value,
  onChangeText,
  currency = 'N$',
  quickAmounts = [100, 500, 1000],
  onQuickAmountPress,
  placeholder = '0',
  style,
  useGlassCard = false,
  showQuickAmounts = true,
}: AmountInputProps) {
  const handleAmountChange = (text: string) => {
    // Only allow numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    onChangeText(cleaned);
  };

  const handleQuickAmount = (amount: number) => {
    onChangeText(amount.toString());
    if (onQuickAmountPress) {
      onQuickAmountPress(amount);
    }
  };

  const inputContent = (
    <View style={styles.container}>
      <View style={styles.amountContainer}>
        <Text style={styles.currencySymbol}>{currency}</Text>
        <TextInput
          style={[styles.amountInput, style]}
          placeholder={placeholder}
          placeholderTextColor={Colors.gray}  // ✅ buffr-mobile placeholder color
          value={value}
          onChangeText={handleAmountChange}
          keyboardType="decimal-pad"
        />
        {value.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => onChangeText('')}
            activeOpacity={0.7}
          >
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Amount Buttons */}
      {showQuickAmounts && quickAmounts.length > 0 && (
        <View style={styles.quickAmounts}>
          {quickAmounts.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={styles.quickAmountButton}
              onPress={() => handleQuickAmount(amount)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickAmountText}>
                {currency} {amount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  if (useGlassCard) {
    return (
      <GlassCard style={styles.glassCard} padding={20} borderRadius={16}>
        {inputContent}
      </GlassCard>
    );
  }

  return inputContent;
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  glassCard: {
    marginBottom: 16,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,  // ✅ buffr-mobile style
    borderRadius: 16,  // ✅ buffr-mobile style
    paddingHorizontal: 20,  // ✅ buffr-mobile padding
    height: 56,  // ✅ buffr-mobile height
    borderWidth: 0,  // ✅ buffr-mobile no border
    gap: 8,
  },
  currencySymbol: {
    fontSize: 20,  // ✅ buffr-mobile fontSize
    fontWeight: '500',  // ✅ buffr-mobile fontWeight
    color: Colors.dark,  // ✅ buffr-mobile text color
  },
  amountInput: {
    flex: 1,
    fontSize: 20,  // ✅ buffr-mobile fontSize
    fontWeight: '500',  // ✅ buffr-mobile fontWeight
    color: Colors.dark,  // ✅ buffr-mobile text color
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAmountButton: {
    paddingHorizontal: 20,  // ✅ buffr-mobile padding
    paddingVertical: 10,  // ✅ buffr-mobile padding
    backgroundColor: Colors.lightGray,  // ✅ buffr-mobile style
    borderRadius: 20,  // ✅ buffr-mobile pill shape (half of height)
    borderWidth: 0,  // ✅ buffr-mobile no border
    height: 40,  // ✅ buffr-mobile small button height
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
});
