/**
 * AutoPay Rules Management Screen
 * 
 * Location: app/wallets/[id]/autopay/rules.tsx
 * Purpose: Create, edit, and manage AutoPay rules
 * 
 * Features:
 * - View all AutoPay rules for a wallet
 * - Create new AutoPay rules
 * - Edit existing rules
 * - Delete rules
 * - Enable/disable rules
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useWallets } from '@/contexts/WalletsContext';
import { ScreenHeader, SectionHeader, PillButton, ErrorState } from '@/components/common';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/components/layouts';
import Colors from '@/constants/Colors';
import { formatCurrency } from '@/utils/formatters';
import CreateAutoPayRuleModal, { NewAutoPayRule } from '@/components/wallets/CreateAutoPayRuleModal';

interface AutoPayRule {
  id: string;
  ruleType: 'recurring' | 'scheduled' | 'minimum_balance' | 'low_balance_alert';
  amount: number;
  frequency?: 'weekly' | 'bi-weekly' | 'monthly';
  recipientId?: string;
  recipientName?: string;
  description: string;
  isActive: boolean;
  nextExecutionDate?: string;
  maxAmount?: number;
}

export default function AutoPayRulesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getWalletById } = useWallets();
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [rules, setRules] = useState<AutoPayRule[]>([]);

  const wallet = useMemo(() => {
    return id ? getWalletById(id) : null;
  }, [id, getWalletById]);

  useEffect(() => {
    // Load rules from wallet settings
    // In production, this would fetch from API
    if (wallet?.autoPayEnabled) {
      // Create rule from wallet settings
      const walletRule: AutoPayRule = {
        id: 'wallet-rule-1',
        ruleType: 'recurring',
        amount: wallet.autoPayAmount || 0,
        frequency: wallet.autoPayFrequency,
        description: `AutoPay for ${wallet.name}`,
        isActive: true,
        maxAmount: wallet.autoPayMaxAmount,
      };
      setRules([walletRule]);
    }
  }, [wallet]);

  const handleBack = () => {
    router.back();
  };

  const handleCreateRule = () => {
    setShowCreateRule(true);
  };

  const handleSaveNewRule = (newRule: NewAutoPayRule) => {
    // Generate a unique ID for the rule
    const ruleId = `rule-${Date.now()}`;

    const autoPayRule: AutoPayRule = {
      id: ruleId,
      ...newRule,
      isActive: true,
      nextExecutionDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    };

    setRules((prev) => [...prev, autoPayRule]);

    // In production, this would save to the API
    // await createAutoPayRule(id, autoPayRule);

    Alert.alert('Rule Created', `AutoPay rule "${newRule.description}" has been created successfully.`);
  };

  const handleDeleteRule = (ruleId: string) => {
    Alert.alert(
      'Delete Rule',
      'Are you sure you want to delete this AutoPay rule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setRules((prev) => prev.filter((r) => r.id !== ruleId));
          },
        },
      ]
    );
  };

  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r))
    );
  };

  if (!wallet) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="AutoPay Rules" onBack={handleBack} />
        <ErrorState
          title="Wallet not found"
          message="The wallet you're looking for doesn't exist or has been deleted."
        />
      </View>
    );
  }

  if (!wallet.autoPayEnabled) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="AutoPay Rules" onBack={handleBack} />
        <View style={styles.emptyState}>
          <FontAwesome name="repeat" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>AutoPay Not Enabled</Text>
          <Text style={styles.emptyMessage}>
            Enable AutoPay in wallet settings to create rules
          </Text>
          <PillButton
            label="Go to Settings"
            variant="primary"
            onPress={() => router.push(`/wallets/${id}/settings`)}
            style={styles.emptyButton}
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="AutoPay Rules" onBack={handleBack} />

      {/* Rules List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SectionHeader title="Active Rules" />
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateRule}
          >
            <FontAwesome name="plus" size={16} color={Colors.primary} />
            <Text style={styles.addButtonText}>Add Rule</Text>
          </TouchableOpacity>
        </View>

        {rules.length === 0 ? (
          <View style={styles.emptyRules}>
            <FontAwesome name="list" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyRulesText}>No AutoPay rules yet</Text>
            <Text style={styles.emptyRulesSubtext}>
              Create a rule to automate your payments
            </Text>
            <PillButton
              label="Create First Rule"
              variant="primary"
              onPress={handleCreateRule}
              style={styles.emptyButton}
            />
          </View>
        ) : (
          <View style={styles.rulesList}>
            {rules.map((rule) => (
              <View key={rule.id} style={styles.ruleCard}>
                <View style={styles.ruleHeader}>
                  <View style={styles.ruleInfo}>
                    <Text style={styles.ruleDescription}>{rule.description}</Text>
                    <Text style={styles.ruleType}>
                      {rule.ruleType.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.toggleSwitch,
                      rule.isActive && styles.toggleSwitchActive,
                    ]}
                    onPress={() => handleToggleRule(rule.id)}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        rule.isActive && styles.toggleThumbActive,
                      ]}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.ruleDetails}>
                  <View style={styles.ruleDetailRow}>
                    <Text style={styles.ruleDetailLabel}>Amount:</Text>
                    <Text style={styles.ruleDetailValue}>
                      {formatCurrency(rule.amount, wallet.currency)}
                    </Text>
                  </View>
                  {rule.frequency && (
                    <View style={styles.ruleDetailRow}>
                      <Text style={styles.ruleDetailLabel}>Frequency:</Text>
                      <Text style={styles.ruleDetailValue}>
                        {rule.frequency.charAt(0).toUpperCase() + rule.frequency.slice(1).replace('-', ' ')}
                      </Text>
                    </View>
                  )}
                  {rule.nextExecutionDate && (
                    <View style={styles.ruleDetailRow}>
                      <Text style={styles.ruleDetailLabel}>Next Execution:</Text>
                      <Text style={styles.ruleDetailValue}>
                        {new Date(rule.nextExecutionDate).toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.ruleActions}>
                  <TouchableOpacity
                    style={styles.ruleActionButton}
                    onPress={() => {
                      // Navigate to edit rule screen
                      Alert.alert('Edit Rule', 'Edit functionality coming soon');
                    }}
                  >
                    <FontAwesome name="edit" size={16} color={Colors.primary} />
                    <Text style={styles.ruleActionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.ruleActionButton, styles.deleteButton]}
                    onPress={() => handleDeleteRule(rule.id)}
                  >
                    <FontAwesome name="trash" size={16} color={Colors.error} />
                    <Text style={[styles.ruleActionText, styles.deleteText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <FontAwesome name="info-circle" size={20} color={Colors.info} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>About AutoPay Rules</Text>
          <Text style={styles.infoText}>
            Create rules to automate payments based on schedule, balance, or events.
            Rules can be enabled or disabled at any time.
          </Text>
        </View>
      </View>

      {/* Create Rule Modal */}
      <CreateAutoPayRuleModal
        visible={showCreateRule}
        onClose={() => setShowCreateRule(false)}
        onCreateRule={handleSaveNewRule}
        walletCurrency={wallet.currency}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: HORIZONTAL_PADDING,
    paddingBottom: 40,
  },
  section: {
    marginBottom: SECTION_SPACING,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primary + '20',
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 8,
  },
  emptyRules: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyRulesText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyRulesSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  rulesList: {
    gap: 12,
  },
  ruleCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ruleInfo: {
    flex: 1,
  },
  ruleDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  ruleType: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.white,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  ruleDetails: {
    gap: 8,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ruleDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ruleDetailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  ruleDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  ruleActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ruleActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.backgroundGray,
  },
  deleteButton: {
    backgroundColor: Colors.error + '20',
  },
  ruleActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  deleteText: {
    color: Colors.error,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.info + '20',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: SECTION_SPACING,
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
