/**
 * Send Money: Select Method Screen
 * 
 * Location: app/send-money/select-method.tsx
 * 
 * Purpose: Second step in the send money flow. User selects payment method and adds an optional note.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { HORIZONTAL_PADDING } from '@/constants/Layout';
import { ScreenHeader, PayFromSelector, PaymentSource, NoteInputModal, PillButton } from '@/components/common';
import { useUser } from '@/contexts/UserContext';

export default function SelectMethodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    contactId?: string;
    contactName?: string;
    contactPhone?: string;
    amount?: string;
  }>();

  const { user } = useUser();
  const [note, setNote] = useState('');
  const [selectedPaymentSource, setSelectedPaymentSource] = useState<PaymentSource | null>(null);
  const [showPayFromSelector, setShowPayFromSelector] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Initialize with default payment source (Buffr Account)
  React.useEffect(() => {
    if (!selectedPaymentSource && user) {
      setSelectedPaymentSource({
        id: 'buffr-account',
        name: 'Buffr Account',
        displayName: 'Buffr Account',
        type: 'buffr',
        balance: user.buffrCardBalance,
        currency: user.currency || 'N$',
      });
    }
  }, [user, selectedPaymentSource]);

  const getPaymentSourceDisplay = () => {
    if (!selectedPaymentSource) {
      return { name: 'Select Payment Method', icon: 'credit-card', balance: undefined, last4: undefined };
    }
    return {
      name: selectedPaymentSource.displayName || selectedPaymentSource.name,
      icon: selectedPaymentSource.type === 'wallet' && selectedPaymentSource.icon
        ? selectedPaymentSource.icon
        : selectedPaymentSource.type === 'card'
        ? 'credit-card'
        : selectedPaymentSource.type === 'bank'
        ? 'bank'
        : 'credit-card',
      balance: selectedPaymentSource.balance,
      last4: selectedPaymentSource.last4,
    };
  };

  const paymentSourceDisplay = getPaymentSourceDisplay();

  const handleContinue = () => {
    if (!selectedPaymentSource) {
      Alert.alert('Error', 'Please select a payment method.');
      return;
    }
    router.push({
      pathname: '/send-money/confirm-payment',
      params: { ...params, note, paymentSourceId: selectedPaymentSource.id },
    });
  };

  return (
    <View style={defaultStyles.containerFull}>
      <ScreenHeader
        title="Select Method"
        showBackButton
        onBack={() => router.back()}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.summarySection}>
          <Text style={styles.summaryText}>Sending</Text>
          <Text style={styles.summaryAmount}>
            {user?.currency || 'N$'}
            {parseFloat(params.amount || '0').toFixed(2)}
          </Text>
          <Text style={styles.summaryText}>to {params.contactName}</Text>
        </View>

        <View style={styles.paymentSection}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Pay from</Text>
            <TouchableOpacity
              style={styles.payFromButton}
              onPress={() => setShowPayFromSelector(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.payFromIcon, { backgroundColor: selectedPaymentSource?.color || Colors.primaryMuted }]}>
                <FontAwesome name={paymentSourceDisplay.icon as any} size={20} color={Colors.primary} />
              </View>
              <View style={styles.payFromContent}>
                <Text style={styles.payFromName}>{paymentSourceDisplay.name}</Text>
                {paymentSourceDisplay.balance !== undefined && (
                  <Text style={styles.payFromBalance}>
                    Balance: {user?.currency || 'N$'}{' '}
                    {paymentSourceDisplay.balance.toLocaleString()}
                  </Text>
                )}
                {paymentSourceDisplay.last4 && (
                  <Text style={styles.payFromLast4}>•••• {paymentSourceDisplay.last4}</Text>
                )}
              </View>
              <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <PayFromSelector
            visible={showPayFromSelector}
            onClose={() => setShowPayFromSelector(false)}
            selectedSourceId={selectedPaymentSource?.id}
            onSelectSource={setSelectedPaymentSource}
            title="Pay From"
            subtitle="Choose a source for the payment."
            onAddNew={() => router.push('/add-card')}
          />

          <View style={styles.fieldGroup}>
            <TouchableOpacity
              style={styles.noteButton}
              onPress={() => setShowNoteModal(true)}
              activeOpacity={0.7}
            >
              <FontAwesome name="pencil" size={16} color={Colors.primary} />
              <Text style={styles.noteButtonText}>
                {note ? note.substring(0, 30) + (note.length > 30 ? '...' : '') : 'Add a note'}
              </Text>
              {note && (
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); setNote(''); }}
                  style={styles.clearNoteButton}
                >
                  <FontAwesome name="times-circle" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>

          <NoteInputModal
            visible={showNoteModal}
            onClose={() => setShowNoteModal(false)}
            onSave={setNote}
            initialNote={note}
            title="Add Note"
            placeholder="Enter a note for this payment..."
            maxLength={200}
          />
        </View>
      </ScrollView>

      <View style={styles.continueButtonContainer}>
        <PillButton
          label="Continue"
          variant="primary"
          onPress={handleContinue}
          disabled={!selectedPaymentSource}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: HORIZONTAL_PADDING,
    paddingBottom: 120,
  },
  summarySection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  summaryText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  summaryAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.text,
    marginVertical: 8,
  },
  paymentSection: {
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  payFromButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 70,
    gap: 12,
  },
  payFromIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payFromContent: {
    flex: 1,
  },
  payFromName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  payFromBalance: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  payFromLast4: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  noteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 50,
    gap: 8,
  },
  noteButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
    flex: 1,
  },
  clearNoteButton: {
    padding: 4,
  },
  continueButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: HORIZONTAL_PADDING,
    paddingBottom: 40,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
