/**
 * Detail View Layout Component
 * 
 * Location: components/layouts/DetailViewLayout.tsx
 * Purpose: Reusable layout wrapper for detail screens (Transaction Receipt, Loan Details, Group View)
 * 
 * Features:
 * - Header with optional actions
 * - Content sections (GlassCard)
 * - Action buttons footer
 * - Loading/error states
 * - Real estate planning
 */

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import ScreenHeader from '@/components/common/ScreenHeader';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';

interface DetailViewLayoutProps {
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  emptyState?: {
    icon: React.ComponentProps<typeof FontAwesome>['name'];
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  };
  scrollContentStyle?: any;
}

export default function DetailViewLayout({
  title,
  children,
  onBack,
  rightAction,
  footer,
  loading = false,
  error = null,
  emptyState,
  scrollContentStyle,
}: DetailViewLayoutProps) {
  // Loading state
  if (loading) {
    return (
      <View style={defaultStyles.container}>
        <ScreenHeader
          title={title}
          showBackButton={!!onBack}
          onBack={onBack}
          rightAction={rightAction}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={defaultStyles.container}>
        <ScreenHeader
          title={title}
          showBackButton={!!onBack}
          onBack={onBack}
          rightAction={rightAction}
        />
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          {emptyState?.onAction && (
            <Text style={styles.retryButton} onPress={emptyState.onAction}>
              Retry
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Empty state
  if (emptyState) {
    return (
      <View style={defaultStyles.container}>
        <ScreenHeader
          title={title}
          showBackButton={!!onBack}
          onBack={onBack}
          rightAction={rightAction}
        />
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={emptyState.icon}
            title={emptyState.title}
            message={emptyState.message}
            actionLabel={emptyState.actionLabel}
            onAction={emptyState.onAction}
          />
        </View>
      </View>
    );
  }

  // Content state
  return (
    <View style={defaultStyles.container}>
      <ScreenHeader
        title={title}
        showBackButton={!!onBack}
        onBack={onBack}
        rightAction={rightAction}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          scrollContentStyle,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: SECTION_SPACING,
    paddingBottom: SECTION_SPACING * 2,
  },
  footer: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  errorMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
  },
});
