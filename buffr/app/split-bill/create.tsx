/**
 * Split Bill - Create Screen
 * 
 * Location: app/split-bill/create.tsx
 * Purpose: Create a split bill request with multiple participants
 * 
 * Features:
 * - Add participants (by phone number or Buffr ID)
 * - Set individual amounts or split equally
 * - Add description
 * - 2FA verification before creation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import defaultStyles from '@/constants/Styles';
import { ScreenHeader, GlassCard, PillButton } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import { TwoFactorVerification } from '@/components/compliance/TwoFactorVerification';
import { apiPost } from '@/utils/apiClient';
import { log } from '@/utils/logger';

interface Participant {
  id: string;
  phoneNumber: string;
  name?: string;
  amount: string;
}

export default function SplitBillCreateScreen() {
  const router = useRouter();
  const { user } = useUser();
  const currency = user?.currency || 'N$';

  const [description, setDescription] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipantPhone, setNewParticipantPhone] = useState('');
  const [newParticipantAmount, setNewParticipantAmount] = useState('');
  const [splitEqually, setSplitEqually] = useState(true);
  const [totalAmount, setTotalAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [pendingCreation, setPendingCreation] = useState(false);

  const addParticipant = () => {
    if (!newParticipantPhone.trim()) {
      Alert.alert('Error', 'Please enter a phone number or Buffr ID');
      return;
    }

    const participant: Participant = {
      id: Date.now().toString(),
      phoneNumber: newParticipantPhone.trim(),
      amount: newParticipantAmount.trim() || '0',
    };

    setParticipants([...participants, participant]);
    setNewParticipantPhone('');
    setNewParticipantAmount('');
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  const calculateTotal = () => {
    if (splitEqually && totalAmount) {
      const amount = parseFloat(totalAmount);
      const share = amount / Math.max(participants.length, 1);
      return share.toFixed(2);
    }
    return participants.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0).toFixed(2);
  };

  const handleCreate = async () => {
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid total amount');
      return;
    }

    if (participants.length === 0) {
      Alert.alert('Error', 'Please add at least one participant');
      return;
    }

    // Calculate participant amounts
    const participantAmounts = splitEqually
      ? participants.map(() => parseFloat(totalAmount) / participants.length)
      : participants.map(p => parseFloat(p.amount || '0'));

    const sum = participantAmounts.reduce((s, a) => s + a, 0);
    if (Math.abs(sum - parseFloat(totalAmount)) > 0.01) {
      Alert.alert('Error', `Participant amounts (${sum.toFixed(2)}) must equal total amount (${totalAmount})`);
      return;
    }

    setPendingCreation(true);
    setShow2FA(true);
  };

  const handle2FASuccess = async (verificationToken: string) => {
    setShow2FA(false);
    setLoading(true);

    try {
      // Get default wallet
      const walletsResponse = await fetch('/api/wallets');
      const walletsData = await walletsResponse.json();
      const defaultWallet = walletsData.data?.find((w: any) => w.is_default) || walletsData.data?.[0];

      if (!defaultWallet) {
        Alert.alert('Error', 'No wallet found. Please create a wallet first.');
        setLoading(false);
        return;
      }

      // Prepare participants with amounts
      const participantData = participants.map((p, index) => ({
        phoneNumber: p.phoneNumber,
        amount: splitEqually
          ? parseFloat(totalAmount) / participants.length
          : parseFloat(p.amount || '0'),
      }));

      const response = await apiPost<{
        splitBillId: string;
        totalAmount: number;
        currency: string;
        participantCount: number;
        status: string;
        message: string;
      }>('/api/payments/split-bill', {
        totalAmount: parseFloat(totalAmount),
        currency: 'NAD',
        description: description.trim() || undefined,
        participants: participantData,
        walletId: defaultWallet.id,
        verificationToken,
      });

      if (response.splitBillId) {
        Alert.alert(
          'Success',
          'Split bill created successfully! Participants will be notified.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to create split bill');
      }
    } catch (error: any) {
      log.error('Error creating split bill:', error);
      Alert.alert('Error', error.message || 'Failed to create split bill');
    } finally {
      setLoading(false);
      setPendingCreation(false);
    }
  };

  const handle2FACancel = () => {
    setShow2FA(false);
    setPendingCreation(false);
  };

  return (
    <KeyboardAvoidingView
      style={defaultStyles.containerFull}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader title="Split Bill" showBackButton />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <GlassCard style={styles.card}>
          <Text style={styles.label}>Total Amount</Text>
          <TextInput
            style={styles.input}
            placeholder={`Enter total amount (${currency})`}
            placeholderTextColor={Colors.textSecondary}
            value={totalAmount}
            onChangeText={setTotalAmount}
            keyboardType="decimal-pad"
            editable={!splitEqually}
          />
        </GlassCard>

        <GlassCard style={styles.card}>
          <View style={styles.splitOptionRow}>
            <Text style={styles.label}>Split Equally</Text>
            <TouchableOpacity
              style={styles.toggle}
              onPress={() => setSplitEqually(!splitEqually)}
            >
              <View style={[styles.toggleSwitch, splitEqually && styles.toggleSwitchActive]}>
                <View style={[styles.toggleThumb, splitEqually && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Dinner at restaurant"
            placeholderTextColor={Colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.label}>Participants</Text>
          
          {/* Add Participant Form */}
          <View style={styles.addParticipantForm}>
            <TextInput
              style={[styles.input, styles.flex1]}
              placeholder="Phone number or Buffr ID"
              placeholderTextColor={Colors.textSecondary}
              value={newParticipantPhone}
              onChangeText={setNewParticipantPhone}
            />
            {!splitEqually && (
              <TextInput
                style={[styles.input, styles.amountInput]}
                placeholder="Amount"
                placeholderTextColor={Colors.textSecondary}
                value={newParticipantAmount}
                onChangeText={setNewParticipantAmount}
                keyboardType="decimal-pad"
              />
            )}
            <TouchableOpacity
              style={styles.addButton}
              onPress={addParticipant}
            >
              <FontAwesome name="plus" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Participants List */}
          {participants.length > 0 && (
            <View style={styles.participantsList}>
              {participants.map((participant, index) => (
                <View key={participant.id} style={styles.participantItem}>
                  <View style={styles.flex1}>
                    <Text style={styles.participantPhone}>{participant.phoneNumber}</Text>
                    {splitEqually && totalAmount ? (
                      <Text style={styles.participantAmount}>
                        {currency} {(parseFloat(totalAmount) / participants.length).toFixed(2)}
                      </Text>
                    ) : (
                      <Text style={styles.participantAmount}>
                        {currency} {parseFloat(participant.amount || '0').toFixed(2)}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeParticipant(participant.id)}
                  >
                    <FontAwesome name="times" size={18} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {participants.length > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>
                {currency} {calculateTotal()}
              </Text>
            </View>
          )}
        </GlassCard>

        <PillButton
          title={loading ? 'Creating...' : 'Create Split Bill'}
          onPress={handleCreate}
          disabled={loading || participants.length === 0 || !totalAmount}
          style={styles.createButton}
        />
      </ScrollView>

      {show2FA && (
        <TwoFactorVerification
          visible={show2FA}
          onVerify={handle2FASuccess}
          onCancel={handle2FACancel}
          amount={parseFloat(totalAmount) || 0}
          recipientName="Split Bill Participants"
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  card: {
    marginBottom: 0,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  splitOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggle: {
    marginLeft: 16,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  addParticipantForm: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  amountInput: {
    width: 100,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantsList: {
    marginTop: 16,
    gap: 12,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  participantPhone: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  participantAmount: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  createButton: {
    marginTop: 8,
  },
});
