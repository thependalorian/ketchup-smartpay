/**
 * Onboarding Phone Number Screen (Step 2)
 * 
 * Location: app/onboarding/phone.tsx
 * Purpose: Collect user's phone number for verification
 * 
 * Design: Based on BuffrCrew/Buffr App Design - "Enter number.svg"
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';
import logger, { log } from '@/utils/logger';
import { 
  OnboardingLayout, 
  OnboardingHeader, 
  OnboardingButton,
  PhoneInput,
} from '@/components/onboarding';

const TOTAL_STEPS = 6;
const CURRENT_STEP = 0;

export default function OnboardingPhoneScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidPhone = phoneNumber.replace(/\s/g, '').length >= 9;

  const handleBack = () => {
    router.back();
  };

  const handleContinue = async () => {
    if (!isValidPhone) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Normalize phone number (remove spaces, ensure +264 prefix)
      if (!phoneNumber || typeof phoneNumber !== 'string') {
        Alert.alert('Error', 'Please enter a valid phone number');
        return;
      }
      let normalizedPhone = phoneNumber.replace(/\s+/g, '');
      if (!normalizedPhone) {
        Alert.alert('Error', 'Please enter a valid phone number');
        return;
      }
      if (!normalizedPhone.startsWith('+264')) {
        if (normalizedPhone.startsWith('0')) {
          normalizedPhone = '+264' + normalizedPhone.substring(1);
        } else {
          normalizedPhone = '+264' + normalizedPhone;
        }
      }

      // Request OTP from API
      const { apiPost } = await import('@/utils/apiClient');
      const response = await apiPost<{ message: string; dev_otp?: string }>('/auth/login', {
        phone_number: normalizedPhone,
        action: 'request_otp',
      });

      if (response.message) {
        // In development, log the OTP for testing
        if (process.env.NODE_ENV === 'development' && response.dev_otp) {
          log.info('[Development] OTP:', { dev_otp: response.dev_otp });
        }

        router.push({
          pathname: '/onboarding/otp',
          params: { phone: normalizedPhone },
        });
      } else {
        setError('Failed to send verification code. Please try again.');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to send verification code. Please try again.';
      setError(errorMessage);
      log.error('Error requesting OTP:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout>
      <OnboardingHeader
        currentStep={CURRENT_STEP}
        totalSteps={TOTAL_STEPS}
        onBack={handleBack}
      />

      <View style={styles.container}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Enter your phone number</Text>
          <Text style={styles.subtitle}>
            {`We'll send you a verification code to confirm your number`}
          </Text>
        </View>

        {/* Phone Input */}
        <View style={styles.inputContainer}>
          <PhoneInput
            value={phoneNumber}
            onChangeText={(text) => {
              setPhoneNumber(text);
              setError('');
            }}
            error={error}
          />
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Button */}
        <View style={styles.buttonContainer}>
          <OnboardingButton
            title="Continue"
            onPress={handleContinue}
            disabled={!isValidPhone}
            loading={loading}
          />
          
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
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
  titleContainer: {
    paddingTop: HORIZONTAL_PADDING,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: SECTION_SPACING,
  },
  spacer: {
    flex: 1,
  },
  buttonContainer: {
    paddingBottom: 40,
    gap: 16,
  },
  termsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '500',
  },
});
