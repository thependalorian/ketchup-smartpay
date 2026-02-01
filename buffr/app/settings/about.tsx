/**
 * About Screen
 * 
 * Location: app/settings/about.tsx
 * Purpose: App information, version, legal documents, licenses
 * 
 * Features:
 * - App version and build info
 * - Company information
 * - Legal documents (Terms, Privacy Policy)
 * - Open source licenses
 * - Regulatory compliance badges
 * - Social media links
 * 
 * Compliance: Bank of Namibia disclosure requirements
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { ScreenHeader, GlassCard, AIChatInterface } from '@/components/common';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/components/layouts';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '100';

interface LegalItem {
  id: string;
  title: string;
  icon: string;
  route?: string;
  url?: string;
}

const legalItems: LegalItem[] = [
  { id: 'terms', title: 'Terms of Service', icon: 'file-text-o', route: '/profile/fees' },
  { id: 'privacy', title: 'Privacy Policy', icon: 'shield', route: '/profile/privacy-policy' },
  { id: 'licenses', title: 'Open Source Licenses', icon: 'code', url: 'https://buffr.na/licenses' },
  { id: 'eula', title: 'End User License Agreement', icon: 'file-o', url: 'https://buffr.na/eula' },
];

interface SocialLink {
  id: string;
  name: string;
  icon: string;
  color: string;
  url: string;
}

const socialLinks: SocialLink[] = [
  { id: 'website', name: 'Website', icon: 'globe', color: Colors.primary, url: 'https://buffr.na' },
  { id: 'twitter', name: 'Twitter', icon: 'twitter', color: '#1DA1F2', url: 'https://twitter.com/buffrna' },
  { id: 'facebook', name: 'Facebook', icon: 'facebook', color: '#4267B2', url: 'https://facebook.com/buffrna' },
  { id: 'instagram', name: 'Instagram', icon: 'instagram', color: '#E4405F', url: 'https://instagram.com/buffrna' },
];

export default function AboutScreen() {
  const router = useRouter();
  const [showAIChat, setShowAIChat] = React.useState(false);

  const handleLegalItemPress = (item: LegalItem) => {
    if (item.route) {
      router.push(item.route as any);
    } else if (item.url) {
      Linking.openURL(item.url);
    }
  };

  const handleSocialPress = (url: string) => {
    Linking.openURL(url);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={defaultStyles.container as any}>
      <ScreenHeader title="About Buffr" showBackButton onBack={handleBack} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Logo & Version */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Buffr</Text>
          </View>
          <Text style={styles.tagline}>Buffr: Your Payment Companion</Text>
          <Text style={styles.versionText}>Version {APP_VERSION} (Build {BUILD_NUMBER})</Text>
        </View>

        {/* Compliance Badges */}
        <GlassCard style={styles.complianceCard} padding={16} borderRadius={16}>
          <Text style={styles.complianceTitle}>Regulated & Secure</Text>
          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <FontAwesome name="bank" size={20} color={Colors.primary} />
              <Text style={styles.badgeText}>Bank of Namibia</Text>
              <Text style={styles.badgeSubtext}>Licensed PSP</Text>
            </View>
            <View style={styles.badge}>
              <FontAwesome name="shield" size={20} color="#4CAF50" />
              <Text style={styles.badgeText}>PCI DSS</Text>
              <Text style={styles.badgeSubtext}>Compliant</Text>
            </View>
            <View style={styles.badge}>
              <FontAwesome name="lock" size={20} color="#2196F3" />
              <Text style={styles.badgeText}>256-bit</Text>
              <Text style={styles.badgeSubtext}>Encryption</Text>
            </View>
          </View>
        </GlassCard>

        {/* Legal Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <GlassCard style={styles.legalCard} padding={0} borderRadius={16}>
            {legalItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.legalItem,
                  index < legalItems.length - 1 && styles.legalItemBorder,
                ]}
                onPress={() => handleLegalItemPress(item)}
              >
                <View style={styles.legalIconContainer}>
                  <FontAwesome name={item.icon as any} size={18} color={Colors.primary} />
                </View>
                <Text style={styles.legalTitle}>{item.title}</Text>
                <FontAwesome
                  name={item.url ? 'external-link' : 'chevron-right'}
                  size={14}
                  color={Colors.textTertiary}
                />
              </TouchableOpacity>
            ))}
          </GlassCard>
        </View>

        {/* Company Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company</Text>
          <GlassCard style={styles.companyCard} padding={16} borderRadius={16}>
            <View style={styles.companyRow}>
              <Text style={styles.companyLabel}>Registered Name</Text>
              <Text style={styles.companyValue}>Buffr Payments (Pty) Ltd</Text>
            </View>
            <View style={styles.companyRow}>
              <Text style={styles.companyLabel}>Registration No.</Text>
              <Text style={styles.companyValue}>2024/XXXX</Text>
            </View>
            <View style={styles.companyRow}>
              <Text style={styles.companyLabel}>PSP License No.</Text>
              <Text style={styles.companyValue}>PSP-NAM-XXXX</Text>
            </View>
            <View style={styles.companyRow}>
              <Text style={styles.companyLabel}>Headquarters</Text>
              <Text style={styles.companyValue}>Windhoek, Namibia</Text>
            </View>
          </GlassCard>
        </View>

        {/* Social Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect With Us</Text>
          <View style={styles.socialGrid}>
            {socialLinks.map((social) => (
              <TouchableOpacity
                key={social.id}
                style={styles.socialButton}
                onPress={() => handleSocialPress(social.url)}
              >
                <View style={[styles.socialIcon, { backgroundColor: `${social.color}15` }]}>
                  <FontAwesome name={social.icon as any} size={22} color={social.color} />
                </View>
                <Text style={styles.socialName}>{social.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.copyrightText}>
            © 2024 Buffr Payments (Pty) Ltd. All rights reserved.
          </Text>
          <Text style={styles.footerText}>
            Made with ❤️ in Namibia
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
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: SECTION_SPACING,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: SECTION_SPACING * 1.5,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  complianceCard: {
    marginBottom: SECTION_SPACING,
  },
  complianceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  badge: {
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  badgeSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: SECTION_SPACING,
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
  legalCard: {},
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  legalItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  legalIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  companyCard: {},
  companyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  companyLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  companyValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  socialGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  socialButton: {
    alignItems: 'center',
    gap: 8,
  },
  socialIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialName: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  footer: {
    alignItems: 'center',
    marginTop: SECTION_SPACING,
    gap: 8,
  },
  copyrightText: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiToggleButton: {
    padding: 4,
  },
  aiChatCard: {
    height: 350,
  },
  aiChat: {
    flex: 1,
  },
});
