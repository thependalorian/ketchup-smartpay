/**
 * Confirmation Dialog Component
 *
 * Location: components/common/ConfirmationDialog.tsx
 * Purpose: Reusable confirmation dialog for critical actions
 *
 * Features:
 * - Modal confirmation dialog
 * - Title and message
 * - Primary and secondary actions
 * - Customizable button labels
 * - Glass effect styling
 *
 * @psychology
 * - **Hick's Law**: Limit to 2 actions (Confirm/Cancel) to minimize decision time.
 *   More options increase cognitive load and decision paralysis. For destructive
 *   actions, consider single "Cancel" with explicit confirmation.
 * - **Von Restorff Effect**: Primary action should stand out visually (brand color
 *   for default, red for danger). Secondary action recedes (ghost/outline style).
 * - **Trust Psychology**: For destructive actions (danger variant), use warning
 *   colors and explicit language to prevent accidental confirmation.
 * - **Gestalt Figure-Ground**: Modal overlay creates clear focus by dimming
 *   background content, directing attention to the dialog.
 * - **Fitts's Law**: Buttons should be adequately sized (48pt min) and positioned
 *   for easy thumb reach on mobile devices.
 *
 * @accessibility
 * - Trap focus within modal when open
 * - Add accessibilityRole="alert" for screen readers
 * - Ensure backdrop dismissal option for non-destructive dialogs
 *
 * @see Apple HIG for alert/dialog patterns
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import GlassCard from './GlassCard';
import Colors from '@/constants/Colors';
import PillButton from './PillButton';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'danger' | 'warning';
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
}

export default function ConfirmationDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  icon,
}: ConfirmationDialogProps) {
  const getVariantColor = () => {
    switch (variant) {
      case 'danger':
        return Colors.error;
      case 'warning':
        return Colors.warning;
      default:
        return Colors.primary;
    }
  };

  const getIcon = () => {
    if (icon) return icon;
    switch (variant) {
      case 'danger':
        return 'exclamation-triangle';
      case 'warning':
        return 'exclamation-circle';
      default:
        return 'question-circle';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              <GlassCard style={styles.dialog} padding={24} borderRadius={20}>
                {/* Icon */}
                {icon && (
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: getVariantColor() + '20' },
                    ]}
                  >
                    <FontAwesome
                      name={getIcon() as any}
                      size={32}
                      color={getVariantColor()}
                    />
                  </View>
                )}

                {/* Title */}
                <Text style={styles.title}>{title}</Text>

                {/* Message */}
                <Text style={styles.message}>{message}</Text>

                {/* Actions */}
                <View style={styles.actions}>
                  <PillButton
                    label={cancelLabel}
                    variant="outline"
                    onPress={onCancel}
                    style={styles.cancelButton}
                  />
                  <PillButton
                    label={confirmLabel}
                    variant="primary"
                    onPress={onConfirm}
                    style={[
                      styles.confirmButton,
                      variant === 'danger' && {
                        backgroundColor: Colors.error,
                      },
                      variant === 'warning' && {
                        backgroundColor: Colors.warning,
                      },
                    ]}
                  />
                </View>
              </GlassCard>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
  },
  dialog: {
    width: '100%',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
});
