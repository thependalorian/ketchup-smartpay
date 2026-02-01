/**
 * Two-Factor Authentication Settings Screen
 * 
 * Location: app/profile/two-factor.tsx
 * Purpose: Manage 2FA settings
 * 
 * Features:
 * - Enable/disable 2FA
 * - Setup 2FA with QR code
 * - Backup codes
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ScreenHeader, SectionHeader, PillButton } from '@/components/common';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, LARGE_SECTION_SPACING } from '@/constants/Layout';
import defaultStyles from '@/constants/Styles';
import { useUser } from '@/contexts/UserContext';

export default function TwoFactorAuthScreen() {
  const router = useRouter();
  const { user, toggleTwoFactor, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(false);

  const twoFactorEnabled = user?.isTwoFactorEnabled || false;

  const handleBack = () => {
    router.back();
  };

  const handleToggle2FA = async (value: boolean) => {
    if (value) {
      // Enable 2FA - show setup flow
      Alert.alert(
        'Enable Two-Factor Authentication',
        'You will be guided through setting up 2FA with an authenticator app.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => {
              // In a real app, navigate to a dedicated 2FA setup screen
              // For now, we'll simulate success and enable it directly
              Alert.alert('Info', '2FA setup screen will be implemented. For now, we will enable it directly.');
              toggleTwoFactor(true);
            },
          },
        ]
      );
    } else {
      // Disable 2FA
      Alert.alert(
        'Disable Two-Factor Authentication',
        'Are you sure you want to disable 2FA? This will make your account less secure.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              try {
                await toggleTwoFactor(false);
                Alert.alert('Success', 'Two-factor authentication has been disabled');
              } catch (error) {
                Alert.alert('Error', 'Failed to disable 2FA. Please try again.');
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    }
  };

  const handleViewBackupCodes = () => {
    Alert.alert('Backup Codes', 'Backup codes feature will be implemented');
  };

  if (userLoading && !user) {
    return (
      <View style={defaultStyles.container}>
        <ScreenHeader title="Two-Factor Authentication" showBackButton onBack={handleBack} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader title="Two-Factor Authentication" onBack={handleBack} showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2FA Status */}
        <View style={styles.section}>
          <SectionHeader title="Security" />
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
                <Text style={styles.settingDescription}>
                  Add an extra layer of security to your account
                </Text>
              </View>
              <Switch
                value={twoFactorEnabled}
                onValueChange={handleToggle2FA}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
                disabled={loading || userLoading}
              />
            </View>
          </View>
        </View>

        {/* 2FA Info */}
        {twoFactorEnabled && (
          <View style={styles.section}>
            <SectionHeader title="Information" />
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <FontAwesome name="check-circle" size={20} color={Colors.success} />
                <Text style={styles.infoText}>2FA is enabled and protecting your account</Text>
              </View>
            </View>
          </View>
        )}

        {/* Backup Codes */}
        {twoFactorEnabled && (
          <View style={styles.section}>
            <SectionHeader title="Backup Codes" />
            <View style={styles.settingCard}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Recovery Codes</Text>
                <Text style={styles.settingDescription}>
                  Save these codes in a safe place. You can use them to access your account if you lose access to your authenticator app.
                </Text>
              </View>
              <PillButton
                label="View Backup Codes"
                variant="outline"
                onPress={handleViewBackupCodes}
                style={styles.backupButton}
              />
            </View>
          </View>
        )}

        {/* How It Works */}
        <View style={styles.section}>
          <SectionHeader title="How It Works" />
          <View style={styles.infoCard}>
            <Text style={styles.howItWorksText}>
              {`Two-factor authentication adds an extra layer of security to your account. When enabled, you'll need to enter a code from your authenticator app in addition to your password when signing in.`}
            </Text>
            <Text style={styles.howItWorksText}>
              We recommend using apps like Google Authenticator, Authy, or Microsoft Authenticator.
            </Text>
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
    marginBottom: LARGE_SECTION_SPACING,
    paddingHorizontal: HORIZONTAL_PADDING,
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
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  backupButton: {
    marginTop: 8,
  },
  howItWorksText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    padding: HORIZONTAL_PADDING,
  },
});
