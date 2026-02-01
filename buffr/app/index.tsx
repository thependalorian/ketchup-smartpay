/**
 * Buffr App - Main Entry Screen
 * 
 * Location: app/index.tsx
 * Purpose: Main entry point for the Buffr application
 * 
 * This is the first screen users see when they open the app.
 */

import { View, Text, Image, TouchableOpacity } from 'react-native';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING } from '@/constants/Layout';
import { useRouter } from 'expo-router';
import logger from '@/utils/logger';

export default function IndexScreen() {
  const router = useRouter();

  return (
    <View style={defaultStyles.containerCentered}>
      {/* Buffr Logo */}
      <Image
        source={require('@/assets/images/buffr_logo.png')}
        style={{
          width: 200,
          height: 200,
          marginBottom: 40,
        }}
        resizeMode="contain"
        onError={(error) => {
          console.warn('Failed to load logo:', error);
        }}
      />

      {/* Welcome Text */}
      <Text style={defaultStyles.header}>Welcome to Buffr</Text>
      <Text style={[defaultStyles.descriptionText, { textAlign: 'center', marginTop: 16 }]}>
        Buffr: Your Payment Companion - Your trusted partner for G2P vouchers, payments, and financial services
      </Text>

      {/* Action Buttons */}
      <View style={{ width: '100%', paddingHorizontal: HORIZONTAL_PADDING, marginTop: 40, gap: 16 }}>
        <TouchableOpacity
          style={defaultStyles.pillButton}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={defaultStyles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={defaultStyles.buttonOutline}
          onPress={() => {
            // Handle login navigation
            logger.info('Login pressed');
          }}
        >
          <Text style={defaultStyles.buttonOutlineText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
