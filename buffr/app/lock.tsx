/**
 * Lock Screen
 * 
 * Location: app/lock.tsx
 * Purpose: App lock screen requiring PIN or biometric authentication
 * 
 * Features:
 * - 6-digit PIN entry
 * - Biometric authentication option
 * - Animated error feedback
 * - Haptic feedback
 * 
 * Design: Based on buffr-mobile implementation, using buffr-app design system
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';

const Page = () => {
  const { user } = useUser();
  const router = useRouter();
  const [firstName, setFirstName] = useState(user?.firstName || 'User');
  const [code, setCode] = useState<number[]>([]);
  const codeLength = Array(6).fill(0);

  const offset = useSharedValue(0);

  const style = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offset.value }],
    };
  });

  const OFFSET = 20;
  const TIME = 80;

  useEffect(() => {
    if (code.length === 6) {
      // TODO: Replace with actual PIN verification from secure storage
      // For now, using placeholder PIN '111111'
      if (code.join('') === '111111') {
        router.replace('/(tabs)');
        setCode([]);
      } else {
        // Shake animation on wrong PIN
        offset.value = withSequence(
          withTiming(-OFFSET, { duration: TIME / 2 }),
          withRepeat(withTiming(OFFSET, { duration: TIME }), 4, true),
          withTiming(0, { duration: TIME / 2 })
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setCode([]);
      }
    }
  }, [code]);

  const onNumberPress = (number: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCode([...code, number]);
  };

  const numberBackspace = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCode(code.slice(0, -1));
  };

  const onBiometricAuthPress = async () => {
    try {
      const { success } = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Buffr',
        disableDeviceFallback: false,
      });
      
      if (success) {
        router.replace('/(tabs)');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.greeting}>Welcome back, {firstName}</Text>

      <Animated.View style={[styles.codeView, style]}>
        {codeLength.map((_, index) => (
          <View
            key={index}
            style={[
              styles.codeEmpty,
              {
                backgroundColor: code[index] ? Colors.primary : Colors.lightGray,  // ✅ buffr-mobile style
              },
            ]}
          />
        ))}
      </Animated.View>

      <View style={styles.numbersView}>
        <View style={styles.numberRow}>
          {[1, 2, 3].map((number) => (
            <TouchableOpacity 
              key={number} 
              onPress={() => onNumberPress(number)}
              style={styles.numberButton}
            >
              <Text style={styles.number}>{number}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.numberRow}>
          {[4, 5, 6].map((number) => (
            <TouchableOpacity 
              key={number} 
              onPress={() => onNumberPress(number)}
              style={styles.numberButton}
            >
              <Text style={styles.number}>{number}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.numberRow}>
          {[7, 8, 9].map((number) => (
            <TouchableOpacity 
              key={number} 
              onPress={() => onNumberPress(number)}
              style={styles.numberButton}
            >
              <Text style={styles.number}>{number}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={[styles.numberRow, styles.lastRow]}>
          <TouchableOpacity 
            onPress={onBiometricAuthPress}
            style={styles.biometricButton}
          >
            <MaterialCommunityIcons 
              name="face-recognition" 
              size={26} 
              color={Colors.dark}  // ✅ buffr-mobile style
            />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => onNumberPress(0)}
            style={styles.numberButton}
          >
            <Text style={styles.number}>0</Text>
          </TouchableOpacity>

          <View style={styles.backspaceContainer}>
            {code.length > 0 && (
              <TouchableOpacity onPress={numberBackspace}>
                <MaterialCommunityIcons 
                  name="backspace-outline" 
                  size={26} 
                  color={Colors.dark}  // ✅ buffr-mobile style
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <TouchableOpacity style={styles.forgotContainer}>
          <Text style={styles.forgotText}>Forgot your passcode?</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,  // ✅ buffr-mobile background
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',  // ✅ buffr-mobile fontWeight
    marginTop: 80,
    alignSelf: 'center',
    color: Colors.dark,  // ✅ buffr-mobile text color
  },
  codeView: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginVertical: 100,
  },
  codeEmpty: {
    width: 20,
    height: 20,
    borderRadius: 10,  // ✅ Circular
  },
  numbersView: {
    marginHorizontal: 80,
    gap: 60,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastRow: {
    alignItems: 'center',
  },
  numberButton: {
    minWidth: 60,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  number: {
    fontSize: 32,
    fontWeight: '500',
    color: Colors.dark,  // ✅ buffr-mobile text color
  },
  biometricButton: {
    minWidth: 60,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backspaceContainer: {
    minWidth: 60,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotContainer: {
    alignSelf: 'center',
    marginTop: 20,
  },
  forgotText: {
    color: Colors.primary,  // ✅ buffr-mobile primary color
    fontWeight: '500',  // ✅ buffr-mobile fontWeight
    fontSize: 18,  // ✅ buffr-mobile fontSize
  },
});

export default Page;
