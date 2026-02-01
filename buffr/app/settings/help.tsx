/**
 * Help & Support Screen
 * 
 * Location: app/settings/help.tsx
 * Purpose: Help center with FAQs, contact options, and support
 * 
 * Features:
 * - Searchable FAQ section
 * - Contact support options (chat, email, phone)
 * - Quick help categories
 * - Submit feedback
 * - Report issues
 * 
 * Compliance: PSD-3 §10 - Customer support requirements
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { ScreenHeader, GlassCard, AIChatInterface } from '@/components/common';
import { HORIZONTAL_PADDING, SECTION_SPACING, CARD_GAP } from '@/components/layouts';
import { log } from '@/utils/logger';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface HelpCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
}

const helpCategories: HelpCategory[] = [
  { id: 'getting-started', title: 'Getting Started', icon: 'rocket', color: '#4CAF50' },
  { id: 'payments', title: 'Payments', icon: 'money', color: Colors.primary },
  { id: 'security', title: 'Security', icon: 'shield', color: '#2196F3' },
  { id: 'account', title: 'Account', icon: 'user', color: '#FF9800' },
  { id: 'fees', title: 'Fees & Limits', icon: 'calculator', color: '#9C27B0' },
  { id: 'troubleshooting', title: 'Troubleshooting', icon: 'wrench', color: '#607D8B' },
  { id: 'accessibility', title: 'Accessibility', icon: 'universal-access', color: '#0ea5e9' },
];

const faqItems: FAQItem[] = [
  {
    id: '1',
    question: 'What is Buffr?',
    answer: 'Buffr is your Payment Companion - a secure platform for G2P (Government-to-Person) vouchers, digital payments, and financial services in Namibia. Send, receive, and manage money with ease.',
    category: 'getting-started',
  },
  {
    id: '2',
    question: 'How do I redeem a G2P voucher?',
    answer: 'Go to Utilities > Vouchers, select your voucher, and choose a redemption method: wallet, bank transfer, agent cash-out, NamPost, or merchant payment. Follow the prompts to complete your redemption.',
    category: 'payments',
  },
  {
    id: '3',
    question: 'How do I send money to someone?',
    answer: 'Tap "Send" on the home screen, then select a contact or enter their phone number. Enter the amount and confirm with your PIN or biometric authentication.',
    category: 'payments',
  },
  {
    id: '4',
    question: 'What are the transaction limits?',
    answer: 'Daily limit: N$5,000 | Monthly limit: N$25,000. You can increase limits by completing full KYC verification in your profile settings.',
    category: 'fees',
  },
  {
    id: '5',
    question: 'How do I enable biometric authentication?',
    answer: 'Go to Settings > Security > Biometric Authentication and toggle it on. You\'ll need to verify with your device\'s fingerprint or Face ID for secure access.',
    category: 'security',
  },
  {
    id: '6',
    question: 'What should I do if I forgot my PIN?',
    answer: 'Tap "Forgot PIN" on the login screen. You\'ll receive a verification code via SMS to reset your PIN securely.',
    category: 'security',
  },
  {
    id: '7',
    question: 'How long do transfers take?',
    answer: 'Buffr-to-Buffr transfers are instant. Bank transfers may take 1-3 business days depending on the receiving bank. Voucher redemptions are processed immediately.',
    category: 'payments',
  },
  {
    id: '8',
    question: 'How do I cash out at an agent?',
    answer: 'Go to Agents > Nearby Agents, select an agent, enter the amount, and generate a QR code or cash-out code. Visit the agent location with your code and valid ID to receive cash.',
    category: 'payments',
  },
  {
    id: '9',
    question: 'Is my money safe with Buffr?',
    answer: 'Yes, your money is safe. Buffr uses bank-level encryption, 2FA for all transactions, and complies with NAMFISA regulations. All transactions are secure and monitored.',
    category: 'security',
  },
  {
    id: '10',
    question: 'What is a Buffr Wallet?',
    answer: 'A Buffr Wallet is a separate digital wallet you can create for specific purposes like savings, bills, or travel. Each wallet has its own balance and can be customized with different card designs.',
    category: 'account',
  },
  {
    id: '11',
    question: 'I don\'t have a smartphone. How can I use Buffr?',
    answer: 'Dial *123# on any phone (feature phone or smartphone) for balance, send money, pay bills, redeem vouchers, and more. No app or internet required. Voice support (IVR) is also available in English and local languages – call the number in Settings > Accessibility.',
    category: 'accessibility',
  },
  {
    id: '12',
    question: 'How do I use Buffr with a screen reader (TalkBack / VoiceOver)?',
    answer: 'Buffr supports TalkBack (Android) and VoiceOver (iOS). Enable it in your device accessibility settings. For balance and agent list without the app, use USSD *123# or call the IVR hotline. In Settings > Help you can find an "Accessibility" section with the IVR number.',
    category: 'accessibility',
  },
  {
    id: '13',
    question: 'Can I use Buffr in my preferred language?',
    answer: 'The app supports English. USSD *123# and IVR support English plus local languages (e.g. Oshiwambo, Otjiherero). Select language when you dial *123# or in the IVR menu.',
    category: 'accessibility',
  },
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const filteredFaqs = searchQuery
    ? faqItems.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqItems;

  const handleContactSupport = (method: 'chat' | 'email' | 'phone') => {
    switch (method) {
      case 'chat':
        router.push('/profile/contact-support');
        break;
      case 'email':
        Linking.openURL('mailto:support@buffr.na?subject=Support Request');
        break;
      case 'phone':
        Alert.alert(
          'Call Support',
          'Our support line is available Mon-Fri 8:00 - 17:00',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call +264 61 123 4567', onPress: () => Linking.openURL('tel:+26461234567') },
          ]
        );
        break;
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    // Filter FAQs by category or navigate to category detail
    router.push('/profile/faqs');
  };

  const handleSubmitFeedback = () => {
    Alert.alert(
      'Submit Feedback',
      'We appreciate your feedback! How would you like to share?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'App Store Review', onPress: () => log.info('Open app store') },
        { text: 'In-App Feedback', onPress: () => router.push('/profile/contact-support') },
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={defaultStyles.container as any}>
      <ScreenHeader title="Help & Support" showBackButton onBack={handleBack} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Support Chat - Primary Interface */}
        <View style={styles.supportSection}>
          <Text style={styles.sectionTitle}>Customer Support</Text>
          <GlassCard style={styles.supportChatCard} padding={0} borderRadius={16}>
            <AIChatInterface
              mode="support"
              placeholder="Describe your issue or ask a question..."
              initialMessage="Hi! I'm Buffr's AI Support Assistant. I'm here to help with G2P vouchers, payments, account issues, or anything else related to Buffr: Your Payment Companion. If you need to speak with a human agent, just ask!"
              onTicketCreated={(ticketNumber) => {
                // Ticket created - handled in component
              }}
              onEscalated={(ticketNumber) => {
                // Escalated - handled in component
              }}
              style={styles.supportChat}
            />
          </GlassCard>
        </View>

        {/* Search Bar */}
        <GlassCard style={styles.searchCard} padding={12} borderRadius={12}>
          <View style={styles.searchContainer}>
            <FontAwesome name="search" size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search help articles..."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <FontAwesome name="times-circle" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </GlassCard>

        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactGrid}>
            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => handleContactSupport('chat')}
            >
              <View style={[styles.contactIcon, { backgroundColor: `${Colors.primary}15` }]}>
                <FontAwesome name="comments" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.contactTitle}>Live Chat</Text>
              <Text style={styles.contactSubtitle}>Available 24/7</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => handleContactSupport('email')}
            >
              <View style={[styles.contactIcon, { backgroundColor: '#4CAF5015' }]}>
                <FontAwesome name="envelope" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.contactTitle}>Email</Text>
              <Text style={styles.contactSubtitle}>24-48hr response</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => handleContactSupport('phone')}
            >
              <View style={[styles.contactIcon, { backgroundColor: '#2196F315' }]}>
                <FontAwesome name="phone" size={24} color="#2196F3" />
              </View>
              <Text style={styles.contactTitle}>Phone</Text>
              <Text style={styles.contactSubtitle}>Mon-Fri 8-17h</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Accessibility support (PRD FR4.6, G2P 4.0 / SASSA inclusion) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accessibility Support</Text>
          <GlassCard style={styles.accessibilityCard} padding={16} borderRadius={12}>
            <Text style={styles.accessibilityIntro}>
              No smartphone or prefer voice? Use USSD or IVR in English and local languages.
            </Text>
            <View style={styles.accessibilityRow}>
              <Text style={styles.accessibilityLabel}>USSD (any phone):</Text>
              <Text style={styles.accessibilityValue}>*123#</Text>
            </View>
            <View style={styles.accessibilityRow}>
              <Text style={styles.accessibilityLabel}>IVR hotline (voice):</Text>
              <TouchableOpacity onPress={() => Linking.openURL('tel:0800123456')}>
                <Text style={styles.accessibilityLink}>0800 123 456</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.accessibilityNote}>
              Balance, send money, pay bills, redeem vouchers, and find agents – all without the app.
            </Text>
          </GlassCard>
        </View>

        {/* Help Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <View style={styles.categoriesGrid}>
            {helpCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category.id)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: `${category.color}15` }]}>
                  <FontAwesome name={category.icon as any} size={20} color={category.color} />
                </View>
                <Text style={styles.categoryTitle}>{category.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular FAQs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Questions</Text>
            <TouchableOpacity onPress={() => router.push('/profile/faqs')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <GlassCard style={styles.faqCard} padding={0} borderRadius={16}>
            {filteredFaqs.slice(0, 5).map((faq, index) => (
              <TouchableOpacity
                key={faq.id}
                style={[
                  styles.faqItem,
                  index < Math.min(filteredFaqs.length, 5) - 1 && styles.faqItemBorder,
                ]}
                onPress={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <FontAwesome
                    name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={Colors.textSecondary}
                  />
                </View>
                {expandedFaq === faq.id && (
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
          </GlassCard>
        </View>

        {/* Feedback Section */}
        <GlassCard style={styles.feedbackCard} padding={16} borderRadius={16}>
          <View style={styles.feedbackContent}>
            <FontAwesome name="heart" size={24} color={Colors.error} />
            <View style={styles.feedbackText}>
            <Text style={styles.feedbackTitle}>Enjoying Buffr: Your Payment Companion?</Text>
            <Text style={styles.feedbackSubtitle}>Your feedback helps us improve your experience</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.feedbackButton} onPress={handleSubmitFeedback}>
            <Text style={styles.feedbackButtonText}>Give Feedback</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Quick Links */}
        <View style={styles.quickLinks}>
          <TouchableOpacity 
            style={styles.quickLink}
            onPress={() => router.push('/profile/privacy-policy')}
          >
            <Text style={styles.quickLinkText}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.quickLinkDivider}>•</Text>
          <TouchableOpacity 
            style={styles.quickLink}
            onPress={() => router.push('/profile/fees')}
          >
            <Text style={styles.quickLinkText}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.quickLinkDivider}>•</Text>
          <TouchableOpacity 
            style={styles.quickLink}
            onPress={() => router.push('/settings/about')}
          >
            <Text style={styles.quickLinkText}>About</Text>
          </TouchableOpacity>
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
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: SECTION_SPACING,
    paddingBottom: 40,
  },
  searchCard: {
    marginBottom: SECTION_SPACING,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CARD_GAP,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  section: {
    marginBottom: SECTION_SPACING,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  contactGrid: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },
  contactCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  contactSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  accessibilityCard: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  accessibilityIntro: {
    fontSize: 14,
    color: '#0c4a6e',
    marginBottom: 12,
    lineHeight: 20,
  },
  accessibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  accessibilityLabel: {
    fontSize: 14,
    color: '#075985',
    marginRight: 8,
  },
  accessibilityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c4a6e',
  },
  accessibilityLink: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  accessibilityNote: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    lineHeight: 18,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  categoryCard: {
    width: '31%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
  faqCard: {},
  faqItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  faqItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: CARD_GAP,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    lineHeight: 22,
  },
  faqAnswer: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 10,
  },
  feedbackCard: {
    marginBottom: SECTION_SPACING,
  },
  feedbackContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  feedbackText: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  feedbackSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  feedbackButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  feedbackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  quickLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  quickLink: {
    padding: 4,
  },
  quickLinkText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  quickLinkDivider: {
    color: Colors.textTertiary,
  },
  supportSection: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 16,
    paddingBottom: 8,
  },
  supportChatCard: {
    height: 400,
    marginBottom: SECTION_SPACING,
  },
  supportChat: {
    flex: 1,
  },
  aiChatCard: {
    height: 400,
    marginBottom: SECTION_SPACING,
  },
  aiChat: {
    flex: 1,
  },
});
