/**
 * BankLogo Component
 * 
 * Location: components/banks/BankLogo.tsx
 * Purpose: Displays bank logo as styled initials with brand colors
 * 
 * Used in:
 * - AddBankForm (bank selection list)
 * - PayFromSelector (bank payment sources)
 * - Transaction history (bank transfers)
 * - SelectMethod (payment method selection)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { NamibianBank, getBankById, getBankByName } from '@/constants/Banks';

interface BankLogoProps {
  /** Bank ID from NAMIBIAN_BANKS */
  bankId?: string;
  /** Or pass the bank object directly */
  bank?: NamibianBank;
  /** Or pass just the bank name for fallback display */
  bankName?: string;
  /** Size of the logo container (default: 48) */
  size?: number;
  /** Custom background color (overrides bank color) */
  backgroundColor?: string;
  /** Show border around the logo */
  showBorder?: boolean;
}

/**
 * Get bank initials from name
 * Uses recognizable abbreviations for major Namibian banks
 */
const getBankInitials = (name: string): string => {
  const lowerName = name.toLowerCase();
  
  // Major Namibian banks with recognizable abbreviations
  if (lowerName.includes('fnb') || lowerName.includes('first national')) {
    return 'FNB';
  }
  if (lowerName.includes('windhoek')) {
    return 'BW';
  }
  if (lowerName.includes('standard')) {
    return 'SB';
  }
  if (lowerName.includes('nedbank')) {
    return 'NB';
  }
  if (lowerName.includes('bic')) {
    return 'BIC';
  }
  if (lowerName.includes('letshego')) {
    return 'LB';
  }
  if (lowerName.includes('atlantico')) {
    return 'BA';
  }
  
  // Default: take first letters of each word (max 3)
  return name
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 3)
    .toUpperCase();
};

export default function BankLogo({
  bankId,
  bank,
  bankName,
  size = 48,
  backgroundColor,
  showBorder = false,
}: BankLogoProps) {
  // Get bank data from ID or name if provided
  const bankData = bank || 
    (bankId ? getBankById(bankId) : undefined) ||
    (bankName ? getBankByName(bankName) : undefined);
  
  // Get the display name for initials
  const displayName = bankData?.shortName || bankName || 'Bank';
  
  // Get initials and colors
  const initials = getBankInitials(displayName);
  const bgColor = backgroundColor || bankData?.color || Colors.primary;
  const borderRadius = size / 2;
  const fontSize = size * (initials.length > 2 ? 0.28 : 0.35);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: bgColor,
        },
        showBorder && styles.border,
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  border: {
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  initials: {
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
