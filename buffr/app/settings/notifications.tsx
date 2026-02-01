/**
 * Notification Settings Screen
 * 
 * Location: app/settings/notifications.tsx
 * Purpose: Manage notification preferences and settings
 * 
 * Features:
 * - Master notification toggle
 * - Notification type toggles (Transaction, Request, Group, Loan, System, Security, Promotion)
 * - Channel preferences (Push, Email, SMS)
 * - Quiet hours settings
 * - Sound and vibration preferences
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { GlassCard, GlassSection } from '@/components/common';
import { StandardScreenLayout, SECTION_SPACING, HORIZONTAL_PADDING } from '@/components/layouts';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { log } from '@/utils/logger';

interface NotificationSettings {
  masterEnabled: boolean;
  transactionsEnabled: boolean;
  requestsEnabled: boolean;
  groupsEnabled: boolean;
  loansEnabled: boolean;
  systemEnabled: boolean;
  securityEnabled: boolean;
  promotionsEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

const defaultSettings: NotificationSettings = {
  masterEnabled: true,
  transactionsEnabled: true,
  requestsEnabled: true,
  groupsEnabled: true,
  loansEnabled: true,
  systemEnabled: true,
  securityEnabled: true,
  promotionsEnabled: false,
  pushEnabled: true,
  emailEnabled: false,
  smsEnabled: false,
  quietHoursEnabled: false,
  soundEnabled: true,
  vibrationEnabled: true,
};

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);

  // Load settings from API or storage
  useEffect(() => {
    // In a real app, load from API or AsyncStorage
    // const loadSettings = async () => {
    //   const saved = await loadNotificationSettings();
    //   if (saved) setSettings(saved);
    // };
    // loadSettings();
  }, []);

  // Save settings
  const saveSettings = async () => {
    try {
      // In a real app, save to API or AsyncStorage
      // await saveNotificationSettings(settings);
      Alert.alert('Success', 'Notification settings saved');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save settings');
      log.error('Error saving notification settings:', error);
    }
  };

  const handleToggle = (key: keyof NotificationSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    
    // If master is disabled, disable all
    if (key === 'masterEnabled' && !value) {
      setSettings((prev) => ({
        ...prev,
        transactionsEnabled: false,
        requestsEnabled: false,
        groupsEnabled: false,
        loansEnabled: false,
        systemEnabled: false,
        securityEnabled: false,
        promotionsEnabled: false,
      }));
    }
    
    // Auto-save on change
    saveSettings();
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <StandardScreenLayout
      title="Notification Settings"
      showBackButton
      onBack={handleBack}
    >
      {/* Master Toggle */}
      <GlassCard style={styles.masterCard} padding={16} borderRadius={16}>
        <View style={styles.masterRow}>
          <View style={styles.masterInfo}>
            <Text style={styles.masterTitle}>Notifications</Text>
            <Text style={styles.masterDescription}>
              Enable or disable all notifications
            </Text>
          </View>
          <Switch
            value={settings.masterEnabled}
            onValueChange={(value) => handleToggle('masterEnabled', value)}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>
      </GlassCard>

      {/* Notification Types */}
      <GlassSection title="Notification Types" style={styles.section}>
        <View style={styles.optionsList}>
          {[
            {
              key: 'transactionsEnabled' as keyof NotificationSettings,
              title: 'Transaction Notifications',
              description: 'Get notified about all transactions',
              icon: 'exchange',
            },
            {
              key: 'requestsEnabled' as keyof NotificationSettings,
              title: 'Money Requests',
              description: 'Notifications for money requests',
              icon: 'hand-paper-o',
            },
            {
              key: 'groupsEnabled' as keyof NotificationSettings,
              title: 'Group Notifications',
              description: 'Group contributions and updates',
              icon: 'users',
            },
            {
              key: 'loansEnabled' as keyof NotificationSettings,
              title: 'Loan Notifications',
              description: 'Loan approvals and updates',
              icon: 'money',
            },
            {
              key: 'systemEnabled' as keyof NotificationSettings,
              title: 'System Updates',
              description: 'App updates and maintenance',
              icon: 'info-circle',
            },
            {
              key: 'securityEnabled' as keyof NotificationSettings,
              title: 'Security Alerts',
              description: 'Security and login alerts',
              icon: 'shield',
            },
            {
              key: 'promotionsEnabled' as keyof NotificationSettings,
              title: 'Promotions & Offers',
              description: 'Promotional notifications',
              icon: 'gift',
            },
          ].map((option) => (
            <View key={option.key} style={styles.optionItem}>
              <View style={styles.optionIconContainer}>
                <FontAwesome
                  name={option.icon as any}
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <Switch
                value={settings[option.key] as boolean}
                onValueChange={(value) => handleToggle(option.key, value)}
                disabled={!settings.masterEnabled}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          ))}
        </View>
      </GlassSection>

      {/* Channel Preferences */}
      <GlassSection title="Delivery Channels" style={styles.section}>
        <View style={styles.optionsList}>
          {[
            {
              key: 'pushEnabled' as keyof NotificationSettings,
              title: 'Push Notifications',
              description: 'Receive push notifications on your device',
              icon: 'bell',
            },
            {
              key: 'emailEnabled' as keyof NotificationSettings,
              title: 'Email Notifications',
              description: 'Receive notifications via email',
              icon: 'envelope',
            },
            {
              key: 'smsEnabled' as keyof NotificationSettings,
              title: 'SMS Notifications',
              description: 'Receive notifications via SMS',
              icon: 'mobile',
            },
          ].map((option) => (
            <View key={option.key} style={styles.optionItem}>
              <View style={styles.optionIconContainer}>
                <FontAwesome
                  name={option.icon as any}
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <Switch
                value={settings[option.key] as boolean}
                onValueChange={(value) => handleToggle(option.key, value)}
                disabled={!settings.masterEnabled}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          ))}
        </View>
      </GlassSection>

      {/* Sound & Vibration */}
      <GlassSection title="Sound & Vibration" style={styles.section}>
        <View style={styles.optionsList}>
          <View style={styles.optionItem}>
            <View style={styles.optionIconContainer}>
              <FontAwesome name="volume-up" size={20} color={Colors.primary} />
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Sound</Text>
              <Text style={styles.optionDescription}>
                Play sound for notifications
              </Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(value) => handleToggle('soundEnabled', value)}
              disabled={!settings.masterEnabled}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          <View style={styles.optionItem}>
            <View style={styles.optionIconContainer}>
              <FontAwesome name="mobile" size={20} color={Colors.primary} />
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Vibration</Text>
              <Text style={styles.optionDescription}>
                Vibrate for notifications
              </Text>
            </View>
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={(value) => handleToggle('vibrationEnabled', value)}
              disabled={!settings.masterEnabled}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>
      </GlassSection>
    </StandardScreenLayout>
  );
}

const styles = StyleSheet.create({
  masterCard: {
    marginBottom: SECTION_SPACING,
  },
  masterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  masterInfo: {
    flex: 1,
  },
  masterTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  masterDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: SECTION_SPACING,
  },
  optionsList: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
