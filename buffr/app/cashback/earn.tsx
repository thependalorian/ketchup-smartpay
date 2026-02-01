/**
 * How to Earn Cashback Screen
 * 
 * Location: app/cashback/earn.tsx
 * Purpose: Explain how to earn cashback at merchant tills
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
import { GlassCard, PillButton } from '@/components/common';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';

export default function HowToEarnCashbackScreen() {
  const router = useRouter();

  return (
    <StandardScreenLayout title="How to Earn Cashback">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <GlassCard style={styles.heroCard} padding={24} borderRadius={16}>
          <View style={styles.heroContent}>
            <FontAwesome name="gift" size={64} color={Colors.success} />
            <Text style={styles.heroTitle}>Earn Cashback When You Shop</Text>
            <Text style={styles.heroSubtitle}>
              Get 1-3% cashback (merchant-funded) when you pay with your Buffr wallet at participating merchants
            </Text>
          </View>
        </GlassCard>

        {/* Steps */}
        <GlassCard style={styles.stepsCard} padding={24} borderRadius={16}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Find Participating Merchants</Text>
              <Text style={styles.stepDescription}>
                Look for merchants displaying the cashback badge or check the "Nearby Merchants" section
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
                Scan the merchant QR code or enter merchant details to pay with your Buffr wallet at the POS terminal
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
          <Text style={styles.sectionTitle}>Why Cashback at Tills?</Text>
          
          <View style={styles.benefit}>
            <FontAwesome name="check-circle" size={20} color={Colors.success} />
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Reduces NamPost Bottlenecks</Text>
              <Text style={styles.benefitDescription}>
                Distributes cash-out load across merchant network, reducing congestion at NamPost branches during peak periods
              </Text>
            </View>
          </View>

          <View style={styles.benefit}>
            <FontAwesome name="check-circle" size={20} color={Colors.success} />
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Merchant-Funded</Text>
              <Text style={styles.benefitDescription}>
                Cashback is funded by merchants (following M-PESA agent network model), not by Buffr or beneficiaries
              </Text>
            </View>
          </View>

          <View style={styles.benefit}>
            <FontAwesome name="check-circle" size={20} color={Colors.success} />
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Instant Credit</Text>
              <Text style={styles.benefitDescription}>
                Cashback is credited immediately to your wallet after payment via IPP integration
              </Text>
            </View>
          </View>

          <View style={styles.benefit}>
            <FontAwesome name="check-circle" size={20} color={Colors.success} />
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>No Extra Fees</Text>
              <Text style={styles.benefitDescription}>
                Cashback is a bonus - you pay the same amount, but get cashback back. No hidden fees!
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Tips */}
        <GlassCard style={styles.tipsCard} padding={16} borderRadius={16}>
          <View style={styles.tipsHeader}>
            <FontAwesome name="lightbulb-o" size={20} color={Colors.warning} />
            <Text style={styles.tipsTitle}>Tips to Maximize Cashback</Text>
          </View>
          <Text style={styles.tipsText}>
            • Look for merchants with higher cashback rates (2-3%){'\n'}
            • Pay larger amounts to earn more cashback{'\n'}
            • Check available offers in the Cashback dashboard{'\n'}
            • Cashback is available at all participating merchants{'\n'}
            • Cashback can be used for any Buffr wallet transaction
          </Text>
        </GlassCard>

        {/* CTA */}
        <View style={styles.ctaContainer}>
          <PillButton
            label="Find Nearby Merchants"
            icon="store"
            variant="primary"
            onPress={() => router.push('/merchants')}
            style={styles.ctaButton}
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
  stepsCard: {
    marginBottom: SECTION_SPACING,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 20,
  },
  step: {
    flexDirection: 'row',
    marginBottom: SECTION_SPACING,
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
    marginBottom: 16,
    gap: 12,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  tipsCard: {
    marginBottom: SECTION_SPACING,
    backgroundColor: Colors.warning + '10',
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  tipsText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  ctaContainer: {
    marginTop: 8,
  },
  ctaButton: {
    width: '100%',
  },
});
