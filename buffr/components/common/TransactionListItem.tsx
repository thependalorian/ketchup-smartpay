/**
 * Transaction List Item Component
 *
 * Location: components/common/TransactionListItem.tsx
 * Purpose: Reusable transaction list item with icon, amount, description, date, and status
 *
 * Features:
 * - Category-based icon
 * - Title and description
 * - Amount with color coding (green for received, red for sent)
 * - Date/time display
 * - Optional status badge
 * - Clickable with onPress handler
 *
 * @psychology
 * - **Serial Position Effect**: Recent transactions appear first (recency),
 *   matching user expectation to see latest activity. Date grouping
 *   (Today, Yesterday) leverages primacy for temporal context.
 * - **Color Psychology**: Green for income/received (positive, gain) and
 *   red for expenses/sent (attention, outflow) creates instant recognition
 *   of transaction direction without reading text.
 * - **Gestalt Proximity**: Icon, description, recipient, and amount grouped
 *   together in a single row clearly associate all transaction details.
 * - **Cognitive Load Reduction**: Category icons (food, transport, shopping)
 *   provide visual categorization, reducing need to read descriptions.
 *   Icon + color dual-coding reinforces meaning.
 * - **Trust Psychology**: Status badges for pending/failed transactions
 *   build trust by keeping users informed of transaction state.
 * - **Relative Time**: "Today", "Yesterday", "2d ago" is easier to process
 *   than absolute dates, reducing cognitive load for recent items.
 *
 * @accessibility
 * - Amount changes should be announced with transaction type
 * - Color should not be only indicator - icons provide redundancy
 * - Touch target includes full row for easy selection
 *
 * @see StatusBadge for transaction status display
 */

import React, { memo, useMemo } from 'react';
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
import StatusBadge from './StatusBadge';
import Colors from '@/constants/Colors';
import { Transaction } from '@/contexts/TransactionsContext';
import { HORIZONTAL_PADDING, SECTION_SPACING, CARD_GAP } from '@/constants/Layout';

interface TransactionListItemProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
  showStatus?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * TransactionListItem Component (Memoized)
 *
 * Performance: Wrapped with React.memo to prevent re-renders when
 * parent list re-renders. Uses custom comparison to only re-render when:
 * - transaction.id changes
 * - transaction.status changes
 * - transaction.amount changes
 * - onPress reference changes
 */
const TransactionListItem = memo(function TransactionListItem({
  transaction,
  onPress,
  showStatus = true,
  style,
}: TransactionListItemProps) {
  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'sent':
      case 'transfer':
        return 'arrow-up';
      case 'received':
      case 'payment':
        return 'arrow-down';
      case 'request':
        return 'hand-paper-o';
      default:
        return 'exchange';
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'sent':
      case 'transfer':
        return Colors.error;
      case 'received':
      case 'payment':
        return Colors.success;
      default:
        return Colors.textSecondary;
    }
  };

  const getCategoryIcon = (category?: string) => {
    if (!category) return getTransactionIcon(transaction.type);
    
    // Map category IDs to icons
    const categoryIcons: { [key: string]: string } = {
      '1': 'cutlery', // Food & Beverages
      '2': 'car', // Transportation
      '3': 'shopping-bag', // Shopping
      '4': 'bolt', // Bills & Utilities
      '5': 'heart', // Health & Fitness
      '6': 'briefcase', // Salary
      '7': 'code', // Freelance
      '8': 'gift', // Gifts
      '9': 'home', // Rent
      '10': 'money', // Other Income
    };
    
    return categoryIcons[category] || getTransactionIcon(transaction.type);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatAmount = (amount: number, type: Transaction['type']) => {
    const sign = type === 'sent' || type === 'transfer' ? '-' : '+';
    return `${sign}N$ ${Math.abs(amount).toFixed(2)}`;
  };

  const iconName = getCategoryIcon(transaction.category) as any;
  const iconColor = getTransactionColor(transaction.type);
  const amountText = formatAmount(transaction.amount, transaction.type);
  const amountColor = transaction.type === 'sent' || transaction.type === 'transfer'
    ? Colors.error
    : Colors.success;

  const content = (
    <GlassCard style={[styles.container, style]} padding={16} borderRadius={16}>  // ✅ buffr-mobile style
      <View style={styles.content}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: iconColor + '20' },
          ]}
        >
          <FontAwesome name={iconName} size={20} color={iconColor} />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {transaction.description}
            </Text>
            {showStatus && transaction.status !== 'completed' && (
              <StatusBadge
                status={transaction.status}
                style={styles.statusBadge}
              />
            )}
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {formatDate(transaction.date)} • {formatTime(transaction.date)}
            </Text>
            {transaction.recipient && (
              <Text style={styles.recipientText}>
                {transaction.type === 'sent' ? 'To: ' : 'From: '}
                {transaction.recipient}
              </Text>
            )}
          </View>
        </View>

        {/* Amount */}
        <View style={styles.amountContainer}>
          <Text style={[styles.amount, { color: amountColor }]}>
            {amountText}
          </Text>
        </View>
      </View>
    </GlassCard>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={() => onPress(transaction)} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}, (prevProps, nextProps) => {
  // Custom comparison for performance
  // Only re-render if these specific props change
  return (
    prevProps.transaction.id === nextProps.transaction.id &&
    prevProps.transaction.status === nextProps.transaction.status &&
    prevProps.transaction.amount === nextProps.transaction.amount &&
    prevProps.showStatus === nextProps.showStatus &&
    prevProps.onPress === nextProps.onPress
  );
});

export default TransactionListItem;

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CARD_GAP,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  statusBadge: {
    marginLeft: 'auto',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  recipientText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
});
