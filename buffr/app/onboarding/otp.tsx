/**
 * Onboarding OTP Verification Screen (Step 3)
 * 
 * Location: app/onboarding/otp.tsx
 * Purpose: Verify phone number with OTP
 * 
 * Design: Based on BuffrCrew/Buffr App Design - "Entering OTP.svg", "Vetify OTP.svg"
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';
import { storeTokens } from '@/utils/auth';
import logger, { log } from '@/utils/logger';
import { 
  OnboardingLayout, 
  OnboardingHeader, 
  OnboardingButton,
  OTPInput,
} from '@/components/onboarding';

const TOTAL_STEPS = 6;
const CURRENT_STEP = 1;
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function OnboardingOTPScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-verify when OTP is complete
  useEffect(() => {
    if (otp.length === OTP_LENGTH) {
      handleVerify();
    }
  }, [otp]);

  const handleBack = () => {
    router.back();
  };

  const handleVerify = async () => {
    if (otp.length !== OTP_LENGTH) return;
    if (!phone) {
      setError('Phone number is required');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      // Verify OTP with backend API
      const { apiPost } = await import('@/utils/apiClient');
      const response = await apiPost<{
        user_id: string;
        buffr_id: string;
        is_new_user: boolean;
        access_token: string;
        refresh_token: string;
        expires_at: string;
      }>('/auth/login', {
        phone_number: phone,
        otp: otp,
        action: 'verify_otp',
      });

      // Store authentication tokens
      await storeTokens(
        response.access_token,
        response.refresh_token,
        response.user_id
      );

      // Navigate based on whether user is new or existing
      if (response.is_new_user) {
        // New user - continue onboarding
        router.push('/onboarding/name');
      } else {
        // Existing user - go to main app
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Invalid verification code. Please try again.';
      setError(errorMessage);
      setOtp('');
      log.error('Error verifying OTP:', err);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    if (!phone) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Request new OTP from API
      const { apiPost } = await import('@/utils/apiClient');
      const response = await apiPost<{ message: string; dev_otp?: string }>('/auth/login', {
        phone_number: phone,
        action: 'request_otp',
      });

      if (response.message) {
        // In development, log the OTP for testing
        if (process.env.NODE_ENV === 'development' && response.dev_otp) {
          log.info('[Development] New OTP:', { dev_otp: response.dev_otp });
          Alert.alert('Development Mode', `OTP: ${response.dev_otp}`);
        }

        setResendCooldown(RESEND_COOLDOWN);
        setOtp('');
        setError('');
      } else {
        setError('Failed to resend code. Please try again.');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to resend code. Please try again.';
      setError(errorMessage);
      log.error('Error resending OTP:', err);
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
          <Text style={styles.title}>Verify your number</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.phoneText}>{phone}</Text>
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.inputContainer}>
          <OTPInput
            length={OTP_LENGTH}
            value={otp}
            onChangeText={setOtp}
            error={error}
          />
        </View>

        {/* Verifying Indicator */}
        {verifying && (
          <View style={styles.verifyingContainer}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.verifyingText}>Verifying...</Text>
          </View>
        )}

        {/* Resend Section */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>{`Didn't receive the code?`}</Text>
          {resendCooldown > 0 ? (
            <Text style={styles.cooldownText}>
              Resend in {resendCooldown}s
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={loading}>
              <Text style={styles.resendLink}>
                {loading ? 'Sending...' : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Button */}
        <View style={styles.buttonContainer}>
          <OnboardingButton
            title="Verify"
            onPress={handleVerify}
            disabled={otp.length !== OTP_LENGTH || verifying}
            loading={verifying}
          />
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
    paddingBottom: 40,
    alignItems: 'center',
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
  },
  phoneText: {
    color: Colors.text,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: SECTION_SPACING,
  },
  verifyingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: SECTION_SPACING,
  },
  verifyingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  resendContainer: {
    alignItems: 'center',
    gap: 8,
  },
  resendText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  cooldownText: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  spacer: {
    flex: 1,
  },
  buttonContainer: {
    paddingBottom: 40,
  },
});
