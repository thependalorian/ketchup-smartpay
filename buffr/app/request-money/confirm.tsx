/**
 * Request Money - Confirm Screen (Step 3)
 * 
 * Location: app/request-money/confirm.tsx
 * Purpose: Review and confirm money request before sending
 * 
 * Features:
 * - Request summary with glass cards
 * - Recipient details
 * - Amount and note display
 * - Confirm and send request
 * - Real estate planning
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import defaultStyles from '@/constants/Styles';
import { ScreenHeader, ContactDetailCard, PillButton, GlassCard } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import Layout from '@/constants/Layout';
import { log } from '@/utils/logger';

export default function RequestMoneyConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    contactId?: string;
    contactName?: string;
    contactPhone?: string;
    amount?: string;
    note?: string;
  }>();
  
  const { user } = useUser();
  const currency = user?.currency || 'N$';
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestData = {
    contactId: params.contactId || '',
    contactName: params.contactName || 'Contact',
    contactPhone: params.contactPhone || '',
    amount: params.amount || '0',
    note: params.note || '',
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    
    try {
      const { apiPost } = await import('@/utils/apiClient');
      
      const newRequest = await apiPost('/requests', {
        toUserId: requestData.contactId,
        toUserName: requestData.contactName,
        toUserPhone: requestData.contactPhone,
        amount: parseFloat(requestData.amount),
        note: requestData.note || undefined,
      });
      
      Alert.alert(
        'Request Sent',
        `Money request sent to ${requestData.contactName}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to request status screen
              router.replace({
                pathname: '/requests/[id]',
                params: { id: newRequest.id },
              });
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to send request. Please try again.'
      );
      log.error('Error sending request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    router.back();
  };

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader title="Confirm Request" showBackButton onBack={handleBack} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Request Summary Header */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Review Request</Text>
          <Text style={styles.headerSubtitle}>
            Please review the details before sending
          </Text>
        </View>

        {/* Recipient Card - Glass Effect */}
        <GlassCard style={styles.recipientCard} padding={16} borderRadius={16}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Requesting From</Text>
            <TouchableOpacity onPress={handleEdit}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <ContactDetailCard
            contact={{
              id: requestData.contactId,
              name: requestData.contactName,
              phoneNumber: requestData.contactPhone,
            }}
          />
        </GlassCard>

        {/* Amount Card - Glass Effect */}
          <GlassCard style={styles.amountCard} padding={16} borderRadius={16}>
          <Text style={styles.cardTitle}>Amount</Text>
          <View style={styles.amountDisplay}>
            <Text style={styles.currencySymbol}>{currency}</Text>
            <Text style={styles.amountValue}>
              {parseFloat(requestData.amount).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
        </GlassCard>

        {/* Note Card - Glass Effect (if note exists) */}
        {requestData.note && (
          <GlassCard style={styles.noteCard} padding={16} borderRadius={16}>
            <Text style={styles.cardTitle}>Note</Text>
            <Text style={styles.noteText}>{requestData.note}</Text>
          </GlassCard>
        )}

        {/* Info Section */}
        <GlassCard style={styles.infoCard} padding={16} borderRadius={16}>
          <View style={styles.infoRow}>
            <FontAwesome name="info-circle" size={18} color={Colors.info} />
            <Text style={styles.infoText}>
              The recipient will receive a notification and can pay the request from their Buffr account.
            </Text>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <PillButton
          label={isSubmitting ? 'Sending...' : 'Send Request'}
          variant="primary"
          onPress={handleConfirm}
          disabled={isSubmitting}
        />
        {isSubmitting && (
          <ActivityIndicator
            size="small"
            color={Colors.primary}
            style={styles.loader}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
    paddingTop: Layout.SECTION_SPACING,
    paddingBottom: Layout.LARGE_SECTION_SPACING,
  },
  headerSection: {
    marginBottom: Layout.LARGE_SECTION_SPACING,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  recipientCard: {
    marginBottom: Layout.SECTION_SPACING,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  amountCard: {
    marginBottom: Layout.SECTION_SPACING,
    alignItems: 'center',
  },
  amountDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
    gap: 8,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  amountValue: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.primary,
  },
  noteCard: {
    marginBottom: Layout.SECTION_SPACING,
  },
  noteText: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 8,
    lineHeight: 24,
  },
  infoCard: {
    marginBottom: Layout.SECTION_SPACING,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  loader: {
    marginTop: 8,
  },
});
