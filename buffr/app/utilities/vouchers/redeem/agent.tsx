/**
 * Agent Cash-Out Redemption Flow Screen
 * 
 * Location: app/utilities/vouchers/redeem/agent.tsx
 * Purpose: Redeem voucher for cash at agent location
 * 
 * Flow:
 * 1. Agent selection/search
 * 2. QR code display for agent scanning
 * 3. Map view of agent locations
 * 4. 2FA verification (PSD-12 compliance)
 * 5. Processing
 * 6. Success with agent details
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
import { useVouchers, Voucher } from '@/contexts/VouchersContext';
import { useUser } from '@/contexts/UserContext';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';
import { apiGet } from '@/utils/apiClient';

interface Agent {
  id: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

export default function AgentCashOutScreen() {
  const router = useRouter();
  const { voucherId } = useLocalSearchParams<{ voucherId: string }>();
  const { user } = useUser();
  const { vouchers, fetchVouchers, redeemVoucher } = useVouchers();

  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const currency = user?.currency || 'N$';

  useEffect(() => {
    if (voucherId) {
      fetchVoucherDetails();
      fetchAgents();
    }
  }, [voucherId]);

  const fetchVoucherDetails = async () => {
    try {
      setLoading(true);
      await fetchVouchers();
      const foundVoucher = vouchers.find((v) => v.id === voucherId);
      setVoucher(foundVoucher || null);
    } catch (error) {
      Alert.alert('Error', 'Failed to load voucher details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      setLoadingAgents(true);
      const response = await apiGet('/api/v1/agents/nearby');
      if (response.success && response.data) {
        setAgents(response.data.agents || []);
        if (response.data.agents && response.data.agents.length > 0) {
          setSelectedAgent(response.data.agents[0]);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoadingAgents(false);
    }
  };

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirm = () => {
    if (!voucher || !selectedAgent) {
      Alert.alert('Error', 'Please select an agent');
      return;
    }
    setShow2FA(true);
  };

  const handle2FAComplete = async (method: 'pin' | 'biometric', code?: string) => {
    setVerificationToken('verified_token');
    setShow2FA(false);
    await processRedemption();
  };

  const processRedemption = async () => {
    if (!voucher || !selectedAgent || !verificationToken) return;

    try {
      setProcessing(true);
      await redeemVoucher(voucher.id, 'cash_out', {
        redemptionPoint: `agent_${selectedAgent.id}`,
        verificationToken,
      });

      router.push({
        pathname: '/utilities/vouchers/redeem/success',
        params: {
          voucherId: voucher.id,
          amount: voucher.amount.toString(),
          method: 'agent',
          agentId: selectedAgent.id,
          agentName: selectedAgent.name,
        },
      });
    } catch (error: any) {
      Alert.alert('Redemption Failed', error.message || 'Failed to redeem voucher');
      setProcessing(false);
    }
  };

  if (loading || processing) {
    return (
      <StandardScreenLayout title="Agent Cash-Out">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {processing ? 'Processing redemption...' : 'Loading...'}
          </Text>
        </View>
      </StandardScreenLayout>
    );
  }

  if (!voucher) {
    return (
      <StandardScreenLayout title="Agent Cash-Out">
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Voucher not found</Text>
        </View>
      </StandardScreenLayout>
    );
  }

  const qrValue = voucher.namqrCode || voucher.voucherCode || voucher.id;

  return (
    <StandardScreenLayout title="Agent Cash-Out">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Amount Display */}
        <GlassCard style={styles.amountCard} padding={24} borderRadius={16}>
          <Text style={styles.amountLabel}>Cash Amount</Text>
          <Text style={styles.amountValue}>
            {currency} {voucher.amount.toFixed(2)}
          </Text>
        </GlassCard>

        {/* Agent Search */}
        <GlassCard style={styles.searchCard} padding={16} borderRadius={16}>
          <Text style={styles.sectionTitle}>Find Agent</Text>
          <View style={styles.searchContainer}>
            <FontAwesome name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or location..."
              placeholderTextColor={Colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </GlassCard>

        {/* Agent List */}
        {loadingAgents ? (
          <View style={styles.loadingAgents}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingAgentsText}>Loading agents...</Text>
          </View>
        ) : filteredAgents.length > 0 ? (
          <View style={styles.agentsList}>
            {filteredAgents.map((agent) => (
              <TouchableOpacity
                key={agent.id}
                style={[
                  styles.agentCard,
                  selectedAgent?.id === agent.id && styles.agentCardSelected,
                ]}
                onPress={() => setSelectedAgent(agent)}
              >
                <View style={styles.agentInfo}>
                  <View style={styles.agentHeader}>
                    <FontAwesome name="user" size={20} color={Colors.primary} />
                    <Text style={styles.agentName}>{agent.name}</Text>
                  </View>
                  <Text style={styles.agentLocation}>{agent.location}</Text>
                  <Text style={styles.agentAddress}>{agent.address}</Text>
                  {agent.distance && (
                    <Text style={styles.agentDistance}>
                      {agent.distance.toFixed(1)} km away
                    </Text>
                  )}
                </View>
                {selectedAgent?.id === agent.id && (
                  <FontAwesome name="check-circle" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <GlassCard style={styles.emptyCard} padding={16} borderRadius={16}>
            <FontAwesome name="map-marker" size={32} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No agents found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search or check back later
            </Text>
          </GlassCard>
        )}

        {/* QR Code Display (if agent selected) */}
        {selectedAgent && (
          <GlassCard style={styles.qrCard} padding={24} borderRadius={16}>
            <Text style={styles.sectionTitle}>Show QR Code to Agent</Text>
            <View style={styles.qrContainer}>
              <QRCode
                value={qrValue}
                size={200}
                backgroundColor={Colors.white}
                color={Colors.text}
              />
            </View>
            <Text style={styles.qrHint}>
              Show this QR code to {selectedAgent.name} to collect your cash
            </Text>
          </GlassCard>
        )}

        {/* Confirm Button */}
        {selectedAgent && (
          <PillButton onPress={handleConfirm} style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>Confirm Cash-Out</Text>
          </PillButton>
        )}
      </ScrollView>

      {/* 2FA Verification Modal */}
      {voucher && selectedAgent && (
        <TwoFactorVerification
          visible={show2FA}
          onVerify={handle2FAComplete}
          onCancel={() => {
            setShow2FA(false);
            setVerificationToken(null);
          }}
          amount={voucher.amount}
          recipientName={`${selectedAgent.name} (Agent)`}
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
  amountCard: {
    marginBottom: SECTION_SPACING,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.primary,
  },
  searchCard: {
    marginBottom: SECTION_SPACING,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  loadingAgents: {
    alignItems: 'center',
    padding: 40,
  },
  loadingAgentsText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  agentsList: {
    marginBottom: SECTION_SPACING,
  },
  agentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  agentCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  agentInfo: {
    flex: 1,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 12,
  },
  agentLocation: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  agentAddress: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  agentDistance: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  emptyCard: {
    alignItems: 'center',
    marginBottom: SECTION_SPACING,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  qrCard: {
    marginBottom: SECTION_SPACING,
    alignItems: 'center',
  },
  qrContainer: {
    padding: HORIZONTAL_PADDING,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginVertical: 20,
  },
  qrHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  confirmButton: {
    marginTop: 8,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.white,
  },
});
