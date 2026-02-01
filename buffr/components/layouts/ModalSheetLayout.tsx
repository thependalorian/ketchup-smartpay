/**
 * Modal Sheet Layout Component
 * 
 * Location: components/layouts/ModalSheetLayout.tsx
 * Purpose: Reusable layout wrapper for modal sheet presentations
 * 
 * Features:
 * - Full screen modal presentation
 * - Header with close button
 * - Scrollable content area
 * - Footer with primary action button
 * - Keyboard avoiding view
 * - Swipe to dismiss support (via Expo Router)
 */

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { HORIZONTAL_PADDING, SECTION_SPACING } from './StandardScreenLayout';

interface ModalSheetLayoutProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  footer?: React.ReactNode;
  primaryAction?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'dark' | 'outline';
  };
  scrollContentStyle?: any;
  keyboardAvoiding?: boolean;
  showCloseButton?: boolean;
}

export default function ModalSheetLayout({
  title,
  children,
  onClose,
  footer,
  primaryAction,
  scrollContentStyle,
  keyboardAvoiding = true,
  showCloseButton = true,
}: ModalSheetLayoutProps) {
  const router = useRouter();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const content = (
    <View style={defaultStyles.containerFull}>
      {/* Header */}
      <View style={styles.header}>
        {showCloseButton && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <FontAwesome name="times" size={24} color={Colors.text} />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

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

      {/* Footer */}
      {(footer || primaryAction) && (
        <View style={styles.footer}>
          {footer}
          {primaryAction && (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                primaryAction.disabled && styles.primaryButtonDisabled,
                primaryAction.variant === 'dark' && styles.primaryButtonDark,
                primaryAction.variant === 'outline' && styles.primaryButtonOutline,
              ]}
              onPress={primaryAction.onPress}
              disabled={primaryAction.disabled}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  primaryAction.variant === 'outline' && styles.primaryButtonTextOutline,
                ]}
              >
                {primaryAction.label}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={defaultStyles.containerFull}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: SECTION_SPACING,
    paddingBottom: SECTION_SPACING * 2,
  },
  footer: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  primaryButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonDark: {
    backgroundColor: Colors.dark,
  },
  primaryButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  primaryButtonTextOutline: {
    color: Colors.primary,
  },
});
