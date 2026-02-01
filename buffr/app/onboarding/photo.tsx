/**
 * Onboarding Photo Upload Screen (Step 5)
 * 
 * Location: app/onboarding/photo.tsx
 * Purpose: Upload profile photo from device or camera
 * 
 * Design: Based on BuffrCrew/Buffr App Design - "Upload from gallery.svg", "Photo selected.svg"
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING } from '@/constants/Layout';
import { 
  OnboardingLayout, 
  OnboardingHeader, 
  OnboardingButton,
} from '@/components/onboarding';
import PhotoUpload from '@/components/onboarding/PhotoUpload';
import { log } from '@/utils/logger';

const TOTAL_STEPS = 6;
const CURRENT_STEP = 3;

export default function OnboardingPhotoScreen() {
  const router = useRouter();
  const { firstName, lastName } = useLocalSearchParams<{ firstName: string; lastName: string }>();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'User';

  const handleBack = () => {
    router.back();
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      // In production: Upload photo to server
      if (photoUri) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      router.push({
        pathname: '/onboarding/faceid',
        params: { firstName, lastName, photoUri: photoUri || '' },
      });
    } catch (err) {
      log.error('Failed to save photo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push({
      pathname: '/onboarding/faceid',
      params: { firstName, lastName, photoUri: '' },
    });
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
          <Text style={styles.title}>Add a profile photo</Text>
          <Text style={styles.subtitle}>
            Help your friends recognize you. You can always change this later.
          </Text>
        </View>

        {/* Photo Upload */}
        <View style={styles.photoContainer}>
          <PhotoUpload
            imageUri={photoUri}
            onImageSelected={setPhotoUri}
            onImageRemoved={() => setPhotoUri(null)}
            name={fullName}
          />
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📷</Text>
            <Text style={styles.infoText}>Take a new photo or choose from your gallery</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🔒</Text>
            <Text style={styles.infoText}>Your photo is only visible to your contacts</Text>
          </View>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <OnboardingButton
            title={photoUri ? 'Continue' : 'Add Photo'}
            onPress={photoUri ? handleContinue : () => {}}
            disabled={!photoUri}
            loading={loading}
          />
          <OnboardingButton
            title="Skip for now"
            onPress={handleSkip}
            variant="text"
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
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  photoContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  infoContainer: {
    backgroundColor: Colors.slate100,
    borderRadius: 16,
    padding: HORIZONTAL_PADDING,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  spacer: {
    flex: 1,
  },
  buttonContainer: {
    paddingBottom: 40,
    gap: 8,
  },
});
