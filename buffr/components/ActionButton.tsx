/**
 * ActionButton Component
 * 
 * Location: components/ActionButton.tsx
 * Purpose: Reusable action button (Send, Scan, etc.)
 * 
 * Displays action button with icon and label
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

interface ActionButtonProps {
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  variant?: 'primary' | 'dark';
  onPress?: () => void;
}

export default function ActionButton({
  label,
  icon,
  variant = 'primary',
  onPress,
}: ActionButtonProps) {
  const backgroundColor = variant === 'primary' ? Colors.primary : Colors.dark;

  return (
    <TouchableOpacity
      style={[styles.actionButton, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <FontAwesome name={icon} size={22} color={Colors.white} />
      <Text style={styles.actionButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
    maxWidth: 160,
    height: 60,  // ✅ buffr-mobile style
    borderRadius: 40,  // ✅ buffr-mobile pill shape
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: Colors.dark,
    shadowOffset: {
      width: 0,
      height: 2,  // ✅ buffr-mobile shadow
    },
    shadowOpacity: 0.1,  // ✅ buffr-mobile shadow
    shadowRadius: 8,  // ✅ buffr-mobile shadow
    elevation: 2,  // ✅ buffr-mobile elevation
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 18,  // ✅ buffr-mobile style
    fontWeight: '500',  // ✅ buffr-mobile style
    marginLeft: 8,
  },
});
