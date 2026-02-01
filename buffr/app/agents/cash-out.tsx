/**
 * Agent Cash-Out Screen
 * 
 * Location: app/agents/cash-out.tsx
 * Purpose: Initiate cash-out at agent location
 * 
 * Flow:
 * 1. Agent details display
 * 2. Enter cash-out amount
 * 3. Confirm details
 * 4. Generate QR code or voucher code for agent
 * 5. Visit agent with code
 * 6. Agent verifies and dispenses cash
 * 
 * Based on: Buffr App Design wireframes + Apple HIG
 * Design System: Uses exact values from wireframes
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import QRCode from 'react-native-qrcode-svg';
import { StandardScreenLayout } from '@/components/layouts';
import { GlassCard, PillButton } from '@/components/common';
import TwoFactorVerification from '@/components/compliance/TwoFactorVerification';
import { useUser } from '@/contexts/UserContext';
import { useWallets } from '@/contexts/WalletsContext';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';
import { apiGet, apiPost } from '@/utils/apiClient';
import { log } from '@/utils/logger';

interface Agent {
  id: string;
  name: string;
  location: string;
  address: string;
  maxCashOut?: number;
  commissionRate?: number;
}

export default function AgentCashOutScreen() {
  const router = useRouter();
  const { agentId } = useLocalSearchParams<{ agentId: string }>();
  const { user } = useUser();
  const { wallets, getDefaultWallet } = useWallets();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [cashOutAmount, setCashOutAmount] = useState<string>('');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [show2FA, setShow2FA] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [cashOutCode, setCashOutCode] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const currency = user?.currency || 'N$';

  useEffect(() => {
    if (agentId) {
      fetchAgentDetails();
    }
    const defaultWallet = getDefaultWallet();
    if (defaultWallet) {
      setSelectedWalletId(defaultWallet.id);
    }
  }, [agentId]);

  const fetchAgentDetails = async () => {
    try {
      setLoading(true);
      const response = await apiGet<any>(`/api/v1/agents/${agentId}`);
      if (response && response.Agent) {
        const a = response.Agent;
        setAgent({
          id: a.AgentId,
          name: a.Name,
          location: a.Location,
          address: a.Location,
          maxCashOut: a.Limits?.MaxDailyCashout,
          commissionRate: a.Commission?.Rate,
        });
      }
    } catch (error) {
      log.error('Failed to fetch agent details:', error);
      Alert.alert('Error', 'Failed to load agent details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!agent || !selectedWalletId) {
      Alert.alert('Error', 'Please select a wallet');
      return;
    }

    const amount = parseFloat(cashOutAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid cash-out amount');
      return;
    }

    if (agent.maxCashOut && amount > agent.maxCashOut) {
      Alert.alert('Error', `Maximum cash-out is ${currency}${agent.maxCashOut.toLocaleString()}`);
      return;
    }

    setShow2FA(true);
  };

  const handle2FAComplete = async (method: 'pin' | 'biometric', code?: string): Promise<boolean> => {
    setVerificationToken('verified_token');
    setShow2FA(false);
    await processCashOut();
    return true;
  };

  const processCashOut = async () => {
    if (!agent || !selectedWalletId || !verificationToken) return;

    const amount = parseFloat(cashOutAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      setProcessing(true);
      
      // Open Banking format request
      const response = await apiPost<any>(
        '/api/v1/agents/cash-out',
        {
          Data: {
            Initiation: {
              AgentId: agent.id,
              Amount: amount.toString(),
              WalletId: selectedWalletId,
            },
          },
          verificationToken,
        }
      );

      if (response && response.CashOutCode) {
        setCashOutCode(response.CashOutCode);
        setShowQR(true);
      } else {
        Alert.alert('Error', 'Failed to generate cash-out code');
        setProcessing(false);
      }
    } catch (error: any) {
      Alert.alert('Cash-Out Failed', error.message || 'Failed to process cash-out request');
      setProcessing(false);
    }
  };

  if (loading || processing) {
    return (
      <StandardScreenLayout title="Agent Cash-Out">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {processing ? 'Processing cash-out...' : 'Loading...'}
          </Text>
        </View>
      </StandardScreenLayout>
    );
  }

  if (!agent) {
    return (
      <StandardScreenLayout title="Agent Cash-Out">
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Agent not found</Text>
        </View>
      </StandardScreenLayout>
    );
  }

  if (showQR && cashOutCode) {
    return (
      <StandardScreenLayout title="Cash-Out Code">
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <GlassCard style={styles.qrCard} padding={24} borderRadius={16}>
            <Text style={styles.qrTitle}>Show this to the agent</Text>
            <View style={styles.qrContainer}>
              <QRCode
                value={cashOutCode}
                size={200}
                color={Colors.text}
                backgroundColor={Colors.white}
              />
            </View>
            <Text style={styles.qrCodeText}>{cashOutCode}</Text>
            <Text style={styles.qrInstructions}>
              Visit {agent.name} at {agent.address} and show this QR code or code to the agent.
              The agent will verify and dispense cash.
            </Text>
          </GlassCard>

          <GlassCard style={styles.infoCard} padding={16} borderRadius={16}>
            <View style={styles.infoContent}>
              <FontAwesome name="info-circle" size={20} color={Colors.info} />
              <Text style={styles.infoText}>
                • Bring a valid ID for verification{'\n'}
                • The code expires in 1 hour{'\n'}
                • Cash will be deducted from your wallet when agent confirms{'\n'}
                • Commission fees may apply
              </Text>
            </View>
          </GlassCard>

          <PillButton
            label="Done"
            variant="outline"
            onPress={() => router.back()}
            style={styles.doneButton}
          />
        </ScrollView>
      </StandardScreenLayout>
    );
  }

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
  const cashOutAmountNum = parseFloat(cashOutAmount || '0');
  const commission = agent.commissionRate
    ? (cashOutAmountNum * agent.commissionRate) / 100
    : 0;
  const totalDeduction = cashOutAmountNum + commission;

  return (
    <StandardScreenLayout title="Agent Cash-Out">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Agent Details */}
        <GlassCard style={styles.agentCard} padding={16} borderRadius={16}>
          <Text style={styles.sectionTitle}>Agent Details</Text>
          <View style={styles.agentInfo}>
            <FontAwesome name="users" size={24} color={Colors.primary} />
            <View style={styles.agentText}>
              <Text style={styles.agentName}>{agent.name}</Text>
              <Text style={styles.agentLocation}>{agent.address}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Cash-Out Amount Input */}
        <GlassCard style={styles.amountCard} padding={24} borderRadius={16}>
          <Text style={styles.sectionTitle}>Cash-Out Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>{currency}</Text>
            <TextInput
              style={styles.amountInput}
              value={cashOutAmount}
              onChangeText={setCashOutAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
          {agent.maxCashOut && (
            <Text style={styles.amountHint}>
              Maximum: {currency} {agent.maxCashOut.toLocaleString()}
            </Text>
          )}
        </GlassCard>

        {/* Wallet Selection */}
        {wallets.length > 1 && (
          <GlassCard style={styles.walletCard} padding={16} borderRadius={16}>
            <Text style={styles.sectionTitle}>Cash Out From</Text>
            {wallets.map((wallet) => (
              <TouchableOpacity
                key={wallet.id}
                style={[
                  styles.walletOption,
                  selectedWalletId === wallet.id && styles.walletOptionSelected,
                ]}
                onPress={() => setSelectedWalletId(wallet.id)}
              >
                <View style={styles.walletInfo}>
                  <FontAwesome name="credit-card" size={20} color={Colors.primary} />
                  <View style={styles.walletText}>
                    <Text style={styles.walletName}>{wallet.name}</Text>
                    <Text style={styles.walletBalance}>
                      Balance: {currency} {wallet.balance.toFixed(2)}
                    </Text>
                  </View>
                </View>
                {selectedWalletId === wallet.id && (
                  <FontAwesome name="check-circle" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </GlassCard>
        )}

        {/* Cash-Out Summary */}
        <GlassCard style={styles.summaryCard} padding={24} borderRadius={16}>
          <Text style={styles.sectionTitle}>Cash-Out Summary</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Agent</Text>
            <Text style={styles.detailValue}>{agent.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cash-Out Amount</Text>
            <Text style={styles.detailValue}>
              {currency} {cashOutAmountNum.toFixed(2)}
            </Text>
          </View>

          {commission > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Commission ({agent.commissionRate}%)</Text>
              <Text style={styles.detailValue}>
                {currency} {commission.toFixed(2)}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.totalLabel}>Total Deducted</Text>
            <Text style={styles.totalValue}>
              {currency} {totalDeduction.toFixed(2)}
            </Text>
          </View>
        </GlassCard>

        {/* Info Card */}
        <GlassCard style={styles.infoCard} padding={16} borderRadius={16}>
          <View style={styles.infoContent}>
            <FontAwesome name="info-circle" size={20} color={Colors.info} />
            <Text style={styles.infoText}>
              After confirmation, you'll receive a QR code or voucher code. 
              Visit the agent location and show the code to receive cash. 
              This action requires 2FA verification for security.
            </Text>
          </View>
        </GlassCard>

        {/* Confirm Button */}
          <PillButton
            label="Confirm Cash-Out"
            variant="primary"
            onPress={handleConfirm}
            style={styles.confirmButton}
            disabled={!selectedWalletId || cashOutAmountNum <= 0}
          />
      </ScrollView>

      {/* 2FA Verification Modal */}
      {agent && selectedWallet && (
        <TwoFactorVerification
          visible={show2FA}
          onVerify={handle2FAComplete}
          onCancel={() => {
            setShow2FA(false);
            setVerificationToken(null);
          }}
          amount={cashOutAmountNum}
          recipientName={agent.name}
        />
      )}
    </StandardScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: HORIZONTAL_PADDING,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.error,
  },
  agentCard: {
    marginBottom: SECTION_SPACING,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16, // Consistent with other screens
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12, // Consistent spacing after section title
  },
  agentText: {
    flex: 1,
    marginLeft: 12,
  },
  agentName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  agentLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  amountCard: {
    marginBottom: SECTION_SPACING,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
  },
  amountHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  walletCard: {
    marginBottom: SECTION_SPACING,
  },
  walletOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12, // Consistent spacing between wallet options
  },
  walletOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletText: {
    flex: 1,
    marginLeft: 12,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryCard: {
    marginBottom: SECTION_SPACING,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  infoCard: {
    marginBottom: SECTION_SPACING,
    backgroundColor: Colors.info + '10',
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    marginLeft: 12,
    lineHeight: 20,
  },
  confirmButton: {
    marginTop: 8,
  },
  qrCard: {
    marginBottom: SECTION_SPACING,
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: SECTION_SPACING,
    textAlign: 'center',
  },
  qrContainer: {
    padding: HORIZONTAL_PADDING,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
  },
  qrCodeText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: 'monospace',
    marginBottom: 16,
    textAlign: 'center',
  },
  qrInstructions: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  doneButton: {
    marginTop: 8,
  },
});
