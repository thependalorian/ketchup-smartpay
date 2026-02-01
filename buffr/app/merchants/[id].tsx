/**
 * Merchant Details Screen
 * 
 * Location: app/merchants/[id].tsx
 * Purpose: Display merchant details and initiate payment
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
import logger from '@/utils/logger';

interface Merchant {
  id: string;
  name: string;
  category: string;
  location: string;
  address: string;
  phone?: string;
  cashbackRate: number;
  isOpen: boolean;
  openingHours?: string;
  qrCode?: string;
}

export default function MerchantDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchMerchantDetails();
    }
  }, [id]);

  const fetchMerchantDetails = async () => {
    try {
      setLoading(true);
      const response = await apiGet<any>(`/api/v1/merchants/${id}`);
      if (response && response.Merchant) {
        const m = response.Merchant;
        setMerchant({
          id: m.MerchantId,
          name: m.Name,
          category: m.Category,
          location: m.Location,
          address: m.Address,
          phone: m.Contact?.Phone,
          cashbackRate: m.Cashback?.Rate || 0,
          isOpen: m.Status?.IsOpen || false,
          openingHours: m.OpeningHours,
          qrCode: m.QRCode,
        });
      }
    } catch (error) {
      logger.error('Failed to fetch merchant details:', error);
      Alert.alert('Error', 'Failed to load merchant details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePayPress = () => {
    router.push({
      pathname: '/merchants/pay',
      params: { merchantId: id },
    });
  };

  const handleCashbackInfo = () => {
    router.push({
      pathname: '/merchants/cashback-info',
      params: { merchantId: id },
    });
  };

  if (loading) {
    return (
      <StandardScreenLayout title="Merchant Details">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </StandardScreenLayout>
    );
  }

  if (!merchant) {
    return (
      <StandardScreenLayout title="Merchant Details">
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Merchant not found</Text>
        </View>
      </StandardScreenLayout>
    );
  }

  return (
    <StandardScreenLayout title={merchant.name}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Merchant Header */}
        <GlassCard style={styles.headerCard} padding={24} borderRadius={16}>
          <View style={styles.merchantHeader}>
            <View style={styles.merchantInfo}>
              <Text style={styles.merchantName}>{merchant.name}</Text>
              <Text style={styles.merchantCategory}>{merchant.category}</Text>
            </View>
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
          <View style={styles.cashbackBadge}>
            <FontAwesome name="gift" size={20} color={Colors.success} />
            <Text style={styles.cashbackText}>
              {merchant.cashbackRate}% Cashback Available
            </Text>
          </View>
        </GlassCard>

        {/* Location Details */}
        <GlassCard style={styles.detailsCard} padding={16} borderRadius={16}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.detailRow}>
            <FontAwesome name="map-marker" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{merchant.address}</Text>
          </View>
          {merchant.phone && (
            <View style={styles.detailRow}>
              <FontAwesome name="phone" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{merchant.phone}</Text>
            </View>
          )}
          {merchant.openingHours && (
            <View style={styles.detailRow}>
              <FontAwesome name="clock-o" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{merchant.openingHours}</Text>
            </View>
          )}
        </GlassCard>

        {/* Cashback Info */}
        <GlassCard style={styles.cashbackInfoCard} padding={16} borderRadius={16}>
          <View style={styles.cashbackInfoHeader}>
            <FontAwesome name="gift" size={24} color={Colors.success} />
            <View style={styles.cashbackInfoText}>
              <Text style={styles.cashbackInfoTitle}>Cashback Offer</Text>
              <Text style={styles.cashbackInfoDescription}>
                Get {merchant.cashbackRate}% cashback when you pay with your Buffr wallet at this merchant.
                Cashback is merchant-funded and reduces NamPost bottlenecks.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.learnMoreButton}
            onPress={handleCashbackInfo}
          >
            <Text style={styles.learnMoreText}>Learn More</Text>
            <FontAwesome name="chevron-right" size={12} color={Colors.primary} />
          </TouchableOpacity>
        </GlassCard>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <PillButton
            label="Pay at Merchant"
            icon="credit-card"
            variant="primary"
            onPress={handlePayPress}
            style={styles.payButton}
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
  merchantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  merchantCategory: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontWeight: '600',
    color: Colors.success,
  },
  closedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.textSecondary + '20',
  },
  closedText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  cashbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.success + '20',
    borderWidth: 1,
    borderColor: Colors.success + '40',
    gap: 8,
  },
  cashbackText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
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
  cashbackInfoCard: {
    marginBottom: SECTION_SPACING,
    backgroundColor: Colors.success + '10',
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  cashbackInfoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16, // Consistent spacing before action button
  },
  cashbackInfoText: {
    flex: 1,
    marginLeft: 12,
  },
  cashbackInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  cashbackInfoDescription: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
  },
  learnMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  actionsContainer: {
    marginTop: 8,
  },
  payButton: {
    width: '100%',
  },
});
