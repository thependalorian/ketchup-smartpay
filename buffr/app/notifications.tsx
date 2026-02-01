/**
 * Notifications Screen
 * 
 * Location: app/notifications.tsx
 * Purpose: Display all notifications with filtering and actions
 * 
 * Features:
 * - List of all notifications
 * - Filter by type (All, Unread, Transaction, Request, etc.)
 * - Mark as read / Mark all as read
 * - Delete notification
 * - Pull to refresh
 * - Empty state
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { NotificationItem } from '@/components/common';
import { ListViewLayout } from '@/components/layouts';
import { useNotifications , Notification } from '@/contexts/NotificationsContext';
import Colors from '@/constants/Colors';

type FilterType = 'all' | 'unread' | 'transaction' | 'request' | 'group' | 'loan' | 'system' | 'security';

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  // Handle pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  }, [refreshNotifications]);

  // Handle notification press
  const handleNotificationPress = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      router.push(notification.actionUrl as any);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    Alert.alert(
      'Mark All as Read',
      'Are you sure you want to mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All',
          onPress: () => markAllAsRead(),
        },
      ]
    );
  };

  // Handle delete notification
  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteNotification(id),
        },
      ]
    );
  };

  // Filter buttons
  const filterButtons: { label: string; value: FilterType; count?: number }[] = [
    { label: 'All', value: 'all' },
    { label: 'Unread', value: 'unread', count: unreadCount },
    { label: 'Transactions', value: 'transaction' },
    { label: 'Requests', value: 'request' },
    { label: 'Groups', value: 'group' },
    { label: 'Loans', value: 'loan' },
    { label: 'System', value: 'system' },
    { label: 'Security', value: 'security' },
  ];

  return (
    <ListViewLayout
      title="Notifications"
      onBack={() => router.back()}
      rightAction={
        unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllAsRead} activeOpacity={0.7}>
            <Text style={styles.markAllText}>Mark All</Text>
          </TouchableOpacity>
        ) : null
      }
      refreshing={refreshing || loading}
      onRefresh={onRefresh}
      emptyState={
        filteredNotifications.length === 0
          ? {
              icon: 'bell',
              title: 'No Notifications',
              message:
                filter === 'unread'
                  ? 'You have no unread notifications'
                  : filter === 'all'
                  ? 'You have no notifications yet'
                  : `You have no ${filter} notifications`,
            }
          : undefined
      }
      scrollContentStyle={styles.scrollContent}
    >
      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filterButtons.map((button) => (
          <TouchableOpacity
            key={button.value}
            style={[
              styles.filterButton,
              filter === button.value && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(button.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === button.value && styles.filterButtonTextActive,
              ]}
            >
              {button.label}
            </Text>
            {button.count !== undefined && button.count > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{button.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Notifications List */}
      <View style={styles.notificationsList}>
        {filteredNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onPress={handleNotificationPress}
            onMarkAsRead={markAsRead}
            onDelete={handleDelete}
          />
        ))}
      </View>
    </ListViewLayout>
  );
}

const styles = StyleSheet.create({
  markAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  notificationsList: {
    gap: 0,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});
