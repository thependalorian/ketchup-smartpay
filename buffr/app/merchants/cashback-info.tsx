/**
 * Cashback Information Screen
 * 
 * Location: app/merchants/cashback-info.tsx
 * Purpose: Explain cashback at merchant tills feature
 * 
 * Based on: Buffr App Design wireframes + Apple HIG
 * Design System: Uses exact values from wireframes
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StandardScreenLayout } from '@/components/layouts';
import { GlassCard } from '@/components/common';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';

export default function CashbackInfoScreen() {
  return (
    <StandardScreenLayout title="Cashback at Tills">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <GlassCard style={styles.heroCard} padding={24} borderRadius={16}>
          <View style={styles.heroContent}>
            <FontAwesome name="gift" size={64} color={Colors.success} />
            <Text style={styles.heroTitle}>Get Cashback When You Shop</Text>
            <Text style={styles.heroSubtitle}>
              Earn cashback (1-3% typical) when you pay with your Buffr wallet at participating merchants
            </Text>
          </View>
        </GlassCard>

        {/* How It Works */}
        <GlassCard style={styles.infoCard} padding={24} borderRadius={16}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Shop at Participating Merchant</Text>
              <Text style={styles.stepDescription}>
                Visit any merchant that accepts Buffr payments and displays the cashback badge
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Pay with Buffr Wallet</Text>
              <Text style={styles.stepDescription}>
                Scan the merchant QR code or enter merchant details to pay with your Buffr wallet
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Get Instant Cashback</Text>
              <Text style={styles.stepDescription}>
                Cashback is instantly credited to your Buffr wallet. No waiting, no hassle!
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Benefits */}
        <GlassCard style={styles.benefitsCard} padding={24} borderRadius={16}>
          <Text style={styles.sectionTitle}>Benefits</Text>
          
          <View style={styles.benefit}>
            <FontAwesome name="check-circle" size={20} color={Colors.success} />
            <Text style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Reduces NamPost Bottlenecks</Text>
              {'\n'}
              Distributes cash-out load across merchant network, reducing congestion at NamPost branches
            </Text>
          </View>

          <View style={styles.benefit}>
            <FontAwesome name="check-circle" size={20} color={Colors.success} />
            <Text style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Merchant-Funded</Text>
              {'\n'}
              Cashback is funded by merchants (following M-PESA agent network model), not by Buffr
            </Text>
          </View>

          <View style={styles.benefit}>
            <FontAwesome name="check-circle" size={20} color={Colors.success} />
            <Text style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Instant Credit</Text>
              {'\n'}
              Cashback is credited immediately to your wallet after payment
            </Text>
          </View>

          <View style={styles.benefit}>
            <FontAwesome name="check-circle" size={20} color={Colors.success} />
            <Text style={styles.benefitText}>
              <Text style={styles.benefitTitle}>No Extra Fees</Text>
              {'\n'}
              Cashback is a bonus - you pay the same amount, but get cashback back
            </Text>
          </View>
        </GlassCard>

        {/* Important Notes */}
        <GlassCard style={styles.notesCard} padding={16} borderRadius={16}>
          <View style={styles.notesHeader}>
            <FontAwesome name="info-circle" size={20} color={Colors.info} />
            <Text style={styles.notesTitle}>Important Notes</Text>
          </View>
          <Text style={styles.notesText}>
            • Cashback rates vary by merchant (typically 1-3%){'\n'}
            • Cashback is only available at participating merchants{'\n'}
            • Cashback is processed via IPP (Instant Payment Platform) integration{'\n'}
            • Cashback appears in your transaction history{'\n'}
            • You can view your total cashback earned in the Cashback dashboard
          </Text>
        </GlassCard>
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
  heroCard: {
    marginBottom: SECTION_SPACING,
    alignItems: 'center',
    backgroundColor: Colors.success + '10',
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  infoCard: {
    marginBottom: SECTION_SPACING,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16, // Consistent with other screens
  },
  step: {
    flexDirection: 'row',
    marginBottom: 20, // Consistent spacing between steps
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  benefitsCard: {
    marginBottom: SECTION_SPACING,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16, // Consistent spacing between benefits
    gap: 12, // Consistent gap between icon and text
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  benefitTitle: {
    fontWeight: '600',
    color: Colors.text,
  },
  notesCard: {
    marginBottom: SECTION_SPACING,
    backgroundColor: Colors.info + '10',
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16, // Consistent spacing after header
    gap: 8, // Consistent gap between icon and title
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  notesText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
});
