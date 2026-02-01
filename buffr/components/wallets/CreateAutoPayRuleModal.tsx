/**
 * Create AutoPay Rule Modal Component
 *
 * A comprehensive modal for creating new AutoPay rules with validation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { PillButton } from '@/components/common';
import { HORIZONTAL_PADDING, SECTION_SPACING, CARD_GAP } from '@/constants/Layout';

interface CreateAutoPayRuleModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateRule: (rule: NewAutoPayRule) => void;
  walletCurrency?: string;
}

export interface NewAutoPayRule {
  ruleType: 'recurring' | 'scheduled' | 'minimum_balance' | 'low_balance_alert';
  amount: number;
  frequency?: 'weekly' | 'bi-weekly' | 'monthly';
  recipientName?: string;
  recipientId?: string;
  description: string;
}

export default function CreateAutoPayRuleModal({
  visible,
  onClose,
  onCreateRule,
  walletCurrency = 'NAD',
}: CreateAutoPayRuleModalProps) {
  const [ruleType, setRuleType] = useState<'recurring' | 'scheduled' | 'minimum_balance' | 'low_balance_alert'>('recurring');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'bi-weekly' | 'monthly'>('monthly');
  const [recipientName, setRecipientName] = useState('');
  const [description, setDescription] = useState('');

  const ruleTypes = [
    { value: 'recurring', label: 'Recurring Payment', icon: 'repeat' },
    { value: 'scheduled', label: 'Scheduled Payment', icon: 'calendar' },
    { value: 'minimum_balance', label: 'Minimum Balance', icon: 'line-chart' },
    { value: 'low_balance_alert', label: 'Low Balance Alert', icon: 'bell' },
  ];

  const frequencies = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Bi-Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const handleCreate = () => {
    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please provide a description for this rule');
      return;
    }

    if ((ruleType === 'recurring' || ruleType === 'scheduled') && !recipientName.trim()) {
      Alert.alert('Missing Recipient', 'Please specify a recipient for payment rules');
      return;
    }

    // Create the rule
    const newRule: NewAutoPayRule = {
      ruleType,
      amount: parseFloat(amount),
      description: description.trim(),
    };

    if (ruleType === 'recurring' || ruleType === 'scheduled') {
      newRule.frequency = frequency;
      newRule.recipientName = recipientName.trim();
    }

    onCreateRule(newRule);
    handleClose();
  };

  const handleClose = () => {
    // Reset form
    setRuleType('recurring');
    setAmount('');
    setFrequency('monthly');
    setRecipientName('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create AutoPay Rule</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <FontAwesome name="times" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Rule Type Selection */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Rule Type</Text>
              <View style={styles.ruleTypeGrid}>
                {ruleTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.ruleTypeCard,
                      ruleType === type.value && styles.ruleTypeCardActive,
                    ]}
                    onPress={() => setRuleType(type.value as any)}
                  >
                    <FontAwesome
                      name={type.icon as any}
                      size={24}
                      color={ruleType === type.value ? Colors.primary : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.ruleTypeLabel,
                        ruleType === type.value && styles.ruleTypeLabelActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Amount ({walletCurrency})</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={Colors.textSecondary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Frequency (for recurring/scheduled) */}
            {(ruleType === 'recurring' || ruleType === 'scheduled') && (
              <View style={styles.formSection}>
                <Text style={styles.label}>Frequency</Text>
                <View style={styles.frequencyButtons}>
                  {frequencies.map((freq) => (
                    <TouchableOpacity
                      key={freq.value}
                      style={[
                        styles.frequencyButton,
                        frequency === freq.value && styles.frequencyButtonActive,
                      ]}
                      onPress={() => setFrequency(freq.value as any)}
                    >
                      <Text
                        style={[
                          styles.frequencyButtonText,
                          frequency === freq.value && styles.frequencyButtonTextActive,
                        ]}
                      >
                        {freq.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Recipient (for recurring/scheduled) */}
            {(ruleType === 'recurring' || ruleType === 'scheduled') && (
              <View style={styles.formSection}>
                <Text style={styles.label}>Recipient</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter recipient name or phone"
                  placeholderTextColor={Colors.textSecondary}
                  value={recipientName}
                  onChangeText={setRecipientName}
                />
              </View>
            )}

            {/* Description */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter a description for this rule"
                placeholderTextColor={Colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Info Text */}
            <View style={styles.infoBox}>
              <FontAwesome name="info-circle" size={16} color={Colors.info} />
              <Text style={styles.infoText}>
                {ruleType === 'recurring' && 'This rule will automatically send payments on a recurring schedule.'}
                {ruleType === 'scheduled' && 'This rule will execute payments at scheduled times.'}
                {ruleType === 'minimum_balance' && 'This rule will top up your wallet when balance falls below the amount.'}
                {ruleType === 'low_balance_alert' && 'This rule will send you alerts when balance is low.'}
              </Text>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <PillButton
              label="Cancel"
              variant="secondary"
              onPress={handleClose}
              style={styles.footerButton}
            />
            <PillButton
              label="Create Rule"
              variant="primary"
              onPress={handleCreate}
              style={styles.footerButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  ruleTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  ruleTypeCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
  },
  ruleTypeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  ruleTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  ruleTypeLabelActive: {
    color: Colors.primary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 80,
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  frequencyButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  frequencyButtonTextActive: {
    color: Colors.primary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: CARD_GAP,
    padding: 16,
    backgroundColor: Colors.info + '10',
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.info,
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: CARD_GAP,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerButton: {
    flex: 1,
  },
});
