/**
 * Group List Item Component
 *
 * Location: components/common/GroupListItem.tsx
 * Purpose: Reusable group list item with icon, name, total amount, member count, and progress
 *
 * Features:
 * - Group icon
 * - Group name
 * - Total amount
 * - Member count
 * - Progress indicator (optional)
 * - Clickable with onPress handler
 *
 * @psychology
 * - **Goal-Gradient Effect**: Progress bar (when shown) creates motivation
 *   as groups approach their target. Users become more engaged as progress
 *   increases - consider animated fill for celebration moments.
 * - **Gestalt Similarity**: Consistent layout (icon, name, amount, members)
 *   enables fast scanning across multiple groups.
 * - **Social Proof**: Member count ("3 members") provides social validation
 *   that others are participating, encouraging engagement.
 * - **Trust Psychology**: Displaying total amount and target builds
 *   transparency, showing exactly where the group stands financially.
 * - **Color Association**: Custom group colors create identity and quick
 *   visual differentiation between different savings groups.
 * - **Cognitive Load**: Progress percentage shown as text reinforces the
 *   visual progress bar, providing redundant encoding for clarity.
 *
 * @accessibility
 * - Progress bar needs accessibilityValue with current/max values
 * - Member count should read naturally ("3 members" vs "3")
 * - Amount should include currency context for screen readers
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

export interface Group {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  totalAmount: number;
  targetAmount?: number;
  memberCount: number;
  currency?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface GroupListItemProps {
  group: Group;
  onPress?: (group: Group) => void;
  showProgress?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function GroupListItem({
  group,
  onPress,
  showProgress = false,
  style,
}: GroupListItemProps) {
  const getGroupIcon = (icon?: string) => {
    return (icon as any) || 'users';
  };

  const formatAmount = (amount: number, currency: string = 'N$') => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  const progress = group.targetAmount
    ? (group.totalAmount / group.targetAmount) * 100
    : 0;

  const content = (
    <GlassCard style={[styles.container, style]} padding={16} borderRadius={16}>  // ✅ buffr-mobile style
      <View style={styles.content}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: (group.color || Colors.primary) + '20' },
          ]}
        >
          <FontAwesome
            name={getGroupIcon(group.icon)}
            size={20}
            color={group.color || Colors.primary}
          />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {group.name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.amount}>
              {formatAmount(group.totalAmount, group.currency)}
            </Text>
            <Text style={styles.memberCount}>
              {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
            </Text>
          </View>
          {showProgress && group.targetAmount && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(progress, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(progress)}% of {formatAmount(group.targetAmount, group.currency)}
              </Text>
            </View>
          )}
        </View>

        {/* Arrow */}
        {onPress && (
          <FontAwesome
            name="chevron-right"
            size={16}
            color={Colors.textSecondary}
          />
        )}
      </View>
    </GlassCard>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={() => onPress(group)} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  memberCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
