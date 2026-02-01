/**
 * Buffr Main Account Details Screen
 * 
 * Location: app/account.tsx
 * Purpose: Display detailed information about the Buffr main account
 * 
 * Features:
 * - Account details (account number, balance)
 * - Account creation date
 * - Account status
 * - Management options
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useUser } from '@/contexts/UserContext';
import { ScreenHeader, SectionHeader, GlassCard, EmptyState } from '@/components/common';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';
import { defaultStyles } from '@/constants/Styles';

export default function AccountDetailsScreen() {
  const router = useRouter();
  const { user } = useUser();

  const handleBack = () => {
    router.back();
  };

  // Generate Buffr account number (same as AccountQuickView)
  const getBuffrAccountNumber = (): string => {
    if (!user) return '018';
    const identifier = user.id || user.email || user.phoneNumber || '018';
    const hash = identifier.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return String(hash % 1000).padStart(3, '0');
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  };

  if (!user) {
    return (
      <View style={defaultStyles.container as any}>
        <ScreenHeader title="Account Details" onBack={handleBack} showBackButton />
        <EmptyState
          icon="user"
          title="User information not available"
          message="Please sign in to view your account details"
        />
      </View>
    );
  }

  return (
    <View style={defaultStyles.container as any}>
      <ScreenHeader title="Buffr Account" onBack={handleBack} showBackButton />

      <ScrollView
        style={styles.scrollView as any}
        contentContainerStyle={styles.scrollContent as any}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Preview */}
        <View style={styles.accountPreview as any}>
          <View style={styles.accountVisual as any}>
            <View style={styles.accountGradient as any} />
            <View style={styles.accountInfo as any}>
              <FontAwesome name="credit-card" size={32} color={Colors.white} style={styles.accountIcon as any} />
              <Text style={styles.accountTitle as any}>Buffr Account</Text>
              <Text style={styles.accountNumber as any}>..{getBuffrAccountNumber()}</Text>
            </View>
          </View>
        </View>

        {/* Account Information */}
        <View style={styles.section as any}>
          <SectionHeader title="Account Information" />
          <GlassCard style={styles.infoCard} padding={16} borderRadius={16}>
            <View style={styles.infoRow as any}>
              <Text style={styles.infoLabel as any}>Account Number</Text>
              <Text style={styles.infoValue as any}>..{getBuffrAccountNumber()}</Text>
            </View>
            <View style={styles.divider as any} />
            <View style={styles.infoRow as any}>
              <Text style={styles.infoLabel as any}>Account Type</Text>
              <Text style={styles.infoValue as any}>Main Account</Text>
            </View>
            {user.buffrCardBalance !== undefined && (
              <>
                <View style={styles.divider as any} />
                <View style={styles.infoRow as any}>
                  <Text style={styles.infoLabel as any}>Current Balance</Text>
                  <Text style={styles.infoValue as any}>
                    {user.currency || 'N$'} {user.buffrCardBalance.toLocaleString()}
                  </Text>
                </View>
              </>
            )}
          </GlassCard>
        </View>

        {/* Account Details */}
        <View style={styles.section as any}>
          <SectionHeader title="Account Details" />
          <GlassCard style={styles.infoCard} padding={16} borderRadius={16}>
            <View style={styles.infoRow as any}>
              <Text style={styles.infoLabel as any}>Created On</Text>
              <Text style={styles.infoValue as any}>
                {formatDate(user.createdAt || user.accountCreatedAt)}
              </Text>
            </View>
            {user.lastActiveAt && (
              <>
                <View style={styles.divider as any} />
                <View style={styles.infoRow as any}>
                  <Text style={styles.infoLabel as any}>Last Active</Text>
                  <Text style={styles.infoValue as any}>{formatDate(user.lastActiveAt)}</Text>
                </View>
              </>
            )}
            <View style={styles.divider as any} />
            <View style={styles.infoRow as any}>
              <Text style={styles.infoLabel as any}>Status</Text>
              <View style={styles.statusContainer as any}>
                <View style={[styles.statusDot, styles.statusDotActive] as any} />
                <Text style={styles.infoValue as any}>Active</Text>
              </View>
            </View>
            {user.isVerified && (
              <>
                <View style={styles.divider as any} />
                <View style={styles.infoRow as any}>
                  <Text style={styles.infoLabel as any}>Verification</Text>
                  <FontAwesome name="check-circle" size={16} color={Colors.success} />
                </View>
              </>
            )}
          </GlassCard>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  accountPreview: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 32,
  },
  accountVisual: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.dark as any,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  accountGradient: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    opacity: 0.9,
  },
  accountInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: HORIZONTAL_PADDING,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  accountIcon: {
    marginBottom: 12,
  },
  accountTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 8,
  },
  accountNumber: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.white,
    opacity: 0.9,
    letterSpacing: 2,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: Colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
});
