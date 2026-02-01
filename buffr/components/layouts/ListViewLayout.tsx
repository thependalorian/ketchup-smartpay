/**
 * List View Layout Component
 * 
 * Location: components/layouts/ListViewLayout.tsx
 * Purpose: Reusable layout wrapper for list/grid screens (Contacts, Wallets, Cards)
 * 
 * Features:
 * - Header with search
 * - List/Grid container
 * - Empty state handling
 * - Pull to refresh
 * - Loading states
 * - Add button support
 */

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import ScreenHeader from '@/components/common/ScreenHeader';
import GlassCard from '@/components/common/GlassCard';
import EmptyState from '@/components/common/EmptyState';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';

interface ListViewLayoutProps {
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  searchBar?: {
    placeholder?: string;
    value: string;
    onChangeText: (text: string) => void;
    onClear?: () => void;
  };
  addButton?: {
    label: string;
    onPress: () => void;
    icon?: React.ComponentProps<typeof FontAwesome>['name'];
  };
  emptyState?: {
    icon: React.ComponentProps<typeof FontAwesome>['name'];
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  };
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  scrollContentStyle?: any;
}

export default function ListViewLayout({
  title,
  children,
  onBack,
  rightAction,
  searchBar,
  addButton,
  emptyState,
  loading = false,
  refreshing = false,
  onRefresh,
  scrollContentStyle,
}: ListViewLayoutProps) {
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
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          ) : undefined
        }
      >
        {/* Search Bar */}
        {searchBar && (
          <View style={styles.searchCard}>
            <TextInput
              style={styles.searchInput}
              placeholder={searchBar.placeholder || 'Search...'}
              placeholderTextColor={Colors.textSecondary}
              value={searchBar.value}
              onChangeText={searchBar.onChangeText}
            />
            {searchBar.value.length > 0 && searchBar.onClear && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={searchBar.onClear}
                activeOpacity={0.7}
              >
                <FontAwesome name="times-circle" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Add Button */}
        {addButton && (
          <TouchableOpacity
            style={styles.addButtonContainer}
            onPress={addButton.onPress}
            activeOpacity={0.7}
          >
            {addButton.icon && (
              <FontAwesome
                name={addButton.icon as any}
                size={18}
                color={Colors.primary}
              />
            )}
            <Text style={styles.addButtonText}>{addButton.label}</Text>
          </TouchableOpacity>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {/* Content or Empty State */}
        {!loading && (
          <>
            {emptyState ? (
              <EmptyState
                icon={emptyState.icon}
                title={emptyState.title}
                message={emptyState.message}
                actionLabel={emptyState.actionLabel}
                onAction={emptyState.onAction}
              />
            ) : (
              children
            )}
          </>
        )}
      </ScrollView>
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
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: SECTION_SPACING,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  clearButton: {
    padding: 4,
  },
  addButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SECTION_SPACING,
    paddingVertical: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  loadingContainer: {
    paddingVertical: SECTION_SPACING * 2,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
