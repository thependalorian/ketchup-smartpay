/**
 * Nearby Agents Screen
 * 
 * Location: app/agents/nearby.tsx
 * Purpose: Display nearby agents for cash-out services
 * 
 * Features:
 * - List of nearby agents
 * - Agent availability status
 * - Distance from user
 * - Agent types (small, medium, large)
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
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StandardScreenLayout } from '@/components/layouts';
import { GlassCard, EmptyState } from '@/components/common';
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
  distance?: number; // in km
  isAvailable: boolean;
  cashOnHand?: number;
  phone?: string;
}

export default function NearbyAgentsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNearbyAgents();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAgents(agents);
    } else {
      const filtered = agents.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAgents(filtered);
    }
  }, [searchQuery, agents]);

  const fetchNearbyAgents = async () => {
    try {
      setLoading(true);
      // TODO: Get user location and pass to API
      // For now, fetch all active agents (can add location filtering later)
      const response = await apiGet<any>('/api/v1/agents/nearby');
      if (response && response.Agents) {
        const formatted = response.Agents.map((a: any) => ({
          id: a.AgentId,
          name: a.Name,
          type: a.Type.toLowerCase() as 'small' | 'medium' | 'large',
          location: a.Location,
          address: a.Location, // Use location as address if address not provided
          distance: a.Distance || undefined,
          isAvailable: a.Status === 'active' || a.Status === 'Active',
          cashOnHand: a.Liquidity?.CashOnHand || 0,
          maxCashOut: a.Limits?.MaxDailyCashout,
          commissionRate: a.Commission?.Rate,
        }));
        setAgents(formatted);
        setFilteredAgents(formatted);
      }
    } catch (error) {
      log.error('Failed to fetch nearby agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentPress = (agentId: string) => {
    router.push(`/agents/${agentId}` as any);
  };

  const getAgentTypeLabel = (type: string) => {
    switch (type) {
      case 'small':
        return 'Small Agent';
      case 'medium':
        return 'Medium Agent';
      case 'large':
        return 'Large Agent';
      default:
        return 'Agent';
    }
  };

  if (loading) {
    return (
      <StandardScreenLayout title="Nearby Agents">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </StandardScreenLayout>
    );
  }

  return (
    <StandardScreenLayout title="Nearby Agents">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Bar */}
        <GlassCard style={styles.searchCard} padding={16} borderRadius={16}>
          <View style={styles.searchContainer}>
            <FontAwesome name="search" size={16} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search agents..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.textSecondary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <FontAwesome name="times-circle" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </GlassCard>

        {/* Agents List */}
        {filteredAgents.length === 0 ? (
          <EmptyState
            icon="users"
            iconSize={64}
            iconColor={Colors.textSecondary}
            title="No agents found"
            message={searchQuery ? 'Try a different search term' : 'No nearby agents available'}
          />
        ) : (
          filteredAgents.map((agent) => (
            <TouchableOpacity
              key={agent.id}
              onPress={() => handleAgentPress(agent.id)}
              activeOpacity={0.7}
            >
              <GlassCard
                style={styles.agentCard}
                padding={16}
                borderRadius={16}
              >
              <View style={styles.agentHeader}>
                <View style={styles.agentInfo}>
                  <Text style={styles.agentName}>{agent.name}</Text>
                  <Text style={styles.agentType}>{getAgentTypeLabel(agent.type)}</Text>
                  <View style={styles.agentLocationRow}>
                    <FontAwesome name="map-marker" size={14} color={Colors.textSecondary} />
                    <Text style={styles.agentLocation}>
                      {agent.address}
                      {agent.distance && ` • ${agent.distance.toFixed(1)} km away`}
                    </Text>
                  </View>
                </View>
                <View style={styles.agentStatus}>
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
              </View>
              {agent.cashOnHand !== undefined && (
                <View style={styles.cashInfo}>
                  <FontAwesome name="money" size={14} color={Colors.textSecondary} />
                  <Text style={styles.cashInfoText}>
                    Cash on hand: N$ {agent.cashOnHand.toLocaleString()}
                  </Text>
                </View>
              )}
            </GlassCard>
            </TouchableOpacity>
          ))
        )}
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
  searchCard: {
    marginBottom: SECTION_SPACING,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  agentCard: {
    marginBottom: 12, // Consistent spacing between list items
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  agentType: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  agentLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  agentLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  agentStatus: {
    alignItems: 'flex-end',
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    fontWeight: '500',
    color: Colors.success,
  },
  unavailableBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.textSecondary + '20',
  },
  unavailableText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  cashInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cashInfoText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
