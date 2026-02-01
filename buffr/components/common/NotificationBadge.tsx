/**
 * Notification Badge Component
 *
 * Location: components/common/NotificationBadge.tsx
 * Purpose: Badge showing unread notification count
 *
 * Features:
 * - Unread count display
 * - Auto-hides when count is 0
 * - Customizable size and position
 * - Animated appearance
 *
 * @psychology
 * - **Von Restorff Effect**: Red badge color stands out against any background,
 *   immediately drawing attention to unread notifications.
 * - **Urgency Psychology**: Red color triggers urgency, encouraging users to
 *   check notifications. Used sparingly to maintain effectiveness.
 * - **Cognitive Load**: "99+" for high counts reduces cognitive burden vs
 *   showing exact numbers. Users understand "many" without processing digits.
 * - **Progressive Disclosure**: Badge hides when count is 0, reducing visual
 *   noise when there's nothing requiring attention.
 * - **Zeigarnik Effect**: Visible notification count creates sense of
 *   incompleteness, motivating users to clear unread items.
 * - **Positioning**: Top-right placement follows iOS/Android conventions for
 *   badge positioning on icons.
 *
 * @accessibility
 * - Badge should have accessibilityLabel like "5 unread notifications"
 * - Don't rely on color alone - number provides meaning
 * - Consider accessibilityLiveRegion for count updates
 *
 * @see NotificationItem for notification list items
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

interface NotificationBadgeProps {
  count: number;
  maxCount?: number; // Max count to display (e.g., 99+)
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export default function NotificationBadge({
  count,
  maxCount = 99,
  size = 'medium',
  style,
}: NotificationBadgeProps) {
  if (count === 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const sizeStyles = {
    small: {
      minWidth: 16,
      height: 16,
      fontSize: 10,
      paddingHorizontal: 4,
    },
    medium: {
      minWidth: 20,
      height: 20,
      fontSize: 12,
      paddingHorizontal: 6,
    },
    large: {
      minWidth: 24,
      height: 24,
      fontSize: 14,
      paddingHorizontal: 8,
    },
  };

  return (
    <View
      style={[
        styles.badge,
        sizeStyles[size],
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: sizeStyles[size].fontSize }]}>
        {displayCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -4,
    right: -4,
  },
  text: {
    color: Colors.white,
    fontWeight: '700',
    textAlign: 'center',
  },
});
