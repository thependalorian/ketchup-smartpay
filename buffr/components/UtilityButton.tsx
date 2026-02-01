/**
 * UtilityButton Component
 * 
 * Location: components/UtilityButton.tsx
 * Purpose: Reusable utility/service button for the grid
 * 
 * Displays utility service button with icon and label
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import GlassCard from './common/GlassCard';

interface UtilityButtonProps {
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  iconColor?: string;
  width?: number;
  onPress?: () => void;
}

export default function UtilityButton({
  label,
  icon,
  iconColor = Colors.primary,
  width,
  onPress,
}: UtilityButtonProps) {
  return (
    <TouchableOpacity 
      style={{ width }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <GlassCard style={styles.utilityButton} padding={16} borderRadius={16}>
        <View style={styles.utilityContent}>
          <FontAwesome name={icon} size={24} color={iconColor} />
          <Text style={styles.utilityButtonText}>{label}</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  utilityButton: {
    minHeight: 100,
    marginBottom: 12, // Consistent spacing between utility buttons
  },
  utilityContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 8,
  },
});
