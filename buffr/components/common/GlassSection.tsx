/**
 * Glass Section Component
 *
 * Location: components/common/GlassSection.tsx
 * Purpose: Reusable section wrapper with glass effect, title, and optional action button
 *
 * Features:
 * - Section wrapper with glass effect
 * - Section title
 * - Optional action button
 * - Consistent spacing
 * - Children content support
 *
 * @psychology
 * - **Gestalt Proximity**: Groups related content under a single section heading,
 *   signaling that all enclosed elements belong together conceptually.
 * - **Gestalt Figure-Ground**: Glass effect creates elevated surface that visually
 *   separates section content from background, establishing hierarchy.
 * - **Serial Position Effect**: Section title at top creates primacy effect,
 *   ensuring users understand content context before scanning items.
 * - **Fitts's Law**: Action button (when present) should be easily tappable.
 *   Ensure minimum 44pt touch target for action areas.
 * - **Cognitive Load**: Section structure reduces mental effort by providing
 *   clear content organization and predictable patterns.
 *
 * @accessibility
 * - Use semantic heading levels for screen readers
 * - Ensure action buttons have accessibilityLabel
 *
 * @see GlassCard for underlying glass morphism implementation
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
import { SECTION_SPACING } from '@/constants/Layout';

export interface GlassSectionProps {
  title: string;
  children: React.ReactNode;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  icon?: string;
  rightComponent?: React.ReactNode;
}

export default function GlassSection({
  title,
  children,
  actionLabel,
  onActionPress,
  style,
  contentStyle,
  icon,
  rightComponent,
}: GlassSectionProps) {
  return (
    <GlassCard style={[styles.container, style]} padding={0} borderRadius={16}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {icon && (
            <FontAwesome
              name={icon as any}
              size={18}
              color={Colors.primary}
              style={styles.icon}
            />
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
        {rightComponent || (actionLabel && onActionPress && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onActionPress}
            activeOpacity={0.7}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
            <FontAwesome
              name="chevron-right"
              size={14}
              color={Colors.primary}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SECTION_SPACING,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  content: {
    padding: 16,
  },
});
