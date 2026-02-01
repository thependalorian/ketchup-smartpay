/**
 * Contact Support Screen
 * 
 * Location: app/profile/contact-support.tsx
 * Purpose: Contact support team
 * 
 * Features:
 * - Contact methods (email, phone, chat)
 * - Support ticket submission
 * - Help topics
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ScreenHeader, SectionHeader, PillButton, FormInputGroup } from '@/components/common';
import Colors from '@/constants/Colors';
import defaultStyles from '@/constants/Styles';
import Layout from '@/constants/Layout';

const SUPPORT_TOPICS = [
  { id: 'account', title: 'Account Issues', icon: 'user' },
  { id: 'payment', title: 'Payment Problems', icon: 'credit-card' },
  { id: 'security', title: 'Security Concerns', icon: 'shield' },
  { id: 'technical', title: 'Technical Support', icon: 'cog' },
  { id: 'other', title: 'Other', icon: 'question-circle' },
];

export default function ContactSupportScreen() {
  const router = useRouter();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleCall = () => {
    Linking.openURL('tel:+264611234567');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@buffr.com?subject=Support Request');
  };

  const handleChat = () => {
    Alert.alert('Live Chat', 'Live chat feature will be available soon');
  };

  const handleSubmitTicket = async () => {
    if (!selectedTopic) {
      Alert.alert('Error', 'Please select a support topic');
      return;
    }
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      // In production, submit ticket to API
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert(
        'Success',
        'Your support ticket has been submitted. We will get back to you within 24 hours.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader title="Contact Support" onBack={handleBack} showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Contact */}
        <View style={styles.section}>
          <SectionHeader title="Quick Contact" />
          <View style={styles.contactCard}>
            <TouchableOpacity
              style={styles.contactMethod}
              onPress={handleCall}
              activeOpacity={0.7}
            >
              <View style={[styles.contactIcon, { backgroundColor: Colors.primaryMuted }]}>
                <FontAwesome name="phone" size={24} color={Colors.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Call Us</Text>
                <Text style={styles.contactValue}>+264 61 123 4567</Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.contactMethod}
              onPress={handleEmail}
              activeOpacity={0.7}
            >
              <View style={[styles.contactIcon, { backgroundColor: Colors.primaryMuted }]}>
                <FontAwesome name="envelope" size={24} color={Colors.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Email Us</Text>
                <Text style={styles.contactValue}>support@buffr.com</Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.contactMethod}
              onPress={handleChat}
              activeOpacity={0.7}
            >
              <View style={[styles.contactIcon, { backgroundColor: Colors.primaryMuted }]}>
                <FontAwesome name="comments" size={24} color={Colors.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Live Chat</Text>
                <Text style={styles.contactValue}>Available 24/7</Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Ticket */}
        <View style={styles.section}>
          <SectionHeader title="Submit Support Ticket" />
          <View style={styles.ticketCard}>
            <Text style={styles.ticketDescription}>
              Fill out the form below and our support team will get back to you as soon as possible.
            </Text>

            {/* Topic Selection */}
            <View style={styles.topicsContainer}>
              <Text style={styles.label}>Select Topic</Text>
              <View style={styles.topicsGrid}>
                {SUPPORT_TOPICS.map((topic) => (
                  <TouchableOpacity
                    key={topic.id}
                    style={[
                      styles.topicChip,
                      selectedTopic === topic.id && styles.topicChipActive,
                    ]}
                    onPress={() => setSelectedTopic(topic.id)}
                    activeOpacity={0.7}
                  >
                    <FontAwesome
                      name={topic.icon as any}
                      size={18}
                      color={selectedTopic === topic.id ? Colors.white : Colors.primary}
                    />
                    <Text
                      style={[
                        styles.topicChipText,
                        selectedTopic === topic.id && styles.topicChipTextActive,
                      ]}
                    >
                      {topic.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Form Fields */}
            <FormInputGroup
              label="Subject"
              value={subject}
              onChangeText={setSubject}
              placeholder="Brief description of your issue"
            />

            <FormInputGroup
              label="Message"
              value={message}
              onChangeText={setMessage}
              placeholder="Please provide details about your issue..."
              multiline
              numberOfLines={6}
              style={styles.messageInput}
            />

            <PillButton
              label={submitting ? 'Submitting...' : 'Submit Ticket'}
              variant="primary"
              onPress={handleSubmitTicket}
              disabled={submitting || !selectedTopic}
              loading={submitting}
              style={styles.submitButton}
            />
          </View>
        </View>

        {/* Business Hours */}
        <View style={styles.section}>
          <SectionHeader title="Business Hours" />
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Monday - Friday:</Text> 8:00 AM - 6:00 PM
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Saturday:</Text> 9:00 AM - 1:00 PM
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Sunday:</Text> Closed
            </Text>
            <Text style={styles.infoNote}>
              For urgent matters, please call our 24/7 emergency line: +264 61 123 4567
            </Text>
          </View>
        </View>
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
  section: {
    marginBottom: 32,
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
  },
  contactCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: Layout.CARD_GAP,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  ticketCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 20,
  },
  ticketDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  topicsContainer: {
    gap: Layout.CARD_GAP,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundGray,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  topicChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  topicChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
  topicChipTextActive: {
    color: Colors.white,
  },
  messageInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: Colors.backgroundGray,
    borderRadius: 16,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: '600',
  },
  infoNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 18,
  },
});
