
/**
 * IVRSupport – Voice/IVR support for visually impaired users
 *
 * Location: buffr/components/IVRSupport.tsx
 * Purpose: Enable balance check, agent list, and basic flows via IVR (SASSA/UPI-style inclusion).
 * References: CONSOLIDATED_PRD FR1.8 (Voice/IVR), Persona 3 (Disabled beneficiary).
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AccessibilityInfo,
  Platform,
} from 'react-native';

export interface IVRSupportProps {
  /** IVR hotline number for *123# alternative */
  ivrHotline?: string;
  /** Callback when user requests "call IVR" */
  onRequestIVR?: () => void;
  /** Whether IVR option is enabled (feature flag) */
  enabled?: boolean;
}

const DEFAULT_IVR_HOTLINE = '0800123456';

export default function IVRSupport({
  ivrHotline = DEFAULT_IVR_HOTLINE,
  onRequestIVR,
  enabled = true,
}: IVRSupportProps) {
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);
  const ref = useRef<View>(null);

  useEffect(() => {
    const sub = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (v) => setIsScreenReaderActive(v)
    );
    AccessibilityInfo.isScreenReaderEnabled().then(setIsScreenReaderActive);
    return () => sub.remove();
  }, []);

  const handlePress = () => {
    if (onRequestIVR) {
      onRequestIVR();
    } else if (ivrHotline) {
      // In a real app, use Linking.openURL(`tel:${ivrHotline}`)
      return;
    }
  };

  if (!enabled) return null;

  return (
    <View
      ref={ref}
      style={styles.container}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Use phone voice service. Call IVR for balance and agent list without using the screen."
      accessibilityHint="Double tap to see IVR phone number or start call"
    >
      <Text style={styles.title}>Voice / IVR support</Text>
      <Text style={styles.description}>
        You can use the phone voice service by calling the IVR hotline. Available in English and
        local languages for balance check, nearest agent, and voucher status.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Call IVR hotline: ${ivrHotline}`}
      >
        <Text style={styles.buttonText}>IVR hotline: {ivrHotline}</Text>
      </TouchableOpacity>
      {isScreenReaderActive && (
        <Text style={styles.srNote}>
          Screen reader is on. For full accessibility, you can also dial *123# for USSD or call
          the IVR number above.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#075985',
    lineHeight: 20,
    marginBottom: 12,
  },
  button: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  srNote: {
    marginTop: 12,
    fontSize: 12,
    color: '#0369a1',
    fontStyle: 'italic',
  },
});
