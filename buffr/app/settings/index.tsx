/**
 * Settings Index Screen
 * 
 * Location: app/settings/index.tsx
 * Purpose: Main settings screen with navigation to sub-settings
 * 
 * Features:
 * - User profile summary
 * - Navigation to all settings sections
 * - Quick actions (logout, theme toggle)
 * - App version display
 * - Glass card design
 * 
 * Used by: Profile screen, Tab bar
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { ScreenHeader, GlassCard, ProfileAvatar } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/components/layouts';
import { log } from '@/utils/logger';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  iconColor?: string;
  route?: string;
  action?: () => void;
  showBadge?: boolean;
  badgeText?: string;
}

const settingsSections: { title: string; items: SettingItem[] }[] = [
  {
    title: 'Account',
    items: [
      {
        id: 'profile',
        title: 'Edit Profile',
        subtitle: 'Update your personal information',
        icon: 'user',
        iconColor: Colors.primary,
        route: '/profile/edit',
      },
      {
        id: 'security',
        title: 'Security',
        subtitle: 'PIN, biometrics, password',
        icon: 'lock',
        iconColor: '#4CAF50',
        route: '/settings/security',
      },
      {
        id: 'two-factor',
        title: 'Two-Factor Authentication',
        subtitle: 'Add extra security layer',
        icon: 'shield',
        iconColor: '#2196F3',
        route: '/profile/two-factor',
      },
    ],
  },
  {
    title: 'Preferences',
    items: [
      {
        id: 'notifications',
        title: 'Notifications',
        subtitle: 'Push, email, SMS settings',
        icon: 'bell',
        iconColor: '#FF9800',
        route: '/settings/notifications',
      },
      {
        id: 'privacy',
        title: 'Privacy',
        subtitle: 'Data sharing & visibility',
        icon: 'eye',
        iconColor: '#9C27B0',
        route: '/settings/privacy',
      },
      {
        id: 'preferences',
        title: 'App Preferences',
        subtitle: 'Language, currency, theme',
        icon: 'sliders',
        iconColor: '#607D8B',
        route: '/profile/preferences',
      },
    ],
  },
  {
    title: 'Payments',
    items: [
      {
        id: 'cards',
        title: 'Cards & Wallets',
        subtitle: 'Manage payment methods',
        icon: 'credit-card',
        iconColor: Colors.primary,
        route: '/cards',
      },
      {
        id: 'fees',
        title: 'Fees & Limits',
        subtitle: 'View transaction limits',
        icon: 'money',
        iconColor: '#4CAF50',
        route: '/profile/fees',
      },
    ],
  },
  {
    title: 'Support',
    items: [
      {
        id: 'help',
        title: 'Help & Support',
        subtitle: 'FAQ, contact support',
        icon: 'question-circle',
        iconColor: '#00BCD4',
        route: '/settings/help',
      },
      {
        id: 'complaints',
        title: 'Complaints',
        subtitle: 'File or track complaints',
        icon: 'exclamation-triangle',
        iconColor: '#FF5722',
        route: '/profile/complaints',
      },
      {
        id: 'about',
        title: 'About Buffr',
        subtitle: 'Version, legal, licenses',
        icon: 'info-circle',
        iconColor: '#607D8B',
        route: '/settings/about',
      },
    ],
  },
];

export default function SettingsIndexScreen() {
  const router = useRouter();
  const { user, logout } = useUser();

  const handleItemPress = (item: SettingItem) => {
    if (item.action) {
      item.action();
    } else if (item.route) {
      router.push(item.route as any);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout?.();
              router.replace('/');
            } catch (error) {
              log.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader title="Settings" showBackButton onBack={handleBack} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Card */}
        <GlassCard style={styles.profileCard} padding={16} borderRadius={16}>
          <TouchableOpacity 
            style={styles.profileRow}
            onPress={() => router.push('/profile/edit')}
          >
            <ProfileAvatar
              name={user?.firstName || 'User'}
              imageUri={user?.avatar}
              size={60}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.profilePhone}>{user?.phoneNumber || '+264 XX XXX XXXX'}</Text>
              <View style={styles.verifiedBadge}>
                <FontAwesome name="check-circle" size={12} color="#4CAF50" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </GlassCard>

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <GlassCard style={styles.sectionCard} padding={0} borderRadius={16}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.settingItem,
                    index < section.items.length - 1 && styles.settingItemBorder,
                  ]}
                  onPress={() => handleItemPress(item)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor}15` }]}>
                    <FontAwesome
                      name={item.icon as any}
                      size={18}
                      color={item.iconColor}
                    />
                  </View>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {item.subtitle && (
                      <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                  {item.showBadge && item.badgeText && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badgeText}</Text>
                    </View>
                  )}
                  <FontAwesome name="chevron-right" size={14} color={Colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </GlassCard>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <FontAwesome name="sign-out" size={18} color={Colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>Buffr v1.0.0 (Build 100)</Text>
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
    paddingBottom: 40,
  },
  profileCard: {
    marginBottom: SECTION_SPACING,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  profilePhone: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  section: {
    marginBottom: SECTION_SPACING,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {},
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  itemSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: `${Colors.error}10`,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
