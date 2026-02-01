/**
 * BalanceDisplay Component
 * 
 * Location: components/BalanceDisplay.tsx
 * Purpose: Reusable balance display with show/hide toggle and add funds button
 * 
 * Displays account balance with visibility toggle and add funds action
 * Requires PIN/biometric authentication to show balance (Security requirement)
 */

import React, { useState, useEffect, memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import TwoFactorVerification from './compliance/TwoFactorVerification';
import { apiPost } from '@/utils/apiClient';
import logger from '@/utils/logger';

interface BalanceDisplayProps {
  balance: number | string;
  currency?: string;
  showBalance?: boolean;
  onShowToggle?: () => void;
  onAddFunds?: () => void;
}

/**
 * BalanceDisplay Component (Memoized)
 *
 * Performance: Wrapped with React.memo to prevent re-renders when
 * parent re-renders with same props. Only re-renders when:
 * - balance changes
 * - showBalance changes
 * - callback references change
 */
const BalanceDisplay = memo(function BalanceDisplay({
  balance,
  currency = 'N$',
  showBalance: initialShowBalance = false,
  onShowToggle,
  onAddFunds,
}: BalanceDisplayProps) {
  const [balanceVisible, setBalanceVisible] = useState(initialShowBalance);
  const [show2FA, setShow2FA] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Sync with prop changes
  useEffect(() => {
    setBalanceVisible(initialShowBalance);
  }, [initialShowBalance]);

  /**
   * Handle balance toggle - requires 2FA to show balance
   * If balance is currently hidden, show 2FA modal
   * If balance is visible, hide it immediately (no 2FA needed to hide)
   */
  const handleToggle = () => {
    if (balanceVisible) {
      // Hide balance immediately (no auth needed)
      setBalanceVisible(false);
      onShowToggle?.();
    } else {
      // Show balance requires 2FA
      setShow2FA(true);
    }
  };

  /**
   * Verify 2FA (PIN or biometric) before showing balance
   */
  const handle2FAVerify = async (method: 'pin' | 'biometric', code?: string): Promise<boolean> => {
    try {
      setIsVerifying(true);
      
      // Call 2FA verification endpoint
      const response = await apiPost<{
        verified: boolean;
        verificationToken?: string;
      }>('/api/auth/verify-2fa', {
        method,
        pin: method === 'pin' ? code : undefined,
        biometricToken: method === 'biometric' ? 'verified' : undefined,
        transactionContext: {
          type: 'balance_reveal',
        },
      });

      if (response.verified) {
        // 2FA successful - show balance
        setBalanceVisible(true);
        setShow2FA(false);
        onShowToggle?.();
        return true;
      }

      return false;
    } catch (error) {
      logger.error('2FA verification error for balance reveal:', error);
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Handle 2FA completion
   */
  const handle2FAComplete = async (method: 'pin' | 'biometric', code?: string) => {
    const verified = await handle2FAVerify(method, code);
    if (!verified) {
      // Error is already handled in handle2FAVerify
      // Keep modal open for retry
    }
  };

  /**
   * Handle 2FA cancellation
   */
  const handle2FACancel = () => {
    setShow2FA(false);
  };

  const displayBalance = balanceVisible 
    ? (typeof balance === 'number' ? balance.toLocaleString() : balance)
    : 'XXX';

  return (
    <View style={styles.container}>
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceAmount}>
          {currency} {displayBalance}
        </Text>
        <Text style={styles.balanceLabel}>Total Balance</Text>
      </View>

      <View style={styles.balanceActions}>
        <TouchableOpacity
          style={[styles.balanceActionButton, { marginRight: 12 }]}
          onPress={handleToggle}
          activeOpacity={0.7}
        >
          <Text style={styles.balanceActionText}>
            {balanceVisible ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.balanceActionButton, styles.addFundsButton]}
          onPress={onAddFunds}
          activeOpacity={0.7}
        >
          <Text style={[styles.balanceActionText, styles.addFundsText]}>
            + Add
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2FA Verification Modal - Required to show balance */}
      <TwoFactorVerification
        visible={show2FA}
        onVerify={handle2FAComplete}
        onCancel={handle2FACancel}
        amount={0} // Not a payment, but required prop
        recipientName="Balance Reveal"
      />
    </View>
  );
});

export default BalanceDisplay;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  balanceContainer: {
    marginBottom: 20,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  balanceActions: {
    flexDirection: 'row',
    marginTop: 16,
  },
  balanceActionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25, // Pill-shaped
    backgroundColor: Colors.backgroundGray,
    minWidth: 80,
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
  },
  balanceActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  addFundsButton: {
    backgroundColor: Colors.primary,
  },
  addFundsText: {
    color: Colors.white,
  },
});
