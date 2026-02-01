/**
 * Data Sharing Settings Screen
 * 
 * Location: app/profile/data-sharing.tsx
 * Purpose: Manage data sharing and privacy preferences
 * 
 * Features:
 * - Analytics sharing toggle
 * - Marketing data sharing toggle
 * - Third-party data sharing
 * - Data export
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { ScreenHeader, SectionHeader, PillButton } from '@/components/common';
import Colors from '@/constants/Colors';
import defaultStyles from '@/constants/Styles';
import Layout from '@/constants/Layout';

export default function DataSharingScreen() {
  const router = useRouter();
  const { preferences, updatePreferences } = useUser();
  const [shareAnalytics, setShareAnalytics] = useState(
    preferences.shareAnalytics ?? true
  );
  const [shareMarketingData, setShareMarketingData] = useState(
    preferences.shareMarketingData ?? false
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setShareAnalytics(preferences.shareAnalytics ?? true);
    setShareMarketingData(preferences.shareMarketingData ?? false);
  }, [preferences]);

  const handleBack = () => {
    router.back();
  };

  const handleAnalyticsToggle = (value: boolean) => {
    setShareAnalytics(value);
    updatePreferences({ shareAnalytics: value });
  };

  const handleMarketingToggle = (value: boolean) => {
    setShareMarketingData(value);
    updatePreferences({ shareMarketingData: value });
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your data will be exported and sent to your registered email address. This may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            setSaving(true);
            try {
              // In production, call API to export data
              await new Promise((resolve) => setTimeout(resolve, 2000));
              Alert.alert(
                'Success',
                'Your data export has been initiated. You will receive an email with your data shortly.'
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to export data. Please try again.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your account data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Are you absolutely sure? This will delete your entire account and all associated data.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Account',
                  style: 'destructive',
                  onPress: () => {
                    // In production, call API to delete account
                    Alert.alert('Info', 'Account deletion will be implemented');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader title="Data Sharing" onBack={handleBack} showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Data Sharing Preferences */}
        <View style={styles.section}>
          <SectionHeader title="Data Sharing Preferences" />
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Share Analytics Data</Text>
                <Text style={styles.settingDescription}>
                  Help us improve our services by sharing anonymous usage analytics
                </Text>
              </View>
              <Switch
                value={shareAnalytics}
                onValueChange={handleAnalyticsToggle}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Share Marketing Data</Text>
                <Text style={styles.settingDescription}>
                  Allow us to use your data for personalized marketing and offers
                </Text>
              </View>
              <Switch
                value={shareMarketingData}
                onValueChange={handleMarketingToggle}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <SectionHeader title="Data Management" />
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Export Your Data</Text>
              <Text style={styles.settingDescription}>
                Download a copy of all your account data
              </Text>
            </View>
            <PillButton
              label="Export Data"
              variant="outline"
              onPress={handleExportData}
              disabled={saving}
              loading={saving}
              style={styles.actionButton}
            />
          </View>
        </View>

        {/* Privacy Information */}
        <View style={styles.section}>
          <SectionHeader title="Privacy Information" />
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Your privacy is important to us. We only collect and use data necessary to provide our services. You can control how your data is shared through these settings.
            </Text>
            <Text style={styles.infoText}>
              For more information, please review our Privacy Policy.
            </Text>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <SectionHeader title="Danger Zone" />
          <View style={styles.dangerCard}>
            <View style={styles.settingInfo}>
              <Text style={styles.dangerTitle}>Delete All Data</Text>
              <Text style={styles.dangerDescription}>
                Permanently delete your account and all associated data. This action cannot be undone.
              </Text>
            </View>
            <PillButton
              label="Delete Account"
              variant="outline"
              onPress={handleDeleteData}
              style={[styles.actionButton, styles.deleteButton]}
              textStyle={{ color: Colors.error }}
            />
          </View>
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
  section: {
    marginBottom: 32,
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
  },
  settingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  actionButton: {
    marginTop: 12,
  },
  infoCard: {
    backgroundColor: Colors.backgroundGray,
    borderRadius: 16,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  dangerCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: 16,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: 4,
  },
  dangerDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  deleteButton: {
    borderColor: Colors.error,
  },
});
