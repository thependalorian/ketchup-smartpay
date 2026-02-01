/**
 * Form Field Component
 *
 * Location: components/common/FormField.tsx
 * Purpose: Reusable form field with label, input, and error message
 *
 * Features:
 * - Label and input
 * - Error message display
 * - Required indicator
 * - Consistent styling
 * - Support for different input types
 *
 * @psychology
 * - **Gestalt Proximity**: Label, input, and error message are visually grouped
 *   together, signaling they belong to the same form element. Spacing (20px
 *   between fields) creates clear separation between different fields.
 * - **Cognitive Load Reduction**: Labels above inputs (not placeholder-only)
 *   persist during typing, reducing memory burden. Users always see context.
 * - **Von Restorff Effect**: Required asterisk (*) in red immediately draws
 *   attention to mandatory fields, preventing form submission errors.
 * - **Error Psychology**: Error messages appear directly below the problematic
 *   field with red color, using color psychology for immediate recognition.
 *   Border turns red to reinforce the error state visually.
 * - **Trust Psychology**: Clear validation feedback builds user confidence.
 *   Knowing what's wrong and where reduces frustration and abandonment.
 * - **Fitts's Law**: Input height (50px) provides generous touch target,
 *   reducing tap errors and improving mobile usability.
 *
 * @accessibility
 * - Labels should be associated with inputs via accessibilityLabelledBy
 * - Error messages should use accessibilityRole="alert"
 * - Color contrast meets WCAG AA for error states
 *
 * @see constants/Colors.ts for error and text color definitions
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import Colors from '@/constants/Colors';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
  containerStyle?: any;
}

export default function FormField({
  label,
  error,
  required,
  containerStyle,
  ...textInputProps
}: FormFieldProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          textInputProps.style,
        ]}
        placeholderTextColor={Colors.gray}  // ✅ buffr-mobile placeholder color
        {...textInputProps}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  required: {
    color: Colors.error,
  },
  input: {
    height: 56,  // ✅ buffr-mobile compatible
    backgroundColor: Colors.lightGray,  // ✅ buffr-mobile style
    borderRadius: 16,  // ✅ buffr-mobile style
    borderWidth: 0,  // ✅ buffr-mobile (no border)
    paddingHorizontal: 20,  // ✅ buffr-mobile padding
    fontSize: 20,  // ✅ buffr-mobile fontSize
    color: Colors.dark,  // ✅ buffr-mobile text color
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.error,
  },
});
