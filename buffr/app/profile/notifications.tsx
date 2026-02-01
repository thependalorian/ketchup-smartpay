/**
 * Notifications Settings Screen
 * 
 * Location: app/profile/notifications.tsx
 * Purpose: Manage notification preferences
 * 
 * Features:
 * - Toggle notification categories
 * - Email notifications
 * - Push notifications
 * - SMS notifications
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { ScreenHeader, SectionHeader } from '@/components/common';
import Colors from '@/constants/Colors';
import defaultStyles from '@/constants/Styles';
import Layout from '@/constants/Layout';

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { preferences, updatePreferences } = useUser();
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    preferences.notificationsEnabled ?? true
  );
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [transactionNotifications, setTransactionNotifications] = useState(true);
  const [paymentNotifications, setPaymentNotifications] = useState(true);
  const [promotionalNotifications, setPromotionalNotifications] = useState(false);

  useEffect(() => {
    // Load saved preferences
    setNotificationsEnabled(preferences.notificationsEnabled ?? true);
  }, [preferences]);

  const handleBack = () => {
    router.back();
  };

  const handleNotificationsToggle = (value: boolean) => {
    setNotificationsEnabled(value);
    updatePreferences({ notificationsEnabled: value });
  };

  const handleEmailToggle = (value: boolean) => {
    setEmailNotifications(value);
    // In production, save to API
  };

  const handlePushToggle = (value: boolean) => {
    setPushNotifications(value);
    // In production, save to API
  };

  const handleSmsToggle = (value: boolean) => {
    setSmsNotifications(value);
    // In production, save to API
  };

  const handleTransactionToggle = (value: boolean) => {
    setTransactionNotifications(value);
    // In production, save to API
  };

  const handlePaymentToggle = (value: boolean) => {
    setPaymentNotifications(value);
    // In production, save to API
  };

  const handlePromotionalToggle = (value: boolean) => {
    setPromotionalNotifications(value);
    // In production, save to API
  };

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader title="Notifications" onBack={handleBack} showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* General Notifications */}
        <View style={styles.section}>
          <SectionHeader title="General" />
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Enable Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive notifications about your account activity
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </View>

        {/* Notification Channels */}
        {notificationsEnabled && (
          <View style={styles.section}>
            <SectionHeader title="Notification Channels" />
            <View style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Email Notifications</Text>
                  <Text style={styles.settingDescription}>
                    Receive notifications via email
                  </Text>
                </View>
                <Switch
                  value={emailNotifications}
                  onValueChange={handleEmailToggle}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Push Notifications</Text>
                  <Text style={styles.settingDescription}>
                    Receive push notifications on your device
                  </Text>
                </View>
                <Switch
                  value={pushNotifications}
                  onValueChange={handlePushToggle}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>SMS Notifications</Text>
                  <Text style={styles.settingDescription}>
                    Receive notifications via SMS
                  </Text>
                </View>
                <Switch
                  value={smsNotifications}
                  onValueChange={handleSmsToggle}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>
            </View>
          </View>
        )}

        {/* Notification Categories */}
        {notificationsEnabled && (
          <View style={styles.section}>
            <SectionHeader title="Notification Categories" />
            <View style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Transaction Notifications</Text>
                  <Text style={styles.settingDescription}>
                    Get notified about transactions and payments
                  </Text>
                </View>
                <Switch
                  value={transactionNotifications}
                  onValueChange={handleTransactionToggle}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Payment Notifications</Text>
                  <Text style={styles.settingDescription}>
                    Get notified about incoming and outgoing payments
                  </Text>
                </View>
                <Switch
                  value={paymentNotifications}
                  onValueChange={handlePaymentToggle}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Promotional Notifications</Text>
                  <Text style={styles.settingDescription}>
                    Receive offers, updates, and promotional content
                  </Text>
                </View>
                <Switch
                  value={promotionalNotifications}
                  onValueChange={handlePromotionalToggle}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>
            </View>
          </View>
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
    paddingBottom: 40,
  },
  section: {
    marginBottom: Layout.SECTION_SPACING,
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
  },
  settingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
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
});
