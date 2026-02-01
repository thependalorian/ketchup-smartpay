/**
 * FAQs Screen
 * 
 * Location: app/profile/faqs.tsx
 * Purpose: Display frequently asked questions
 * 
 * Features:
 * - Expandable FAQ items
 * - Search functionality
 * - Categories
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ScreenHeader, SectionHeader, EmptyState, AIChatInterface, GlassCard } from '@/components/common';
import Colors from '@/constants/Colors';
import defaultStyles from '@/constants/Styles';
import Layout from '@/constants/Layout';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_CATEGORIES = ['All', 'Account', 'Payments', 'Security', 'Wallets', 'Vouchers', 'General'];

const FAQS: FAQ[] = [
  {
    id: '1',
    question: 'What is Buffr: Your Payment Companion?',
    answer: 'Buffr is your trusted Payment Companion for G2P (Government-to-Person) vouchers, digital payments, and financial services in Namibia. We make it easy to send, receive, and manage money securely.',
    category: 'General',
  },
  {
    id: '2',
    question: 'How do I create a Buffr account?',
    answer: 'Download the Buffr app and follow the registration process. You will need to provide your phone number, verify it with an OTP code, complete your profile setup, and set up a secure PIN.',
    category: 'Account',
  },
  {
    id: '3',
    question: 'How do I redeem a G2P voucher?',
    answer: 'Go to Utilities > Vouchers, select your voucher, and choose a redemption method: wallet, bank transfer, agent cash-out, NamPost, or merchant payment. Follow the prompts and confirm with 2FA to complete your redemption.',
    category: 'Vouchers',
  },
  {
    id: '4',
    question: 'What voucher redemption methods are available?',
    answer: 'You can redeem vouchers to: (1) Your Buffr wallet, (2) Bank transfer, (3) Agent cash-out (visit an agent with QR code), (4) NamPost cash-out, or (5) Merchant payment. All methods require 2FA verification.',
    category: 'Vouchers',
  },
  {
    id: '5',
    question: 'How do I send money to someone?',
    answer: 'Tap "Send" on the home screen, then select a contact or enter their phone number or Buffr ID. Enter the amount, add a note (optional), and confirm with your PIN or biometric authentication.',
    category: 'Payments',
  },
  {
    id: '6',
    question: 'How do I cash out at an agent?',
    answer: 'Go to Agents > Nearby Agents, select an available agent, enter the cash-out amount, and generate a QR code or cash-out code. Visit the agent location with your code and valid ID to receive cash.',
    category: 'Payments',
  },
  {
    id: '7',
    question: 'Is my money safe with Buffr?',
    answer: 'Yes, your money is safe. Buffr uses bank-level AES-256 encryption, 2FA for all critical transactions, and complies with NAMFISA regulations. All transactions are secure, monitored, and audited.',
    category: 'Security',
  },
  {
    id: '8',
    question: 'What are the transaction limits?',
    answer: 'Daily limit: N$5,000 | Monthly limit: N$25,000. You can increase limits by completing full KYC verification in Settings > Profile > Verification.',
    category: 'Payments',
  },
  {
    id: '9',
    question: 'What is a Buffr Wallet?',
    answer: 'A Buffr Wallet is a separate digital wallet you can create for specific purposes like savings, bills, or travel. Each wallet has its own balance, can be customized with different card designs, and supports auto-pay features.',
    category: 'Wallets',
  },
  {
    id: '10',
    question: 'How do I enable two-factor authentication (2FA)?',
    answer: 'Go to Settings > Security > Two-Factor Authentication and follow the setup process. 2FA is required for all critical transactions including voucher redemptions, large transfers, and account changes.',
    category: 'Security',
  },
  {
    id: '11',
    question: 'How long do transfers take?',
    answer: 'Buffr-to-Buffr transfers are instant. Bank transfers may take 1-3 business days depending on the receiving bank. Voucher redemptions are processed immediately upon 2FA verification.',
    category: 'Payments',
  },
  {
    id: '12',
    question: 'What should I do if I forgot my PIN?',
    answer: 'Tap "Forgot PIN" on the login screen. You\'ll receive a verification code via SMS to reset your PIN securely. You may need to verify your identity for security.',
    category: 'Security',
  },
  {
    id: '13',
    question: 'How do I enable biometric authentication?',
    answer: 'Go to Settings > Security > Biometric Authentication and toggle it on. You\'ll need to verify with your device\'s fingerprint or Face ID. This allows quick and secure access to your account.',
    category: 'Security',
  },
  {
    id: '14',
    question: 'Can I use Buffr internationally?',
    answer: 'Currently, Buffr is available in Namibia. International features may be added in the future. Check our app updates for the latest information on new features and regions.',
    category: 'General',
  },
  {
    id: '15',
    question: 'How do I change my profile picture?',
    answer: 'Go to Profile > Edit Profile and tap on your profile picture. You can choose to take a new photo or select one from your gallery. Your photo helps contacts recognize you.',
    category: 'Account',
  },
  {
    id: '16',
    question: 'What is NAMQR and how does it work?',
    answer: 'NAMQRC is Namibia\'s standardized QR code format for digital payments. Buffr supports NAMQR codes for merchant payments, allowing you to scan and pay at participating merchants instantly.',
    category: 'Payments',
  },
];

export default function FAQsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showAIChat, setShowAIChat] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const filteredFAQs = FAQS.filter((faq) => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={defaultStyles.container as any}>
      <ScreenHeader title="FAQs" onBack={handleBack} showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Chat Toggle */}
        <View style={styles.aiSection}>
          <TouchableOpacity
            style={styles.aiToggle}
            onPress={() => setShowAIChat(!showAIChat)}
            activeOpacity={0.7}
          >
            <View style={styles.aiToggleContent}>
              <FontAwesome name="comments" size={20} color={Colors.primary} />
              <View style={styles.aiToggleText}>
                <Text style={styles.aiToggleTitle}>Ask Buffr AI</Text>
                <Text style={styles.aiToggleSubtitle}>
                  Get instant answers powered by AI
                </Text>
              </View>
              <FontAwesome
                name={showAIChat ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Colors.textSecondary}
              />
            </View>
          </TouchableOpacity>
          
          {showAIChat && (
            <GlassCard style={styles.aiChatCard} padding={0} borderRadius={16}>
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
                style={styles.aiChat}
              />
            </GlassCard>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <FontAwesome name="search" size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search FAQs..."
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
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {FAQ_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category && styles.categoryChipTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* FAQ Items */}
        <View style={styles.faqsSection}>
          {filteredFAQs.length === 0 ? (
            <EmptyState
              icon="question-circle"
              iconSize={48}
              iconColor={Colors.textSecondary}
              title="No FAQs found"
              message="Try a different search term or category"
            />
          ) : (
            filteredFAQs.map((faq) => (
              <View key={faq.id} style={styles.faqCard}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggleExpanded(faq.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                  <View style={styles.faqActions}>
                    <TouchableOpacity
                      style={styles.aiAskButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        setShowAIChat(true);
                        // Auto-ask AI about this question
                        setTimeout(() => {
                          // This will be handled by the AIChatInterface component
                          // We'll pass the question as initial message
                        }, 100);
                      }}
                      activeOpacity={0.7}
                    >
                      <FontAwesome name="comments" size={12} color={Colors.primary} />
                    </TouchableOpacity>
                    <FontAwesome
                      name={expandedItems.has(faq.id) ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={Colors.textSecondary}
                    />
                  </View>
                </TouchableOpacity>
                {expandedItems.has(faq.id) && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                    <TouchableOpacity
                      style={styles.askAILink}
                      onPress={() => {
                        setShowAIChat(true);
                      }}
                    >
                      <Text style={styles.askAILinkText}>
                        💬 Ask Buffr AI for more details
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
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
  aiSection: {
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
    paddingTop: 16,
    paddingBottom: 8,
  },
  aiToggle: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  aiToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  aiToggleText: {
    flex: 1,
  },
  aiToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  aiToggleSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  aiChatCard: {
    height: 350,
    marginBottom: 16,
  },
  aiChat: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
    paddingTop: 16,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  categoriesSection: {
    paddingVertical: 16,
  },
  categoriesContainer: {
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundGray,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  faqsSection: {
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
    gap: 12,
  },
  faqCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
  },
  faqAnswerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  faqActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiAskButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  askAILink: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  askAILinkText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
});
