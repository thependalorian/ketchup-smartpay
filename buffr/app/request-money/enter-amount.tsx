/**
 * Request Money - Enter Amount Screen (Step 2)
 * 
 * Location: app/request-money/enter-amount.tsx
 * Purpose: Enter amount and optional note for money request
 * 
 * Features:
 * - Recipient display with glass card
 * - Amount input with quick buttons
 * - Optional note field
 * - Glass effect components
 * - Real estate planning
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING } from '@/constants/Layout';
import defaultStyles from '@/constants/Styles';
import { ScreenHeader, ContactDetailCard, NoteInputModal, PillButton, GlassCard } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import Layout from '@/constants/Layout';

const QUICK_AMOUNT_BUTTONS = [100, 500, 1000, 2000];

export default function RequestMoneyEnterAmountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    contactId?: string;
    contactName?: string;
    contactPhone?: string;
  }>();
  
  const { user } = useUser();
  const currency = user?.currency || 'N$';
  
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);

  const contactData = {
    id: params.contactId || '',
    name: params.contactName || 'Contact',
    phoneNumber: params.contactPhone || '',
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const handleContinue = () => {
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (numAmount < 1) {
      Alert.alert('Invalid Amount', 'Minimum amount is N$ 1');
      return;
    }

    // Navigate to confirmation screen
    router.push({
      pathname: '/request-money/confirm',
      params: {
        contactId: contactData.id,
        contactName: contactData.name,
        contactPhone: contactData.phoneNumber,
        amount: amount,
        note: note,
      },
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={defaultStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScreenHeader title="Request Money" showBackButton onBack={handleBack} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Recipient Card - Glass Effect */}
        <GlassCard style={styles.recipientCard} padding={16} borderRadius={16}>
          <ContactDetailCard
            contact={{
              id: contactData.id,
              name: contactData.name,
              phoneNumber: contactData.phoneNumber,
            }}
          />
        </GlassCard>

        {/* Amount Section */}
        <View style={styles.amountSection}>
          <Text style={styles.sectionLabel}>Request Amount</Text>
          
          {/* Amount Input - Glass Card */}
          <GlassCard style={styles.amountCard} padding={16} borderRadius={16}>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>{currency}</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={Colors.textSecondary}
                value={amount}
                onChangeText={(text) => {
                  // Allow only numbers and one decimal point
                  const cleaned = text.replace(/[^0-9.]/g, '');
                  const parts = cleaned.split('.');
                  if (parts.length > 2) return;
                  if (parts[1] && parts[1].length > 2) return;
                  setAmount(cleaned);
                }}
                keyboardType="decimal-pad"
                autoFocus={false}
              />
            </View>
          </GlassCard>

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmountContainer}>
            {QUICK_AMOUNT_BUTTONS.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={[
                  styles.quickAmountButton,
                  amount === quickAmount.toString() && styles.quickAmountButtonActive,
                ]}
                onPress={() => handleQuickAmount(quickAmount)}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    amount === quickAmount.toString() && styles.quickAmountTextActive,
                  ]}
                >
                  {currency} {quickAmount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Note Section */}
        <View style={styles.noteSection}>
          <TouchableOpacity
            style={styles.noteButton}
            onPress={() => setShowNoteModal(true)}
          >
            <FontAwesome name="sticky-note-o" size={18} color={Colors.primary} />
            <Text style={styles.noteButtonText}>
              {note ? 'Edit Note' : 'Add Note (Optional)'}
            </Text>
            {note && (
              <FontAwesome name="check-circle" size={18} color={Colors.success} />
            )}
          </TouchableOpacity>
          
          {note && (
            <GlassCard style={styles.notePreviewCard} padding={12} borderRadius={12}>
              <Text style={styles.notePreviewText}>{note}</Text>
            </GlassCard>
          )}
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <PillButton
            label="Continue"
            variant="primary"
            onPress={handleContinue}
            disabled={!amount || parseFloat(amount) <= 0}
          />
        </View>
      </ScrollView>

      {/* Note Input Modal */}
      <NoteInputModal
        visible={showNoteModal}
        initialNote={note}
        onClose={() => setShowNoteModal(false)}
        onSave={(newNote) => {
          setNote(newNote);
          setShowNoteModal(false);
        }}
        maxLength={100}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
    paddingTop: Layout.SECTION_SPACING,
    paddingBottom: Layout.LARGE_SECTION_SPACING.SECTION_SPACING,
  },
  recipientCard: {
    marginBottom: Layout.LARGE_SECTION_SPACING.SECTION_SPACING,
  },
  amountSection: {
    marginBottom: Layout.LARGE_SECTION_SPACING.SECTION_SPACING,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  amountCard: {
    marginBottom: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.CARD_GAP,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text,
  },
  quickAmountContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.CARD_GAP,
  },
  quickAmountButton: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickAmountButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  quickAmountTextActive: {
    color: Colors.white,
  },
  noteSection: {
    marginBottom: Layout.LARGE_SECTION_SPACING.SECTION_SPACING,
  },
  noteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  noteButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  notePreviewCard: {
    marginTop: 12,
  },
  notePreviewText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 8,
  },
});
