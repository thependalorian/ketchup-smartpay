/**
 * Info Card Component
 *
 * Location: components/common/InfoCard.tsx
 * Purpose: Reusable info card with icon, title, description, and optional action
 *
 * Features:
 * - Icon + title + description layout
 * - Optional action button
 * - Glass effect
 * - Clickable option
 * - Consistent spacing
 *
 * @psychology
 * - **Cognitive Load Reduction**: Icon + text dual-coding reinforces message
 *   meaning. Users process visual icons faster than text alone.
 * - **Gestalt Proximity**: Icon, title, and description grouped together (12px gap)
 *   clearly indicate they form a single informational unit.
 * - **Color Psychology**: Variant colors create instant emotional context:
 *   - Success (green) → Positive confirmation
 *   - Warning (yellow) → Caution needed
 *   - Error (red) → Problem requiring attention
 *   - Info (blue) → Neutral information
 * - **Progressive Disclosure**: Action button (when present) offers next step
 *   without cluttering the primary message.
 * - **Jakob's Law**: Card with icon follows notification patterns users know
 *   from iOS/Android, creating familiar information architecture.
 *
 * @accessibility
 * - Icon should have accessibilityLabel matching title context
 * - Action button needs clear accessibilityHint
 * - Ensure text contrast against glass background
 *
 * @see GlassCard for card styling
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import GlassCard from './GlassCard';
import Colors from '@/constants/Colors';

export interface InfoCardProps {
  icon: string;
  title: string;
  description?: string;
  message?: string; // Alias for description
  actionLabel?: string;
  onPress?: () => void;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
  iconColor?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  type?: string; // Additional type prop
}

export default function InfoCard({
  icon,
  title,
  description,
  message,
  actionLabel,
  onPress,
  onActionPress,
  style,
  iconColor,
  variant = 'default',
  type,
}: InfoCardProps) {
  // Use message as fallback for description
  const displayDescription = description || message;
  const getVariantColor = () => {
    switch (variant) {
      case 'success':
        return Colors.success;
      case 'warning':
        return Colors.warning;
      case 'error':
        return Colors.error;
      case 'info':
        return Colors.info;
      default:
        return iconColor || Colors.primary;
    }
  };

  const content = (
    <GlassCard style={[styles.container, style]} padding={16} borderRadius={16}>
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getVariantColor() + '20' },
          ]}
        >
          <FontAwesome
            name={icon as any}
            size={24}
            color={getVariantColor()}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {displayDescription && <Text style={styles.description}>{displayDescription}</Text>}
        </View>
        {actionLabel && onActionPress && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onActionPress}
            activeOpacity={0.7}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </GlassCard>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
