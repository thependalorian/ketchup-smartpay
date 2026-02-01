/**
 * Loading Overlay Component
 *
 * Location: components/common/LoadingOverlay.tsx
 * Purpose: Full-screen or overlay loading indicator
 *
 * Features:
 * - Full-screen or overlay loading
 * - Optional message
 * - Blur background option
 * - Non-blocking option
 *
 * @psychology
 * - **Doherty Threshold**: Show loading overlay immediately (<100ms) when
 *   operations take >400ms. Immediate feedback prevents users from feeling
 *   the system is unresponsive or broken.
 * - **Cognitive Load Reduction**: Optional message provides context about
 *   what's happening, reducing user anxiety during wait. Use specific messages
 *   like "Processing payment..." rather than generic "Loading...".
 * - **Trust Psychology**: Visible loading state builds trust by confirming
 *   the action is being processed. For financial operations, this is critical.
 * - **Aesthetic-Usability**: Blur background maintains visual continuity
 *   while focusing attention on the loading state.
 *
 * @timing
 * - Show after 100ms delay for fast operations (prevents flash)
 * - Always show for operations expected to take >500ms
 * - Include spinner animation that starts immediately
 *
 * @accessibility
 * - Add accessibilityRole="progressbar"
 * - Announce loading state to screen readers
 *
 * @see constants/Shadows.ts for modal shadow styling
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Colors from '@/constants/Colors';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  fullScreen?: boolean;
  blurBackground?: boolean;
}

export default function LoadingOverlay({
  visible,
  message,
  fullScreen = false,
  blurBackground = true,
}: LoadingOverlayProps) {
  if (fullScreen) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
      >
        {blurBackground ? (
          <BlurView intensity={80} tint="light" style={styles.fullScreen}>
            <View style={styles.content}>
              <ActivityIndicator size="large" color={Colors.primary} />
              {message && <Text style={styles.message}>{message}</Text>}
            </View>
          </BlurView>
        ) : (
          <View style={[styles.fullScreen, styles.overlay]}>
            <View style={styles.content}>
              <ActivityIndicator size="large" color={Colors.primary} />
              {message && <Text style={styles.message}>{message}</Text>}
            </View>
          </View>
        )}
      </Modal>
    );
  }

  if (!visible) return null;

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={Colors.primary} />
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9998,
  },
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    minHeight: 120,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
});
