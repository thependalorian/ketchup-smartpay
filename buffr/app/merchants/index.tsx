/**
 * Nearby Merchants Screen
 * 
 * Location: app/merchants/index.tsx
 * Purpose: Display nearby merchants with cashback offers
 * 
 * Features:
 * - List of nearby merchants
 * - Cashback rates displayed
 * - Merchant categories
 * - Search and filter
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
import logger from '@/utils/logger';

interface Merchant {
  id: string;
  name: string;
  category: string;
  location: string;
  distance?: number; // in km
  cashbackRate: number; // Percentage
  isOpen: boolean;
  imageUrl?: string;
}

export default function NearbyMerchantsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [filteredMerchants, setFilteredMerchants] = useState<Merchant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNearbyMerchants();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMerchants(merchants);
    } else {
      const filtered = merchants.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMerchants(filtered);
    }
  }, [searchQuery, merchants]);

  const fetchNearbyMerchants = async () => {
    try {
      setLoading(true);
      // TODO: Get user location and pass to API
      // For now, fetch all active merchants (can add location filtering later)
      const response = await apiGet<any>('/api/v1/merchants/nearby');
      if (response && response.Merchants) {
        const formatted = response.Merchants.map((m: any) => ({
          id: m.MerchantId,
          name: m.Name,
          category: m.Category,
          location: m.Location,
          address: m.Address,
          distance: m.Distance,
          cashbackRate: m.Cashback?.Rate || 0,
          isOpen: m.Status?.IsOpen || false,
        }));
        setMerchants(formatted);
        setFilteredMerchants(formatted);
      }
    } catch (error) {
      logger.error('Failed to fetch nearby merchants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMerchantPress = (merchantId: string) => {
    router.push(`/merchants/${merchantId}`);
  };

  if (loading) {
    return (
      <StandardScreenLayout title="Nearby Merchants">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </StandardScreenLayout>
    );
  }

  return (
    <StandardScreenLayout title="Nearby Merchants">
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
              placeholder="Search merchants..."
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

        {/* Merchants List */}
        {filteredMerchants.length === 0 ? (
          <EmptyState
            icon="store"
            iconSize={64}
            iconColor={Colors.textSecondary}
            title="No merchants found"
            message={searchQuery ? 'Try a different search term' : 'No nearby merchants available'}
          />
        ) : (
          filteredMerchants.map((merchant) => (
            <TouchableOpacity
              key={merchant.id}
              onPress={() => handleMerchantPress(merchant.id)}
              activeOpacity={0.7}
            >
              <GlassCard
                style={styles.merchantCard}
                padding={16}
                borderRadius={16}
              >
              <View style={styles.merchantHeader}>
                <View style={styles.merchantInfo}>
                  <Text style={styles.merchantName}>{merchant.name}</Text>
                  <Text style={styles.merchantCategory}>{merchant.category}</Text>
                  <View style={styles.merchantLocationRow}>
                    <FontAwesome name="map-marker" size={14} color={Colors.textSecondary} />
                    <Text style={styles.merchantLocation}>
                      {merchant.location}
                      {merchant.distance && ` • ${merchant.distance.toFixed(1)} km away`}
                    </Text>
                  </View>
                </View>
                <View style={styles.merchantStatus}>
                  {merchant.isOpen ? (
                    <View style={styles.openBadge}>
                      <View style={styles.openIndicator} />
                      <Text style={styles.openText}>Open</Text>
                    </View>
                  ) : (
                    <View style={styles.closedBadge}>
                      <Text style={styles.closedText}>Closed</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.cashbackBadge}>
                <FontAwesome name="gift" size={16} color={Colors.success} />
                <Text style={styles.cashbackText}>
                  {merchant.cashbackRate}% Cashback Available
                </Text>
              </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: SECTION_SPACING,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  merchantCard: {
    marginBottom: 12, // Consistent spacing between list items
  },
  merchantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  merchantCategory: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  merchantLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  merchantLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  merchantStatus: {
    alignItems: 'flex-end',
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.success + '20',
    gap: 8,
  },
  openIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  openText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.success,
  },
  closedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.textSecondary + '20',
  },
  closedText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  cashbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.success + '20',
    borderWidth: 1,
    borderColor: Colors.success + '40',
    gap: 6,
  },
  cashbackText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },
});
