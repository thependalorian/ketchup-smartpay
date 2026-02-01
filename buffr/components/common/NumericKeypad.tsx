/**
 * NumericKeypad Component
 *
 * Location: components/common/NumericKeypad.tsx
 * Purpose: Reusable numeric keypad for amount entry and PINs
 *
 * @psychology
 * - **Fitts's Law**: Each key button is 28% width with 1.4 aspect ratio,
 *   providing adequate touch target (approx. 52pt on standard screens).
 *   16pt gap between keys prevents accidental taps.
 * - **Jakob's Law**: Standard 3x4 telephone keypad layout matches user
 *   expectations. Users instinctively know where each number is located.
 * - **Gestalt Similarity**: All number keys share identical styling
 *   (backgroundColor, borderRadius, fontSize) signaling equivalent function.
 * - **Doherty Threshold**: Use `activeOpacity={0.6}` for immediate visual
 *   feedback. Add haptic feedback via expo-haptics for each keypress.
 *
 * @enhancement Consider adding:
 * - Haptic feedback: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`
 * - Visual ripple effect on Android (Material Design pattern)
 * - Disable state for max length reached (PIN, OTP)
 * - Biometric button option for PIN screens
 *
 * @accessibility
 * - Add `accessibilityLabel` to each key (e.g., "Number 5")
 * - Add `accessibilityRole="button"` for screen readers
 * - Backspace: `accessibilityLabel="Delete last digit"`
 *
 * @see .cursorrules for touch target guidelines
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

interface NumericKeypadProps {
  onPress: (key: string) => void;
  onBackspace: () => void;
  showDecimal?: boolean;
}

export default function NumericKeypad({
  onPress,
  onBackspace,
  showDecimal = true,
}: NumericKeypadProps) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', showDecimal ? '.' : '', '0', 'backspace'];

  return (
    <View style={styles.container}>
      {keys.map((key, index) => {
        if (key === '') return <View key={index} style={styles.keyPlaceholder} />;
        
        return (
          <TouchableOpacity
            key={index}
            style={styles.keyButton}
            onPress={() => key === 'backspace' ? onBackspace() : onPress(key)}
            activeOpacity={0.6}
          >
            {key === 'backspace' ? (
              <FontAwesome name="long-arrow-left" size={24} color={Colors.text} />
            ) : (
              <Text style={styles.keyText}>{key}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    gap: 16,
  },
  keyButton: {
    width: '28%',
    aspectRatio: 1.4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  keyPlaceholder: {
    width: '28%',
    aspectRatio: 1.4,
  },
  keyText: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.text,
  },
});