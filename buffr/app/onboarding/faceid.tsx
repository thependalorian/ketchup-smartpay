/**
 * Onboarding Face ID Setup Screen (Step 5)
 * 
 * Location: app/onboarding/faceid.tsx
 * Purpose: Setup biometric authentication (Face ID / Fingerprint)
 * 
 * Design: Based on BuffrCrew/Buffr App Design - "Verify FaceID.svg"
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING, CARD_GAP } from '@/constants/Layout';
import { log } from '@/utils/logger';
import { 
  OnboardingLayout, 
  OnboardingHeader, 
  OnboardingButton,
} from '@/components/onboarding';

const TOTAL_STEPS = 6;
const CURRENT_STEP = 4;

export default function OnboardingFaceIDScreen() {
  const router = useRouter();
  const { firstName, lastName, photoUri } = useLocalSearchParams<{ firstName: string; lastName: string; photoUri: string }>();
  const [loading, setLoading] = useState(false);
  const [biometricType, setBiometricType] = useState<'faceid' | 'fingerprint' | 'none'>('none');
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      setIsEnrolled(enrolled);
      
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('faceid');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('fingerprint');
      } else {
        setBiometricType('none');
      }
    } catch (error) {
      log.error('Biometric check error:', error);
      setBiometricType('none');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleEnableBiometric = async () => {
    setLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: biometricType === 'faceid' 
          ? 'Set up Face ID for Buffr' 
          : 'Set up Fingerprint for Buffr',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // In production: Save biometric preference
        router.push({
          pathname: '/onboarding/complete',
          params: { firstName, lastName, photoUri },
        });
      }
    } catch (error) {
      log.error('Biometric setup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push({
      pathname: '/onboarding/complete',
      params: { firstName, lastName, photoUri },
    });
  };

  const getBiometricLabel = () => {
    if (biometricType === 'faceid') return 'Face ID';
    if (biometricType === 'fingerprint') return 'Fingerprint';
    return 'Biometric';
  };

  const getBiometricIcon = () => {
    if (biometricType === 'faceid') return 'smile-o';
    if (biometricType === 'fingerprint') return 'hand-paper-o';
    return 'lock';
  };

  return (
    <OnboardingLayout>
      <OnboardingHeader
        currentStep={CURRENT_STEP}
        totalSteps={TOTAL_STEPS}
        onBack={handleBack}
      />

      <View style={styles.container}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircleOuter}>
            <View style={styles.iconCircleInner}>
              <FontAwesome 
                name={getBiometricIcon() as any} 
                size={64} 
                color={Colors.primary} 
              />
            </View>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            Enable {getBiometricLabel()}
          </Text>
          <Text style={styles.subtitle}>
            Use {getBiometricLabel()} to quickly and securely access your Buffr account
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <FontAwesome name="check-circle" size={18} color={Colors.success} />
            <Text style={styles.benefitText}>Quick access to your account</Text>
          </View>
          <View style={styles.benefitItem}>
            <FontAwesome name="check-circle" size={18} color={Colors.success} />
            <Text style={styles.benefitText}>Secure transactions</Text>
          </View>
          <View style={styles.benefitItem}>
            <FontAwesome name="check-circle" size={18} color={Colors.success} />
            <Text style={styles.benefitText}>No need to remember PIN</Text>
          </View>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {biometricType !== 'none' && isEnrolled ? (
            <>
              <OnboardingButton
                title={`Enable ${getBiometricLabel()}`}
                onPress={handleEnableBiometric}
                loading={loading}
              />
              <OnboardingButton
                title="Skip for now"
                onPress={handleSkip}
                variant="text"
              />
            </>
          ) : (
            <>
              <Text style={styles.unavailableText}>
                {!isEnrolled 
                  ? `${getBiometricLabel()} is not set up on this device. Please set it up in your device settings.`
                  : 'Biometric authentication is not available on this device.'
                }
              </Text>
              <OnboardingButton
                title="Continue"
                onPress={handleSkip}
              />
            </>
          )}
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  iconContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
  },
  iconCircleOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: `${Colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  benefitsContainer: {
    backgroundColor: Colors.slate100,
    borderRadius: 16,
    padding: HORIZONTAL_PADDING,
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 15,
    color: Colors.text,
  },
  spacer: {
    flex: 1,
  },
  buttonContainer: {
    paddingBottom: 40,
    gap: 8,
  },
  unavailableText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
});
