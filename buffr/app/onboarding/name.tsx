/**
 * Onboarding Name Setup Screen (Step 4)
 * 
 * Location: app/onboarding/name.tsx
 * Purpose: Collect user's name for profile
 * 
 * Design: Based on BuffrCrew/Buffr App Design - "After Setting Up Name.svg"
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';
import { log } from '@/utils/logger';
import { 
  OnboardingLayout, 
  OnboardingHeader, 
  OnboardingButton,
  NameInput,
} from '@/components/onboarding';

const TOTAL_STEPS = 6;
const CURRENT_STEP = 2;

export default function OnboardingNameScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});

  const isValid = firstName.trim().length >= 2 && lastName.trim().length >= 2;

  const handleBack = () => {
    router.back();
  };

  const handleContinue = async () => {
    const newErrors: typeof errors = {};
    
    if (firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }
    if (lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // In production: Save user profile
      await new Promise(resolve => setTimeout(resolve, 500));
      
      router.push({
        pathname: '/onboarding/photo',
        params: { firstName, lastName },
      });
    } catch (err) {
      log.error('Failed to save name:', err);
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
          <Text style={styles.title}>{`What's your name?`}</Text>
          <Text style={styles.subtitle}>
            {`This is how you'll appear to others on Buffr`}
          </Text>
        </View>

        {/* Name Inputs */}
        <View style={styles.inputContainer}>
          <NameInput
            label="First Name"
            value={firstName}
            onChangeText={(text) => {
              setFirstName(text);
              setErrors({ ...errors, firstName: undefined });
            }}
            placeholder="Enter first name"
            error={errors.firstName}
            autoFocus
          />
          
          <View style={styles.inputSpacer} />
          
          <NameInput
            label="Last Name"
            value={lastName}
            onChangeText={(text) => {
              setLastName(text);
              setErrors({ ...errors, lastName: undefined });
            }}
            placeholder="Enter last name"
            error={errors.lastName}
          />
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Button */}
        <View style={styles.buttonContainer}>
          <OnboardingButton
            title="Continue"
            onPress={handleContinue}
            disabled={!isValid}
            loading={loading}
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
  inputSpacer: {
    height: 16,
  },
  spacer: {
    flex: 1,
  },
  buttonContainer: {
    paddingBottom: 40,
  },
});
