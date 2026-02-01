/**
 * Search Input Component
 *
 * Location: components/common/SearchInput.tsx
 * Purpose: Reusable search input with glass effect, icon, and clear button
 *
 * Features:
 * - Glass effect container
 * - Search icon
 * - Clear button (when text entered)
 * - Debounced search (optional)
 * - Consistent styling
 *
 * @psychology
 * - **Doherty Threshold**: Debounced search prevents UI lag during typing.
 *   Results appearing within 400ms maintain flow state and perceived speed.
 * - **Cognitive Load Reduction**: Search icon provides instant recognition
 *   (universal pattern). Users don't need to read labels to understand function.
 * - **Jakob's Law**: Search field with magnifying glass icon matches user
 *   expectations from every major platform (iOS, Android, web).
 * - **Fitts's Law**: Clear button appears only when needed, preventing
 *   accidental taps. Touch target sized for easy thumb access (44pt min).
 * - **Progressive Disclosure**: Clear button reveals only when text is present,
 *   reducing visual noise and unnecessary options.
 *
 * @accessibility
 * - Add accessibilityRole="search" for screen readers
 * - Ensure placeholder text has sufficient contrast
 * - Clear button should have accessibilityLabel="Clear search"
 *
 * @see GlassCard for underlying glass effect implementation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import GlassCard from './GlassCard';
import Colors from '@/constants/Colors';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  debounceMs?: number;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function SearchInput({
  placeholder = 'Search...',
  value,
  onChangeText,
  onClear,
  debounceMs,
  style,
  containerStyle,
}: SearchInputProps) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  // Debounce search if debounceMs is provided
  useEffect(() => {
    if (debounceMs && debounceMs > 0) {
      const timer = setTimeout(() => {
        onChangeText(debouncedValue);
      }, debounceMs);

      return () => clearTimeout(timer);
    } else {
      onChangeText(debouncedValue);
    }
  }, [debouncedValue, debounceMs, onChangeText]);

  // Sync external value changes
  useEffect(() => {
    setDebouncedValue(value);
  }, [value]);

  const handleClear = () => {
    setDebouncedValue('');
    if (onClear) {
      onClear();
    } else {
      onChangeText('');
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.searchContainer}>
        <FontAwesome
          name="search"
          size={20}
          color={Colors.dark}
        />
        <TextInput
          style={[styles.searchInput, style]}
          placeholder={placeholder}
          placeholderTextColor={Colors.gray}  // ✅ buffr-mobile placeholder color
          value={debouncedValue}
          onChangeText={setDebouncedValue}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {debouncedValue.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <FontAwesome
              name="times-circle"
              size={20}
              color={Colors.gray}  // ✅ buffr-mobile color
            />
          </TouchableOpacity>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: Colors.lightGray,  // ✅ buffr-mobile style
    borderRadius: 30,  // ✅ buffr-mobile rounded search (from CustomHeader)
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,  // ✅ buffr-mobile spacing
  },
  searchInput: {
    flex: 1,
    fontSize: 20,  // ✅ buffr-mobile fontSize
    color: Colors.dark,  // ✅ buffr-mobile text color
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
});
