/**
 * Onboarding Welcome Screen (Step 1)
 *
 * Location: app/onboarding/index.tsx
 * Purpose: Initial welcome screen with app introduction and accessibility options
 *
 * Design: Based on BuffrCrew/Buffr App Design - "Starting screen.svg"
 * Accessibility: FR4.6 – IVR, font size, contrast; user education for USSD/IVR (G2P 4.0 / SASSA).
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';
import { OnboardingLayout, OnboardingButton } from '@/components/onboarding';
import { HORIZONTAL_PADDING, SECTION_SPACING, CARD_GAP } from '@/constants/Layout';

export default function OnboardingWelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/onboarding/phone');
  };

  const handleSignIn = () => {
    router.replace('/(tabs)');
  };

  return (
    <OnboardingLayout backgroundColor={Colors.slate950}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        accessible
        accessibilityLabel="Welcome to Buffr. Get started or sign in. Accessibility: use USSD or IVR if you prefer voice or no smartphone."
      >
        {/* Illustration Area */}
        <View style={styles.illustrationContainer}>
          <LinearGradient
            colors={[Colors.gradientPurple, Colors.gradientBlue, Colors.gradientSky]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientCircle}
          />
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Buffr</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to Buffr</Text>
          <Text style={styles.subtitle}>
            Buffr: Your Payment Companion. Your trusted partner for G2P vouchers, payments, and
            financial services in Namibia.
          </Text>
          {/* Accessibility & user education (PRD FR4.6, G2P 4.0 inclusion) */}
          <View style={styles.accessibilityNote}>
            <Text style={styles.accessibilityTitle}>No smartphone?</Text>
            <Text style={styles.accessibilityText}>
              Dial *123# on any phone for balance, send money, pay bills, and redeem vouchers. Voice
              support (IVR) available in English and local languages – see Help after sign-in.
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <OnboardingButton title="Get Started" onPress={handleGetStarted} />
          <OnboardingButton
            title="I already have an account"
            onPress={handleSignIn}
            variant="text"
          />
        </View>
      </ScrollView>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  accessibilityNote: {
    marginTop: SECTION_SPACING,
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  accessibilityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  accessibilityText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.3,
    position: 'absolute',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.slate400,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  buttonContainer: {
    gap: 8,
  },
});
