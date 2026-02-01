/**
 * Toast Notification Component
 *
 * Location: components/common/Toast.tsx
 * Purpose: Reusable toast notification for user feedback
 *
 * Features:
 * - Multiple types: success, error, info, warning
 * - Auto-dismiss after duration
 * - Manual dismiss option
 * - Slide-in animation
 * - Non-blocking overlay
 *
 * @psychology
 * - **Doherty Threshold**: Toast must appear within 100ms of triggering action
 *   to feel instantaneous. Current spring animation (tension: 50, friction: 7)
 *   provides responsive feel. For critical errors, show immediately.
 * - **Serial Position Effect**: Position at top (primacy) or bottom (recency)
 *   of screen for maximum memorability. Current slide-from-top leverages primacy.
 * - **Von Restorff Effect**: Color-coded types (success: green, error: red)
 *   create distinct, memorable feedback. Icons reinforce message type.
 * - **Cognitive Load**: Keep messages concise (1 line preferred). Auto-dismiss
 *   (3000ms default) prevents cognitive overload from persistent notifications.
 *
 * @timing
 * - Entrance: 300ms parallel animation (slide + opacity)
 * - Exit: 250ms animation before calling onDismiss
 * - Auto-dismiss: 3000ms default (0 = manual dismiss only)
 *
 * @accessibility
 * - Add `accessibilityLiveRegion="polite"` for screen readers
 * - Ensure sufficient contrast for all toast types
 *
 * @see .cursorrules for Doherty Threshold guidelines
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number; // Auto-dismiss duration in ms (0 = no auto-dismiss)
  onDismiss?: () => void;
  visible: boolean;
}

export default function Toast({
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
  visible,
}: ToastProps) {
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      handleDismiss();
    }
  }, [visible, duration]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: Colors.success,
          icon: 'check-circle' as const,
        };
      case 'error':
        return {
          backgroundColor: Colors.error,
          icon: 'exclamation-circle' as const,
        };
      case 'warning':
        return {
          backgroundColor: Colors.warning,
          icon: 'exclamation-triangle' as const,
        };
      case 'info':
      default:
        return {
          backgroundColor: Colors.info,
          icon: 'info-circle' as const,
        };
    }
  };

  const typeStyles = getTypeStyles();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.toast, { backgroundColor: typeStyles.backgroundColor }]}>
        <FontAwesome
          name={typeStyles.icon}
          size={20}
          color={Colors.white}
          style={styles.icon}
        />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.dismissButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesome name="times" size={16} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    minHeight: 48,
    maxWidth: '90%',
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.white,
    lineHeight: 20,
  },
  dismissButton: {
    marginLeft: 12,
    padding: 4,
  },
});
