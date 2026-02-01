/**
 * Notification Item Component
 *
 * Location: components/common/NotificationItem.tsx
 * Purpose: Reusable notification list item with icon, title, message, date, and actions
 *
 * Features:
 * - Type-based icon
 * - Title and message
 * - Date/time display
 * - Read/unread indicator
 * - Swipe actions (optional)
 * - Clickable with onPress handler
 *
 * @psychology
 * - **Serial Position Effect**: Recent notifications at top leverage recency.
 *   Users expect to see newest alerts first, matching mental model.
 * - **Von Restorff Effect**: Unread notifications stand out with bold title,
 *   blue dot indicator, and left border accent - multiple visual cues for
 *   attention without overwhelming.
 * - **Doherty Threshold**: Relative timestamps ("5m ago", "2h ago") provide
 *   immediate temporal context without cognitive processing of dates.
 * - **Color Psychology**: Type-based icon colors create instant recognition:
 *   - Green (transaction) → Money received
 *   - Yellow (request) → Action needed
 *   - Red (security) → Urgent attention
 *   - Blue (info) → Neutral update
 * - **Cognitive Load**: Message truncation (2 lines) prevents overwhelming
 *   users while still providing enough context to understand importance.
 * - **User Control**: Mark-as-read and delete actions give users agency
 *   over their notification state, reducing inbox anxiety.
 *
 * @accessibility
 * - Unread state should be announced by screen readers
 * - Action buttons need accessibilityLabels
 * - Time should be readable with appropriate context
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
import { Notification } from '@/contexts/NotificationsContext';

interface NotificationItemProps {
  notification: Notification;
  onPress?: (notification: Notification) => void;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  style?: StyleProp<ViewStyle>;
}

export default function NotificationItem({
  notification,
  onPress,
  onMarkAsRead,
  onDelete,
  style,
}: NotificationItemProps) {
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'transaction':
        return 'exchange';
      case 'request':
        return 'hand-paper-o';
      case 'group':
        return 'users';
      case 'loan':
        return 'money';
      case 'system':
        return 'info-circle';
      case 'security':
        return 'shield';
      case 'promotion':
        return 'gift';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'transaction':
        return Colors.success;
      case 'request':
        return Colors.warning;
      case 'group':
        return Colors.primary;
      case 'loan':
        return Colors.info;
      case 'system':
        return Colors.textSecondary;
      case 'security':
        return Colors.error;
      case 'promotion':
        return Colors.primary;
      default:
        return Colors.textSecondary;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const iconName = getNotificationIcon(notification.type) as any;
  const iconColor = getNotificationColor(notification.type);

  const content = (
    <GlassCard
      style={[
        styles.container,
        !notification.read && styles.unreadContainer,
        style,
      ]}
      padding={16}
      borderRadius={12}
    >
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
            <Text
              style={[
                styles.title,
                !notification.read && styles.unreadTitle,
              ]}
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            {!notification.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>
          <Text style={styles.date}>{formatDate(notification.date)}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {!notification.read && onMarkAsRead && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              activeOpacity={0.7}
            >
              <FontAwesome name="check" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              activeOpacity={0.7}
            >
              <FontAwesome name="trash" size={16} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </GlassCard>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={() => onPress(notification)}
        activeOpacity={0.7}
      >
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
  unreadContainer: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundGray,
  },
});
