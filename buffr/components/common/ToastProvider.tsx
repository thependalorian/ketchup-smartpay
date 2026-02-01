/**
 * Toast Provider Component
 *
 * Location: components/common/ToastProvider.tsx
 * Purpose: Global toast notification provider with context
 *
 * Features:
 * - Global toast state management
 * - Show toast from anywhere in the app
 * - Queue management for multiple toasts
 * - Auto-dismiss handling
 *
 * @psychology
 * - **Doherty Threshold**: Immediate feedback via toast confirms user actions
 *   without page navigation. Response time <400ms maintains flow state.
 * - **Non-Blocking Feedback**: Toasts overlay content without blocking
 *   interaction, respecting user control and momentum.
 * - **Trust Psychology**: Confirmation toasts ("Payment sent!") build
 *   confidence that actions completed successfully.
 * - **Cognitive Load**: Brief messages (3 seconds default) deliver essential
 *   feedback without demanding prolonged attention.
 * - **Jakob's Law**: Toast pattern familiar from Android/web apps. Users
 *   expect temporary, dismissible notifications.
 * - **Context Architecture**: Global provider enables any component to
 *   trigger toasts without prop drilling or complex state management.
 *
 * @development
 * - Use showToast('message', 'success') for confirmations
 * - Use showToast('message', 'error') for failures
 * - Adjust duration for message length/importance
 *
 * @accessibility
 * - Toast should be announced with accessibilityRole="alert"
 * - Auto-dismiss duration should allow reading (min 3 seconds)
 * - Consider accessibilityLiveRegion for dynamic announcements
 *
 * @see Toast for individual toast component
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Toast, { ToastType } from './Toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export default function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    duration: number;
    visible: boolean;
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3000) => {
      setToast({
        message,
        type,
        duration,
        visible: true,
      });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast((prev) => (prev ? { ...prev, visible: false } : null));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          visible={toast.visible}
          onDismiss={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
}
