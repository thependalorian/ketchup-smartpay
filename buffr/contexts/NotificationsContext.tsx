/**
 * Notifications Context
 * 
 * Location: contexts/NotificationsContext.tsx
 * Purpose: Global state management for notifications
 * 
 * Provides notifications data and methods to fetch, update, and manage notifications
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import logger, { log } from '@/utils/logger';

// Notification interface
export interface Notification {
  id: string;
  type: 'transaction' | 'request' | 'group' | 'loan' | 'system' | 'security' | 'promotion';
  title: string;
  message: string;
  read: boolean;
  date: Date;
  actionUrl?: string; // Deep link or route path
  actionData?: any; // Additional data for the action
  icon?: string; // FontAwesome icon name
  priority?: 'low' | 'normal' | 'high';
  category?: string; // For grouping/filtering
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  getNotificationById: (id: string) => Notification | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// Fetch notifications from API - returns empty array on error (no mock data)
const fetchNotificationsFromAPI = async (): Promise<Notification[]> => {
  try {
    const { apiGet } = await import('@/utils/apiClient');
    const response = await apiGet<Array<{
      id: string;
      type: 'transaction' | 'request' | 'group' | 'loan' | 'system' | 'security' | 'promotion';
      title: string;
      message: string;
      read: boolean;
      created_at?: string;
      date?: string;
      action_url?: string;
      actionUrl?: string;
      action_data?: any;
      actionData?: any;
      icon?: string;
      priority?: 'low' | 'normal' | 'high';
      category?: string;
    }>>('/notifications');
    
    // Ensure response is an array before mapping
    if (!response || !Array.isArray(response)) {
      logger.warn('Notifications API returned invalid format:', { response });
      return [];
    }
    
    return response.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      date: new Date(n.created_at || n.date || new Date().toISOString()),
      actionUrl: n.action_url || n.actionUrl,
      actionData: n.action_data || n.actionData,
      icon: n.icon,
      priority: n.priority,
      category: n.category,
    }));
  } catch (error) {
    log.error('Error fetching notifications from API:', error);
    // Return empty array for offline mode - no mock data
    return [];
  }
};

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to use API client if available, otherwise use mock
      try {
        const { apiGet } = await import('@/utils/apiClient');
        const notifications = await apiGet<Notification[]>('/notifications');
        
        // Ensure notifications is an array
        if (!notifications || !Array.isArray(notifications)) {
          logger.warn('Notifications API returned invalid format:', { notifications });
          setNotifications([]);
          return;
        }
        
        setNotifications(notifications.map(n => ({
          ...n,
          date: n.date instanceof Date ? n.date : new Date(n.date),
        })));
      } catch (apiError) {
        // Fallback to fetchNotificationsFromAPI if API client fails
        const data = await fetchNotificationsFromAPI();
        setNotifications(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notifications');
      log.error('Error fetching notifications:', err);
      setNotifications([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Get notification by ID
  const getNotificationById = useCallback(
    (id: string): Notification | null => {
      return notifications.find((n) => n.id === id) || null;
    },
    [notifications]
  );

  // Mark notification as read
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        // Try to use API client if available
        try {
          const { apiPut } = await import('@/utils/apiClient');
          await apiPut(`/notifications/${id}`, { action: 'read' });
        } catch (apiError) {
          // Fallback if API is not available - silently continue with local state update
        }
        
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      } catch (err: any) {
        log.error('Error marking notification as read:', err);
      }
    },
    []
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      // In a real app, call API to mark all as read
      // await markAllNotificationsAsReadAPI();
      
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err: any) {
      log.error('Error marking all notifications as read:', err);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        // Try to use API client if available
        try {
          const { apiDelete } = await import('@/utils/apiClient');
          await apiDelete(`/notifications/${id}`);
        } catch (apiError) {
          // Fallback if API is not available - silently continue with local state update
        }
        
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      } catch (err: any) {
        log.error('Error deleting notification:', err);
      }
    },
    []
  );

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      // In a real app, call API to clear all notifications
      // await clearAllNotificationsAPI();
      
      setNotifications([]);
    } catch (err: any) {
      log.error('Error clearing all notifications:', err);
    }
  }, []);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Add notification (for local notifications, push notifications, etc.)
  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'date' | 'read'>) => {
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        date: new Date(),
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    },
    []
  );

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        getNotificationById,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        refreshNotifications,
        addNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
