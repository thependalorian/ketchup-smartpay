/**
 * Onboarding Complete Screen (Final Step)
 * 
 * Location: app/onboarding/complete.tsx
 * Purpose: Shows user's Buffr account successfully created with their profile
 * 
 * Design: Based on BuffrCrew/Buffr App Design - "Onboarding completed.svg"
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { setItemAsync } from '@/utils/storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { 
  OnboardingLayout, 
  OnboardingHeader, 
  OnboardingButton,
} from '@/components/onboarding';
import { generateBuffrId } from '@/utils/buffrId';
import { HORIZONTAL_PADDING, SECTION_SPACING, CARD_GAP } from '@/constants/Layout';
import logger, { log } from '@/utils/logger';

const TOTAL_STEPS = 6;
const CURRENT_STEP = 5;
const ONBOARDING_COMPLETE_KEY = '@buffr_onboarding_complete';

export default function OnboardingCompleteScreen() {
  const router = useRouter();
  const { firstName, lastName, photoUri } = useLocalSearchParams<{ 
    firstName: string; 
    lastName: string; 
    photoUri: string;
  }>();
  
  const [buffrId, setBuffrId] = useState('');
  
  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'User';

  useEffect(() => {
    // Generate a unique Buffr ID for the user
    const id = generateBuffrId 
      ? generateBuffrId({ fullName, phoneNumber: null, email: null }) 
      : `buffr_${Date.now().toString(36)}`;
    setBuffrId(id);
  }, [fullName]);

  const handleGetStarted = async () => {
    try {
      // Mark onboarding as complete (platform-safe storage)
      await setItemAsync(ONBOARDING_COMPLETE_KEY, 'true');
      
      // Save user data to backend
      try {
        const { apiPut, apiPost } = await import('@/utils/apiClient');
        await apiPut('/users/me', {
          firstName: firstName || '',
          lastName: lastName || '',
          fullName: fullName,
          avatar: photoUri || undefined,
          buffrId: buffrId,
        });
        logger.info('User profile saved successfully');
        
        // PRD FR6.2: Auto-create main wallet during onboarding
        // Ensure default "Buffr Account" wallet exists for the user
        try {
          await apiPost('/wallets', {
            name: 'Buffr Account',
            icon: 'credit-card',
            type: 'personal',
            currency: 'N$',
            isDefault: true,
          });
          logger.info('Default wallet created during onboarding');
        } catch (walletError: any) {
          // Wallet may already exist (created at login) - that's OK
          if (!walletError.message?.includes('already exists') && !walletError.message?.includes('duplicate')) {
            log.warn('Failed to create default wallet during onboarding:', walletError);
          }
        }
      } catch (profileError) {
        log.error('Failed to save user profile:', profileError);
        // Continue even if profile save fails - user can update later
      }
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      log.error('Failed to complete onboarding:', error);
      router.replace('/(tabs)');
    }
  };

  // Get initials for avatar placeholder
  const getInitials = () => {
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  return (
    <OnboardingLayout>
      <OnboardingHeader
        currentStep={CURRENT_STEP}
        totalSteps={TOTAL_STEPS}
        showBack={false}
      />

      <View style={styles.container}>
        {/* Success Badge */}
        <View style={styles.successBadge}>
          <FontAwesome name="check-circle" size={24} color={Colors.success} />
          <Text style={styles.successText}>Account Created!</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{getInitials()}</Text>
              </View>
            )}
            <View style={styles.verifiedBadge}>
              <FontAwesome name="check" size={12} color={Colors.white} />
            </View>
          </View>

          {/* Name */}
          <Text style={styles.userName}>{fullName}</Text>

          {/* Buffr ID */}
          <View style={styles.buffrIdContainer}>
            <Text style={styles.buffrIdLabel}>Your Buffr ID</Text>
            <View style={styles.buffrIdBox}>
              <FontAwesome name="id-badge" size={16} color={Colors.primary} />
              <Text style={styles.buffrIdText}>{buffrId}</Text>
            </View>
          </View>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>You can now</Text>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: `${Colors.primary}15` }]}>
              <FontAwesome name="paper-plane" size={16} color={Colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>Send money instantly</Text>
              <Text style={styles.featureSubtext}>To any Buffr user or mobile number</Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: `${Colors.success}15` }]}>
              <FontAwesome name="download" size={16} color={Colors.success} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>Receive payments</Text>
              <Text style={styles.featureSubtext}>Share your Buffr ID or QR code</Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: `${Colors.warning}15` }]}>
              <FontAwesome name="qrcode" size={16} color={Colors.warning} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>Pay with QR codes</Text>
              <Text style={styles.featureSubtext}>Scan or show NAMQR codes</Text>
            </View>
          </View>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Button */}
        <View style={styles.buttonContainer}>
          <OnboardingButton
            title="Start Using Buffr"
            onPress={handleGetStarted}
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
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: HORIZONTAL_PADDING,
    backgroundColor: `${Colors.success}15`,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: SECTION_SPACING,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: SECTION_SPACING,
    shadowColor: Colors.slate900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.slate100,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.slate100,
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  buffrIdContainer: {
    alignItems: 'center',
    gap: 8,
  },
  buffrIdLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  buffrIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.slate50,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  buffrIdText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'monospace',
  },
  featuresContainer: {
    backgroundColor: Colors.slate50,
    borderRadius: 16,
    padding: HORIZONTAL_PADDING,
    gap: 16,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  featureSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  spacer: {
    flex: 1,
    minHeight: 20,
  },
  buttonContainer: {
    paddingBottom: 40,
  },
});
