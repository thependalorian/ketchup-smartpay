/**
 * Agent Details Screen
 * 
 * Location: app/agents/[id].tsx
 * Purpose: Display agent details and initiate cash-out
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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StandardScreenLayout } from '@/components/layouts';
import { GlassCard, PillButton } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';
import { apiGet } from '@/utils/apiClient';
import { log } from '@/utils/logger';

interface Agent {
  id: string;
  name: string;
  type: 'small' | 'medium' | 'large';
  location: string;
  address: string;
  phone?: string;
  isAvailable: boolean;
  cashOnHand?: number;
  maxCashOut?: number;
  commissionRate?: number;
}

export default function AgentDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchAgentDetails();
    }
  }, [id]);

  const fetchAgentDetails = async () => {
    try {
      setLoading(true);
      const response = await apiGet<any>(`/api/v1/agents/${id}`);
      if (response && response.Agent) {
        const a = response.Agent;
        setAgent({
          id: a.AgentId,
          name: a.Name,
          type: a.Type.toLowerCase() as 'small' | 'medium' | 'large',
          location: a.Location,
          address: a.Location, // Use location as address
          phone: undefined, // Add if available in response
          isAvailable: a.Status === 'active' || a.Status === 'Active',
          cashOnHand: a.Liquidity?.CashOnHand || 0,
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

  const handleCashOutPress = () => {
    if (!agent?.isAvailable) {
      Alert.alert('Agent Unavailable', 'This agent is currently unavailable for cash-out services.');
      return;
    }
    router.push({
      pathname: '/agents/cash-out' as any,
      params: { agentId: id },
    });
  };

  const getAgentTypeLabel = (type: string) => {
    switch (type) {
      case 'small':
        return 'Small Agent (Mom & Pop Shop)';
      case 'medium':
        return 'Medium Agent (Regional Retailer)';
      case 'large':
        return 'Large Agent (National Chain)';
      default:
        return 'Agent';
    }
  };

  if (loading) {
    return (
      <StandardScreenLayout title="Agent Details">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </StandardScreenLayout>
    );
  }

  if (!agent) {
    return (
      <StandardScreenLayout title="Agent Details">
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Agent not found</Text>
        </View>
      </StandardScreenLayout>
    );
  }

  return (
    <StandardScreenLayout title={agent.name}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Agent Header */}
        <GlassCard style={styles.headerCard} padding={24} borderRadius={16}>
          <View style={styles.agentHeader}>
            <View style={styles.agentInfo}>
              <Text style={styles.agentName}>{agent.name}</Text>
              <Text style={styles.agentType}>{getAgentTypeLabel(agent.type)}</Text>
            </View>
            {agent.isAvailable ? (
              <View style={styles.availableBadge}>
                <View style={styles.availableIndicator} />
                <Text style={styles.availableText}>Available</Text>
              </View>
            ) : (
              <View style={styles.unavailableBadge}>
                <Text style={styles.unavailableText}>Unavailable</Text>
              </View>
            )}
          </View>
        </GlassCard>

        {/* Agent Details */}
        <GlassCard style={styles.detailsCard} padding={16} borderRadius={16}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.detailRow}>
            <FontAwesome name="map-marker" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{agent.address}</Text>
          </View>
          {agent.phone && (
            <View style={styles.detailRow}>
              <FontAwesome name="phone" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{agent.phone}</Text>
            </View>
          )}
        </GlassCard>

        {/* Cash-Out Information */}
        <GlassCard style={styles.cashoutCard} padding={16} borderRadius={16}>
          <Text style={styles.sectionTitle}>Cash-Out Services</Text>
          
          {agent.cashOnHand !== undefined && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cash on Hand</Text>
              <Text style={styles.infoValue}>
                N$ {agent.cashOnHand.toLocaleString()}
              </Text>
            </View>
          )}

          {agent.maxCashOut !== undefined && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Max Cash-Out</Text>
              <Text style={styles.infoValue}>
                N$ {agent.maxCashOut.toLocaleString()}
              </Text>
            </View>
          )}

          {agent.commissionRate !== undefined && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Commission Rate</Text>
              <Text style={styles.infoValue}>{agent.commissionRate}%</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.infoContent}>
            <FontAwesome name="info-circle" size={16} color={Colors.info} />
            <Text style={styles.infoText}>
              Visit this agent location to cash out from your Buffr wallet. 
              The agent will verify your identity and dispense cash. 
              Commission fees may apply.
            </Text>
          </View>
        </GlassCard>

        {/* Action Button */}
        <View style={styles.actionsContainer}>
          <PillButton
            label="Cash Out at Agent"
            icon="money"
            variant="primary"
            onPress={handleCashOutPress}
            style={styles.cashOutButton}
            disabled={!agent.isAvailable}
          />
        </View>
      </ScrollView>
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
  headerCard: {
    marginBottom: SECTION_SPACING,
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  agentType: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.success + '20',
    gap: 8,
  },
  availableIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  availableText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },
  unavailableBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.textSecondary + '20',
  },
  unavailableText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  detailsCard: {
    marginBottom: SECTION_SPACING,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  cashoutCard: {
    marginBottom: SECTION_SPACING,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  actionsContainer: {
    marginTop: 8,
  },
  cashOutButton: {
    width: '100%',
  },
});
