/**
 * Privacy Settings Screen
 * 
 * Location: app/settings/privacy.tsx
 * Purpose: Manage privacy and data sharing settings
 * 
 * Features:
 * - Profile visibility settings
 * - Transaction history visibility
 * - Data sharing preferences
 * - Marketing communications
 * - Data export/deletion requests
 * 
 * Compliance: POPIA/GDPR requirements for data protection
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { ScreenHeader, GlassCard } from '@/components/common';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/components/layouts';

interface PrivacyOption {
  id: string;
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

export default function PrivacySettingsScreen() {
  const router = useRouter();
  
  // Privacy toggles
  const [showProfile, setShowProfile] = useState(true);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [allowAnalytics, setAllowAnalytics] = useState(true);
  const [allowPersonalization, setAllowPersonalization] = useState(true);
  const [allowMarketing, setAllowMarketing] = useState(false);
  const [allowThirdParty, setAllowThirdParty] = useState(false);

  const visibilityOptions: PrivacyOption[] = [
    {
      id: 'profile',
      title: 'Profile Visibility',
      subtitle: 'Allow others to see your profile when sending money',
      value: showProfile,
      onToggle: setShowProfile,
    },
    {
      id: 'transactions',
      title: 'Transaction History',
      subtitle: 'Show transaction amounts to contacts',
      value: showTransactionHistory,
      onToggle: setShowTransactionHistory,
    },
    {
      id: 'online-status',
      title: 'Online Status',
      subtitle: 'Show when you were last active',
      value: showOnlineStatus,
      onToggle: setShowOnlineStatus,
    },
  ];

  const dataOptions: PrivacyOption[] = [
    {
      id: 'analytics',
      title: 'Analytics',
      subtitle: 'Help us improve Buffr with usage data',
      value: allowAnalytics,
      onToggle: setAllowAnalytics,
    },
    {
      id: 'personalization',
      title: 'Personalization',
      subtitle: 'Personalized recommendations based on usage',
      value: allowPersonalization,
      onToggle: setAllowPersonalization,
    },
    {
      id: 'marketing',
      title: 'Marketing Communications',
      subtitle: 'Receive promotional offers and updates',
      value: allowMarketing,
      onToggle: setAllowMarketing,
    },
    {
      id: 'third-party',
      title: 'Third-Party Sharing',
      subtitle: 'Share data with trusted partners',
      value: allowThirdParty,
      onToggle: setAllowThirdParty,
    },
  ];

  const handleExportData = () => {
    Alert.alert(
      'Export Your Data',
      'We will prepare a copy of all your Buffr data. This may take up to 48 hours. You will receive an email when it\'s ready.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Request Export',
          onPress: () => {
            Alert.alert('Request Submitted', 'You will receive an email when your data is ready for download.');
          }
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data will be deleted within 30 days.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Please enter your PIN to confirm account deletion.',
              [
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }
        },
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  const renderOption = (option: PrivacyOption, isLast: boolean) => (
    <View
      key={option.id}
      style={[styles.optionItem, !isLast && styles.optionItemBorder]}
    >
      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{option.title}</Text>
        <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
      </View>
      <Switch
        value={option.value}
        onValueChange={option.onToggle}
        trackColor={{ false: Colors.border, true: `${Colors.primary}50` }}
        thumbColor={option.value ? Colors.primary : Colors.textTertiary}
      />
    </View>
  );

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader title="Privacy" showBackButton onBack={handleBack} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Privacy Notice */}
        <GlassCard style={styles.noticeCard} padding={16} borderRadius={16}>
          <View style={styles.noticeHeader}>
            <FontAwesome name="shield" size={20} color={Colors.primary} />
            <Text style={styles.noticeTitle}>Your Privacy Matters</Text>
          </View>
          <Text style={styles.noticeText}>
            Buffr is committed to protecting your personal data in compliance with POPIA and Bank of Namibia regulations.
          </Text>
          <TouchableOpacity 
            style={styles.learnMoreButton}
            onPress={() => router.push('/profile/privacy-policy')}
          >
            <Text style={styles.learnMoreText}>Read Privacy Policy</Text>
            <FontAwesome name="external-link" size={12} color={Colors.primary} />
          </TouchableOpacity>
        </GlassCard>

        {/* Visibility Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visibility</Text>
          <GlassCard style={styles.sectionCard} padding={0} borderRadius={16}>
            {visibilityOptions.map((option, index) => 
              renderOption(option, index === visibilityOptions.length - 1)
            )}
          </GlassCard>
        </View>

        {/* Data Sharing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Sharing</Text>
          <GlassCard style={styles.sectionCard} padding={0} borderRadius={16}>
            {dataOptions.map((option, index) => 
              renderOption(option, index === dataOptions.length - 1)
            )}
          </GlassCard>
        </View>

        {/* Your Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Data</Text>
          <GlassCard style={styles.sectionCard} padding={0} borderRadius={16}>
            <TouchableOpacity 
              style={[styles.actionItem, styles.optionItemBorder]}
              onPress={() => router.push('/profile/data-sharing')}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${Colors.info}15` }]}>
                <FontAwesome name="eye" size={16} color={Colors.info} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>View Data Sharing</Text>
                <Text style={styles.actionSubtitle}>See what data is shared with partners</Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color={Colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionItem, styles.optionItemBorder]}
              onPress={handleExportData}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${Colors.primary}15` }]}>
                <FontAwesome name="download" size={16} color={Colors.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Export Your Data</Text>
                <Text style={styles.actionSubtitle}>Download a copy of all your data</Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color={Colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionItem}
              onPress={handleDeleteAccount}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${Colors.error}15` }]}>
                <FontAwesome name="trash" size={16} color={Colors.error} />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: Colors.error }]}>Delete Account</Text>
                <Text style={styles.actionSubtitle}>Permanently delete your account and data</Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color={Colors.textTertiary} />
            </TouchableOpacity>
          </GlassCard>
        </View>

        {/* Compliance Info */}
        <View style={styles.complianceInfo}>
          <FontAwesome name="info-circle" size={14} color={Colors.textTertiary} />
          <Text style={styles.complianceText}>
            Your data is processed in accordance with the Protection of Personal Information Act (POPIA) and Bank of Namibia guidelines.
          </Text>
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
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: SECTION_SPACING,
    paddingBottom: 40,
  },
  noticeCard: {
    marginBottom: SECTION_SPACING,
    backgroundColor: `${Colors.primary}08`,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  noticeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  learnMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
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
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  optionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionContent: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  optionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  actionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  complianceInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
  },
  complianceText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textTertiary,
    lineHeight: 18,
  },
});
