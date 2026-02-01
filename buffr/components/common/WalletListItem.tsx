/**
 * Wallet List Item Component
 *
 * Location: components/common/WalletListItem.tsx
 * Purpose: Reusable wallet list item with icon, name, balance, and quick actions
 *
 * Features:
 * - Wallet icon/color
 * - Wallet name
 * - Balance display
 * - Quick actions (optional)
 * - Clickable with onPress handler
 *
 * @psychology
 * - **Gestalt Similarity**: All wallet items share identical structure (icon,
 *   name, balance, chevron) enabling fast scanning and pattern recognition.
 * - **Gestalt Figure-Ground**: GlassCard creates elevated surface, separating
 *   wallet item from background and establishing visual hierarchy.
 * - **Color Association**: Custom wallet colors (via color prop) create
 *   personal connection and quick visual identification across the app.
 * - **Trust Psychology**: Prominently displayed balance builds confidence
 *   that financial information is accessible and accurate.
 * - **Jakob's Law**: Chevron (→) follows iOS convention indicating the item
 *   leads to more detail. Users expect tap to navigate to wallet details.
 * - **Fitts's Law**: Full-row touch target makes selection easy. Action
 *   buttons (36x36) meet minimum touch target requirements.
 *
 * @accessibility
 * - Balance should be readable by screen readers with currency context
 * - Wallet color should not be only differentiator - name and icon help
 * - Touch targets meet 44pt minimum for action buttons
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
import { Wallet } from '@/contexts/WalletsContext';

interface WalletListItemProps {
  wallet: Wallet;
  onPress?: (wallet: Wallet) => void;
  showBalance?: boolean;
  showActions?: boolean;
  actions?: {
    icon: string;
    label: string;
    onPress: () => void;
    color?: string;
  }[];
  style?: StyleProp<ViewStyle>;
}

export default function WalletListItem({
  wallet,
  onPress,
  showBalance = true,
  showActions = false,
  actions = [],
  style,
}: WalletListItemProps) {
  const getWalletIcon = (icon?: string) => {
    return (icon as any) || 'wallet';
  };

  const formatBalance = (balance: number, currency: string = 'N$') => {
    return `${currency} ${balance.toFixed(2)}`;
  };

  const content = (
    <GlassCard style={[styles.container, style]} padding={16} borderRadius={16}>  // ✅ buffr-mobile style
      <View style={styles.content}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: wallet.color + '20' },
          ]}
        >
          <FontAwesome
            name={getWalletIcon(wallet.icon)}
            size={20}
            color={wallet.color || Colors.primary}
          />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {wallet.name}
          </Text>
          {showBalance && (
            <Text style={styles.balance}>
              {formatBalance(wallet.balance, wallet.currency)}
            </Text>
          )}
        </View>

        {/* Actions or Arrow */}
        {showActions && actions.length > 0 ? (
          <View style={styles.actionsContainer}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  action.onPress();
                }}
                activeOpacity={0.7}
              >
                <FontAwesome
                  name={action.icon as any}
                  size={18}
                  color={action.color || Colors.primary}
                />
              </TouchableOpacity>
            ))}
          </View>
        ) : onPress ? (
          <FontAwesome
            name="chevron-right"
            size={16}
            color={Colors.textSecondary}
          />
        ) : null}
      </View>
    </GlassCard>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={() => onPress(wallet)} activeOpacity={0.7}>
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
  balance: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundGray,
  },
});
