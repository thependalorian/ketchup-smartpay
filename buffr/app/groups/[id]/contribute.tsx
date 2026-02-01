/**
 * Group Contribute Screen
 * 
 * Location: app/groups/[id]/contribute.tsx
 * Purpose: Allow group members to contribute money to group savings
 * 
 * Features:
 * - Amount input with quick buttons
 * - Select payment source
 * - Optional note
 * - Contribution confirmation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import defaultStyles from '@/constants/Styles';
import { ScreenHeader, GlassCard, PillButton, PayFromSelector, PaymentSource } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import Layout from '@/constants/Layout';
import { formatCurrency } from '@/utils/formatters';
import { log } from '@/utils/logger';

interface Group {
  id: string;
  name: string;
  totalAmount: number;
}

const QUICK_AMOUNTS = [100, 250, 500, 1000];

export default function GroupContributeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const currency = user?.currency || 'N$';
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedSource, setSelectedSource] = useState<PaymentSource | null>(null);
  const [showPayFromSelector, setShowPayFromSelector] = useState(false);

  // Load group data
  useEffect(() => {
    const loadGroup = async () => {
      setLoading(true);
      try {
        const { apiGet } = await import('@/utils/apiClient');
        const data = await apiGet<Group>(`/groups/${params.id}`);
        setGroup(data);
      } catch (error: any) {
        log.error('Error loading group:', error);
        Alert.alert('Error', 'Failed to load group details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadGroup();
    }
  }, [params.id]);

  // Initialize default payment source
  useEffect(() => {
    if (!selectedSource && user) {
      setSelectedSource({
        id: 'buffr-account',
        name: 'Buffr Account',
        displayName: 'Buffr Account',
        type: 'buffr',
        balance: user.buffrCardBalance,
        currency: user.currency,
      });
    }
  }, [user, selectedSource]);

  const handleBack = () => {
    router.back();
  };

  const handleAmountChange = (text: string) => {
    // Only allow numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    // Only allow one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) return;
    setAmount(cleaned);
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleContribute = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid contribution amount');
      return;
    }

    if (!selectedSource) {
      Alert.alert('Select Payment Source', 'Please select a payment source');
      return;
    }

    const contributionAmount = parseFloat(amount);

    // Check balance
    if (selectedSource.balance !== undefined && contributionAmount > selectedSource.balance) {
      Alert.alert('Insufficient Balance', 'You don\'t have enough funds in the selected account');
      return;
    }

    setSubmitting(true);
    try {
      const { apiPost } = await import('@/utils/apiClient');
      await apiPost(`/groups/${params.id}/contribute`, {
        amount: contributionAmount,
        currency,
        note,
        paymentSourceId: selectedSource.id,
        paymentSourceType: selectedSource.type,
      });

      Alert.alert(
        'Contribution Successful',
        `You have contributed ${formatCurrency(contributionAmount, currency)} to ${group?.name}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      log.error('Contribution error:', error);
      Alert.alert('Error', error.message || 'Failed to make contribution');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={defaultStyles.container}>
        <ScreenHeader title="Contribute" showBackButton onBack={handleBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader 
        title="Contribute" 
        showBackButton 
        onBack={handleBack}
        subtitle={group?.name}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Group Info */}
        <GlassCard style={styles.groupCard} padding={16} borderRadius={16}>
          <View style={styles.groupInfo}>
            <View style={styles.groupIcon}>
              <FontAwesome name="users" size={24} color={Colors.primary} />
            </View>
            <View style={styles.groupDetails}>
              <Text style={styles.groupName}>{group?.name}</Text>
              <Text style={styles.groupBalance}>
                Current Balance: {formatCurrency(group?.totalAmount || 0, currency)}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Amount Input */}
        <GlassCard style={styles.amountCard} padding={24} borderRadius={16}>
          <Text style={styles.inputLabel}>Contribution Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencyPrefix}>{currency}</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmounts}>
            {QUICK_AMOUNTS.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.quickAmountButton,
                  amount === value.toString() && styles.quickAmountButtonActive,
                ]}
                onPress={() => handleQuickAmount(value)}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    amount === value.toString() && styles.quickAmountTextActive,
                  ]}
                >
                  {formatCurrency(value, currency)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* Payment Source */}
        <GlassCard style={styles.sourceCard} padding={16} borderRadius={16}>
          <TouchableOpacity
            style={styles.sourceSelector}
            onPress={() => setShowPayFromSelector(true)}
          >
            <View style={styles.sourceLeft}>
              <View style={styles.sourceIcon}>
                <FontAwesome 
                  name={selectedSource?.type === 'card' ? 'credit-card' : 'bank'} 
                  size={20} 
                  color={Colors.primary} 
                />
              </View>
              <View>
                <Text style={styles.sourceLabel}>Pay From</Text>
                <Text style={styles.sourceName}>
                  {selectedSource?.displayName || 'Select payment source'}
                </Text>
                {selectedSource?.balance !== undefined && (
                  <Text style={styles.sourceBalance}>
                    Balance: {formatCurrency(selectedSource.balance, selectedSource.currency || currency)}
                  </Text>
                )}
              </View>
            </View>
            <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </GlassCard>

        {/* Note Input */}
        <GlassCard style={styles.noteCard} padding={16} borderRadius={16}>
          <Text style={styles.inputLabel}>Note (Optional)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note for this contribution..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={3}
          />
        </GlassCard>

        {/* Contribute Button */}
        <View style={styles.buttonContainer}>
          <PillButton
            label={submitting ? 'Contributing...' : 'Contribute'}
            variant="primary"
            onPress={handleContribute}
            disabled={submitting || !amount || parseFloat(amount) <= 0}
          />
        </View>
      </ScrollView>

      {/* Pay From Selector Modal */}
      <PayFromSelector
        visible={showPayFromSelector}
        onClose={() => setShowPayFromSelector(false)}
        onSelectSource={(source: PaymentSource) => {
          setSelectedSource(source);
          setShowPayFromSelector(false);
        }}
        selectedSourceId={selectedSource?.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
    paddingTop: Layout.SECTION_SPACING,
    paddingBottom: 40,
    gap: Layout.SECTION_SPACING,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.CARD_GAP,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  groupCard: {},
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  groupIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  groupBalance: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  amountCard: {},
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  currencyPrefix: {
    fontSize: 32,
    fontWeight: '600',
    color: Colors.text,
  },
  amountInput: {
    flex: 1,
    fontSize: 48,
    fontWeight: '700',
    color: Colors.text,
    padding: 0,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  quickAmountButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.slate100,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  quickAmountButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  quickAmountTextActive: {
    color: Colors.white,
  },
  sourceCard: {},
  sourceSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.CARD_GAP,
  },
  sourceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  sourceBalance: {
    fontSize: 12,
    color: Colors.success,
    marginTop: 2,
  },
  noteCard: {},
  noteInput: {
    fontSize: 16,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 8,
  },
});
