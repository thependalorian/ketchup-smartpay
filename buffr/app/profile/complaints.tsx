/**
 * Complaints & Disputes Screen
 * 
 * Location: app/profile/complaints.tsx
 * Purpose: File complaints and disputes (PSD-1 Section 16.6-16.12)
 * 
 * Regulatory Requirements:
 * - PSD-1 Section 16.6: User care system within 6 months
 * - PSD-1 Section 16.7: Complaints must be addressed within 15 days
 * - PSD-1 Section 16.8: Complaints must be lodged within 90 days of occurrence
 * - PSD-1 Section 16.9: Acknowledge all complaints
 * - PSD-1 Section 16.10: Escalation process for unsatisfied complainants
 * - PSD-1 Section 16.11: Fraudulent transaction complaint handling
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ScreenHeader, SectionHeader, PillButton, FormInputGroup } from '@/components/common';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING, CARD_GAP } from '@/constants/Layout';
import defaultStyles from '@/constants/Styles';

const COMPLAINT_CATEGORIES = [
  { id: 'fraud', title: 'Fraudulent Transaction', icon: 'shield' },
  { id: 'unauthorized', title: 'Unauthorized Payment', icon: 'lock' },
  { id: 'failed', title: 'Failed Transaction', icon: 'times-circle' },
  { id: 'refund', title: 'Refund Request', icon: 'undo' },
  { id: 'account', title: 'Account Issue', icon: 'user' },
  { id: 'service', title: 'Service Quality', icon: 'star' },
  { id: 'other', title: 'Other', icon: 'question-circle' },
];

export default function ComplaintsScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a complaint category');
      return;
    }
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      // In production, submit complaint to API
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Complaint Submitted',
        'Your complaint has been received. Reference number: COMP-' + Date.now().toString().slice(-8) + '\n\nWe will acknowledge your complaint and respond within 15 days as per regulatory requirements.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setSelectedCategory(null);
              setSubject('');
              setDescription('');
              setTransactionId('');
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader title="File a Complaint" onBack={handleBack} showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Information Banner */}
        <View style={styles.infoBanner}>
          <FontAwesome name="info-circle" size={20} color={Colors.primary} />
          <Text style={styles.infoText}>
            Complaints must be filed within 90 days of the incident. We will respond within 15 days.
          </Text>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <SectionHeader title="Complaint Category" />
          <View style={styles.categoriesGrid}>
            {COMPLAINT_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.categoryCardActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
                activeOpacity={0.7}
              >
                <FontAwesome
                  name={category.icon as any}
                  size={24}
                  color={selectedCategory === category.id ? Colors.white : Colors.primary}
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.categoryTextActive,
                  ]}
                >
                  {category.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Complaint Form */}
        <View style={styles.section}>
          <SectionHeader title="Complaint Details" />
          <View style={styles.formCard}>
            <FormInputGroup
              label="Subject"
              value={subject}
              onChangeText={setSubject}
              placeholder="Brief description of your complaint"
            />

            <FormInputGroup
              label="Transaction ID (if applicable)"
              value={transactionId}
              onChangeText={setTransactionId}
              placeholder="Enter transaction ID"
              keyboardType="default"
            />

            <FormInputGroup
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Please provide detailed information about your complaint..."
              multiline
              numberOfLines={6}
              style={styles.descriptionInput}
            />
          </View>
        </View>

        {/* Regulatory Information */}
        <View style={styles.section}>
          <SectionHeader title="Your Rights" />
          <View style={styles.rightsCard}>
            <View style={styles.rightItem}>
              <FontAwesome name="check-circle" size={16} color={Colors.success} />
              <Text style={styles.rightText}>
                Your complaint will be acknowledged immediately
              </Text>
            </View>
            <View style={styles.rightItem}>
              <FontAwesome name="check-circle" size={16} color={Colors.success} />
              <Text style={styles.rightText}>
                We will respond within 15 days of receipt
              </Text>
            </View>
            <View style={styles.rightItem}>
              <FontAwesome name="check-circle" size={16} color={Colors.success} />
              <Text style={styles.rightText}>
                If unsatisfied, you can escalate to a senior officer
              </Text>
            </View>
            <View style={styles.rightItem}>
              <FontAwesome name="check-circle" size={16} color={Colors.success} />
              <Text style={styles.rightText}>
                Fraudulent transaction complaints handled per PSD-1 Section 16.11
              </Text>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <PillButton
          label={submitting ? 'Submitting...' : 'Submit Complaint'}
          variant="primary"
          onPress={handleSubmit}
          disabled={submitting || !selectedCategory}
          loading={submitting}
          style={styles.submitButton}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primaryMuted,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: SECTION_SPACING,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 8,
  },
  categoryCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
  categoryTextActive: {
    color: Colors.white,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 20,
  },
  descriptionInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  rightsCard: {
    backgroundColor: Colors.backgroundGray,
    borderRadius: 16,
    padding: 16,
  },
  rightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: CARD_GAP,
  },
  rightText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  submitButton: {
    marginHorizontal: 20,
    marginTop: 8,
  },
});
