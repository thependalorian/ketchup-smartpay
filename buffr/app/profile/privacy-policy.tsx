/**
 * Privacy Policy Screen
 * 
 * Location: app/profile/privacy-policy.tsx
 * Purpose: Display privacy policy and data handling information
 * 
 * Features:
 * - Privacy policy content
 * - Data collection information
 * - User rights
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader, SectionHeader } from '@/components/common';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';
import defaultStyles from '@/constants/Styles';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader title="Privacy Policy" onBack={handleBack} showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.lastUpdated}>Last Updated: January 25, 2025</Text>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Introduction" />
          <Text style={styles.contentText}>
            At Buffr, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.
          </Text>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Information We Collect" />
          <Text style={styles.contentText}>
            We collect information that you provide directly to us, including:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Personal identification information (name, email, phone number)</Text>
            <Text style={styles.listItem}>• Financial information (payment methods, transaction history)</Text>
            <Text style={styles.listItem}>• Device information (device type, operating system, unique identifiers)</Text>
            <Text style={styles.listItem}>• Usage data (how you interact with our app)</Text>
            <Text style={styles.listItem}>• Location data (when you use location-based features)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="How We Use Your Information" />
          <Text style={styles.contentText}>
            We use the information we collect to:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Provide, maintain, and improve our services</Text>
            <Text style={styles.listItem}>• Process transactions and send related information</Text>
            <Text style={styles.listItem}>• Send you technical notices and support messages</Text>
            <Text style={styles.listItem}>• Respond to your comments and questions</Text>
            <Text style={styles.listItem}>• Monitor and analyze trends and usage</Text>
            <Text style={styles.listItem}>• Detect, prevent, and address technical issues</Text>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Data Security" />
          <Text style={styles.contentText}>
            We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure.
          </Text>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Your Rights" />
          <Text style={styles.contentText}>
            You have the right to:
          </Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Access your personal information</Text>
            <Text style={styles.listItem}>• Correct inaccurate or incomplete information</Text>
            <Text style={styles.listItem}>• Request deletion of your personal information</Text>
            <Text style={styles.listItem}>• Object to processing of your personal information</Text>
            <Text style={styles.listItem}>• Request restriction of processing</Text>
            <Text style={styles.listItem}>• Data portability</Text>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Contact Us" />
          <Text style={styles.contentText}>
            If you have any questions about this Privacy Policy, please contact us at:
          </Text>
          <Text style={styles.contactInfo}>
            Email: privacy@buffr.com{'\n'}
            Phone: +264 61 XXX XXXX
          </Text>
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
    marginBottom: SECTION_SPACING,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  lastUpdated: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  contentText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  listContainer: {
    marginTop: 8,
    paddingLeft: 8,
  },
  listItem: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 14,
    color: Colors.primary,
    lineHeight: 22,
    marginTop: 8,
    fontWeight: '500',
  },
});
