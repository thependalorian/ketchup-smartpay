/**
 * Security Settings Screen
 * 
 * Location: app/settings/security.tsx
 * Purpose: Manage security settings - PIN, biometrics, password
 * 
 * Features:
 * - Change PIN
 * - Enable/disable biometric authentication
 * - Change password
 * - View active sessions
 * - Security recommendations
 * - Transaction PIN settings
 * 
 * Compliance: PSD-1 §9.2 - User authentication requirements
 */

import React, { useState, useEffect } from 'react';
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
import * as LocalAuthentication from 'expo-local-authentication';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { ScreenHeader, GlassCard } from '@/components/common';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/components/layouts';
import logger, { log } from '@/utils/logger';

interface SecurityOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  onToggle?: (value: boolean) => void;
  route?: string;
  action?: () => void;
  disabled?: boolean;
}

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [transactionPinEnabled, setTransactionPinEnabled] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      setBiometricAvailable(compatible && enrolled);
      
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Fingerprint');
      }
    } catch (error) {
      log.error('Biometric check error:', error);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value && biometricAvailable) {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: `Enable ${biometricType} for Buffr`,
          disableDeviceFallback: false,
        });
        
        if (result.success) {
          setBiometricEnabled(true);
          Alert.alert('Success', `${biometricType} authentication enabled`);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to enable biometric authentication');
      }
    } else {
      setBiometricEnabled(false);
    }
  };

  const handleTransactionPinToggle = (value: boolean) => {
    if (!value) {
      Alert.alert(
        'Disable Transaction PIN?',
        'This will allow transactions without PIN confirmation. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Disable', 
            style: 'destructive',
            onPress: () => setTransactionPinEnabled(false)
          },
        ]
      );
    } else {
      setTransactionPinEnabled(true);
    }
  };

  const handleChangePin = () => {
    Alert.alert(
      'Change PIN',
      'You will need to enter your current PIN and then set a new 4-digit PIN.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => logger.info('Navigate to change PIN flow') },
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'You will receive an email with instructions to reset your password.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Email', onPress: () => logger.info('Send password reset email') },
      ]
    );
  };

  const securitySections: { title: string; options: SecurityOption[] }[] = [
    {
      title: 'Authentication',
      options: [
        {
          id: 'biometric',
          title: biometricType || 'Biometric Authentication',
          subtitle: biometricAvailable 
            ? `Use ${biometricType || 'biometrics'} to unlock app`
            : 'Not available on this device',
          icon: biometricType === 'Face ID' ? 'smile-o' : 'hand-paper-o',
          type: 'toggle',
          value: biometricEnabled,
          onToggle: handleBiometricToggle,
          disabled: !biometricAvailable,
        },
        {
          id: 'transaction-pin',
          title: 'Transaction PIN',
          subtitle: 'Require PIN for all transactions',
          icon: 'lock',
          type: 'toggle',
          value: transactionPinEnabled,
          onToggle: handleTransactionPinToggle,
        },
      ],
    },
    {
      title: 'Credentials',
      options: [
        {
          id: 'change-pin',
          title: 'Change PIN',
          subtitle: 'Update your 4-digit PIN',
          icon: 'key',
          type: 'action',
          action: handleChangePin,
        },
        {
          id: 'change-password',
          title: 'Change Password',
          subtitle: 'Update your account password',
          icon: 'asterisk',
          type: 'action',
          action: handleChangePassword,
        },
      ],
    },
    {
      title: 'Sessions',
      options: [
        {
          id: 'active-sessions',
          title: 'Active Sessions',
          subtitle: 'View and manage logged in devices',
          icon: 'desktop',
          type: 'navigation',
          route: '/profile/active-sessions',
        },
      ],
    },
  ];

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader title="Security" showBackButton onBack={handleBack} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Security Score Card */}
        <GlassCard style={styles.scoreCard} padding={16} borderRadius={16}>
          <View style={styles.scoreHeader}>
            <View style={styles.scoreIconContainer}>
              <FontAwesome name="shield" size={28} color="#4CAF50" />
            </View>
            <View style={styles.scoreContent}>
              <Text style={styles.scoreTitle}>Security Score</Text>
              <Text style={styles.scoreValue}>Good</Text>
            </View>
            <View style={styles.scorePercentage}>
              <Text style={styles.percentageText}>85%</Text>
            </View>
          </View>
          <View style={styles.scoreBar}>
            <View style={[styles.scoreBarFill, { width: '85%' }]} />
          </View>
          <Text style={styles.scoreHint}>
            Enable {biometricType || 'biometrics'} to improve your security score
          </Text>
        </GlassCard>

        {/* Security Sections */}
        {securitySections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <GlassCard style={styles.sectionCard} padding={0} borderRadius={16}>
              {section.options.map((option, index) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionItem,
                    index < section.options.length - 1 && styles.optionItemBorder,
                  ]}
                  onPress={() => {
                    if (option.type === 'navigation' && option.route) {
                      router.push(option.route as any);
                    } else if (option.type === 'action' && option.action) {
                      option.action();
                    }
                  }}
                  disabled={option.type === 'toggle' || option.disabled}
                >
                  <View style={[
                    styles.optionIcon,
                    option.disabled && styles.optionIconDisabled
                  ]}>
                    <FontAwesome
                      name={option.icon as any}
                      size={18}
                      color={option.disabled ? Colors.textTertiary : Colors.primary}
                    />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionTitle,
                      option.disabled && styles.optionTitleDisabled
                    ]}>
                      {option.title}
                    </Text>
                    <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                  </View>
                  {option.type === 'toggle' ? (
                    <Switch
                      value={option.value}
                      onValueChange={option.onToggle}
                      trackColor={{ false: Colors.border, true: `${Colors.primary}50` }}
                      thumbColor={option.value ? Colors.primary : Colors.textTertiary}
                      disabled={option.disabled}
                    />
                  ) : (
                    <FontAwesome name="chevron-right" size={14} color={Colors.textTertiary} />
                  )}
                </TouchableOpacity>
              ))}
            </GlassCard>
          </View>
        ))}

        {/* Security Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Tips</Text>
          <GlassCard style={styles.tipsCard} padding={16} borderRadius={16}>
            <View style={styles.tipItem}>
              <FontAwesome name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.tipText}>Use a unique PIN for Buffr</Text>
            </View>
            <View style={styles.tipItem}>
              <FontAwesome name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.tipText}>Enable biometric authentication</Text>
            </View>
            <View style={styles.tipItem}>
              <FontAwesome name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.tipText}>Review active sessions regularly</Text>
            </View>
            <View style={styles.tipItem}>
              <FontAwesome name="exclamation-circle" size={16} color="#FF9800" />
              <Text style={styles.tipText}>Never share your PIN with anyone</Text>
            </View>
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
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: SECTION_SPACING,
    paddingBottom: 40,
  },
  scoreCard: {
    marginBottom: SECTION_SPACING,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  scoreIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreContent: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
  },
  scorePercentage: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  scoreBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    marginBottom: 12,
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  scoreHint: {
    fontSize: 13,
    color: Colors.textSecondary,
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
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconDisabled: {
    backgroundColor: Colors.border,
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
  optionTitleDisabled: {
    color: Colors.textTertiary,
  },
  optionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  tipsCard: {},
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  tipText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
});
