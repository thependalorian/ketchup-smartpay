/**
 * Standard Screen Layout Component
 * 
 * Location: components/layouts/StandardScreenLayout.tsx
 * Purpose: Reusable layout wrapper for standard screens with header and scrollable content
 * 
 * Features:
 * - Consistent header with back button
 * - Scrollable content area
 * - Glass effect header option
 * - Real estate planning constants
 * - Footer action buttons support
 */

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import ScreenHeader from '@/components/common/ScreenHeader';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { HORIZONTAL_PADDING, SECTION_SPACING, LARGE_SECTION_SPACING } from '@/constants/Layout';

// Re-export layout constants for backwards compatibility
export { HORIZONTAL_PADDING, SECTION_SPACING, LARGE_SECTION_SPACING };

export interface StandardScreenLayoutProps {
  title: string;
  children: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  onBackPress?: () => void; // Alias for onBack
  rightAction?: React.ReactNode;
  footer?: React.ReactNode;
  scrollContentStyle?: any;
  keyboardAvoiding?: boolean;
}

export default function StandardScreenLayout({
  title,
  children,
  showBackButton = true,
  onBack,
  onBackPress,
  rightAction,
  footer,
  scrollContentStyle,
  keyboardAvoiding = false,
}: StandardScreenLayoutProps) {
  // Support both onBack and onBackPress
  const handleBack = onBack || onBackPress;

  const content = (
    <View style={defaultStyles.container}>
      <ScreenHeader
        title={title}
        showBackButton={showBackButton}
        onBack={handleBack}
        rightAction={rightAction}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          scrollContentStyle,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      
      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={defaultStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: SECTION_SPACING,
    paddingBottom: LARGE_SECTION_SPACING,
  },
  footer: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
