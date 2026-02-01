/**
 * Buffr Home Screen
 * 
 * Location: app/(tabs)/index.tsx
 * Purpose: Main home screen displaying account balance, card, and wallets
 * 
 * Based on Buffr App Design
 * Uses reusable components from components folder
 */

import React, { useState, useEffect, useCallback } from 'react';
import logger, { log } from '@/utils/logger';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING, LARGE_SECTION_SPACING, CARD_GAP } from '@/constants/Layout';
import { useWallets } from '@/contexts/WalletsContext';
import { useUser } from '@/contexts/UserContext';
import {
  SearchBar,
  BalanceDisplay,
  WalletCard,
  AddWalletCard,
  UtilityButton,
  ActionButton,
  AccountQuickView,
} from '@/components';
import { useCards } from '@/contexts/CardsContext';
import { useTransactions } from '@/contexts/TransactionsContext';
import TransactionListItem from '@/components/common/TransactionListItem';
import { GlassCard } from '@/components/common';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Wallet card width from wireframes
const WALLET_CARD_WIDTH = 108.667; // ✅ Exact from wireframes (width="108.667")
// Utility button width calculation using exact wireframe spacing
// Formula: (screen width - horizontal padding * 2 - gaps between buttons) / number of buttons
// For single button: use Grid.COLUMN_3_WIDTH for consistency
const UTILITY_BUTTON_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - (CARD_GAP * 2)) / 3;

export default function HomeScreen() {
  const router = useRouter();
  const { wallets = [], fetchWallets } = useWallets();
  const { user, preferences, fetchUser, toggleBalanceVisibility, loading: userLoading } = useUser();
  const { fetchCards } = useCards();
  const { transactions = [], fetchTransactions } = useTransactions();


  useEffect(() => {
    // Wrap in try-catch to prevent crashes on initial load
    try {
      fetchWallets().catch((err) => {
        logger.error('Failed to fetch wallets:', err);
      });
      fetchUser().catch((err) => {
        logger.error('Failed to fetch user:', err);
      });
      fetchCards().catch((err) => {
        logger.error('Failed to fetch cards:', err);
      });
      fetchTransactions().catch((err) => {
        logger.error('Failed to fetch transactions:', err);
      });
    } catch (error) {
      log.error('Error in initial data fetch:', error);
    }
  }, [fetchWallets, fetchUser, fetchCards, fetchTransactions]);

  // Get balance from user context or default to 0
  // Add safety checks to prevent crashes
  const balance = user?.buffrCardBalance ?? 0;
  const currency = user?.currency ?? preferences?.currency ?? 'N$';

  const handleNotificationPress = () => {
    // Navigate to notifications
    logger.info('Notifications pressed');
  };

  const handleProfilePress = () => {
    // Navigate to profile screen
    router.push('/profile');
  };

  const handleAddFunds = () => {
    // Navigate to cards screen to add a card
    router.push('/cards');
  };

  const handleAddCard = () => {
    // Navigate to add card screen
    router.push('/add-card');
  };

  const handleAccountPress = (accountId: string, type: 'buffr' | 'card') => {
    if (type === 'card') {
      // Navigate to card details/management
      router.push(`/cards/${accountId}`);
    } else {
      // Buffr main account - navigate to account details screen
      router.push('/cards/buffr-account');
    }
  };

  const handleAddWallet = () => {
    router.push('/add-wallet');
  };

  const handleWalletPress = (walletId: string) => {
    router.push(`/wallets/${walletId}`);
  };

  const handleUtilityPress = (utilityName: string) => {
    // Handle utility button press
    logger.info(`${utilityName} pressed`);
  };

  const handleSendPress = () => {
    // Navigate to send money screen
    router.push('/send-money/select-recipient');
  };

  const handleScanPress = () => {
    // Navigate to standalone QR scanner (separate from send-money flow)
    router.push('/qr-scanner');
  };

  // Generate Buffr account number (same as AccountQuickView)
  const getBuffrAccountNumber = (): string => {
    if (!user) return '018';
    const identifier = user.id || user.email || user.phoneNumber || '018';
    const hash = identifier.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return String(hash % 1000).padStart(3, '0');
  };

  return (
    <View style={defaultStyles.containerFull as any}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        scrollEnabled={true}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <SearchBar
            onNotificationPress={handleNotificationPress}
            onProfilePress={handleProfilePress}
          />
        </View>

        {/* Buffr Account Section */}
        <View style={styles.accountSection}>
          {/* Account Quick View - Centered */}
          <AccountQuickView
            onAddCard={handleAddCard}
            onAccountPress={handleAccountPress}
          />

          {/* Balance Display */}
          <BalanceDisplay
            balance={balance}
            currency={currency}
            showBalance={preferences.showBalance ?? false}
            onShowToggle={toggleBalanceVisibility}
            onAddFunds={handleAddFunds}
          />
        </View>

        {/* Buffr Card Section with Gradient Background - Centered */}
        <View style={styles.cardSectionWrapper}>
          <View style={styles.gradientBlob} />
          <View style={styles.cardSection}>
            <TouchableOpacity
              onPress={() => router.push('/cards/buffr-account')}
              activeOpacity={0.7}
            >
              <GlassCard style={styles.cardContainer} padding={16} borderRadius={16}>
                <View style={styles.cardContent}>
                  <View style={styles.cardPreview}>
                    <View style={styles.cardVisual}>
                      <View style={styles.cardGradient} />
                    </View>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>Buffr Card</Text>
                    <Text style={styles.cardNumber}>...{getBuffrAccountNumber()}</Text>
                  </View>
                  <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} style={{ marginLeft: 16 }} />
                </View>
              </GlassCard>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wallets Section */}
        <View style={styles.walletsSection}>
          <Text style={styles.sectionTitle}>Wallets</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.walletsScrollContent}
          >
            {(wallets || []).map((wallet, index) => (
              <TouchableOpacity
                key={wallet.id}
                onPress={() => handleWalletPress(wallet.id)}
                style={index > 0 ? { marginLeft: 12 } : undefined}
              >
                <WalletCard
                  name={wallet.name}
                  balance={wallet.balance}
                  currency={wallet.currency || 'N$'}
                  icon="credit-card"
                  width={WALLET_CARD_WIDTH}
                />
              </TouchableOpacity>
            ))}
            <AddWalletCard
              width={WALLET_CARD_WIDTH}
              onPress={handleAddWallet}
              style={(wallets || []).length > 0 ? { marginLeft: 12 } : undefined}
            />
          </ScrollView>
        </View>

        {/* Utilities/Services Grid - Progressive Disclosure (Hick's Law) */}
        <View style={styles.utilitiesSection}>
          {/* Primary utilities - G2P Voucher Platform only */}
          <View style={styles.utilitiesGrid}>
            <UtilityButton
              label="Vouchers"
              icon="ticket"
              width={UTILITY_BUTTON_WIDTH}
              onPress={() => router.push('/utilities/vouchers')}
            />
          </View>
        </View>

        {/* Recent Transactions Section */}
        {transactions.length > 0 && (
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.transactionsList}>
              {(transactions || []).slice(0, 5).map((transaction) => (
                <TransactionListItem
                  key={transaction.id}
                  transaction={transaction}
                  onPress={() => router.push(`/transactions/${transaction.id}`)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons - Below Utilities Grid */}
        <View style={styles.actionButtonsContainer}>
          <View style={styles.actionButtonWrapper}>
            <ActionButton
              label="Send"
              icon="paper-plane"
              variant="primary"
              onPress={handleSendPress}
            />
          </View>
          <View style={styles.actionButtonWrapper}>
            <ActionButton
              label="Scan"
              icon="qrcode"
              variant="dark"
              onPress={handleScanPress}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 50,
    paddingBottom: 24,
  },
  accountSection: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: SECTION_SPACING,
    paddingTop: 8,
    alignItems: 'center',
  },
  // Card Section with Gradient Background
  cardSectionWrapper: {
    position: 'relative',
    marginBottom: SECTION_SPACING,
    marginTop: 8,
    overflow: 'visible',
  },
  gradientBlob: {
    position: 'absolute',
    bottom: -40,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primaryLight,
    opacity: 0.15,
    zIndex: 0,
  },
  cardSection: {
    paddingHorizontal: HORIZONTAL_PADDING,
    position: 'relative',
    zIndex: 1,
    alignItems: 'center', // Center the card container
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400, // Limit width for better centering on larger screens
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardPreview: {
    width: 56,
    height: 36,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardVisual: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  cardGradient: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    opacity: 0.8,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  walletsSection: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: SECTION_SPACING,
    marginTop: 8,
    position: 'relative',
    zIndex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16, // Consistent spacing
  },
  walletsScrollContent: {
    paddingRight: HORIZONTAL_PADDING,
  },
  utilitiesSection: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: SECTION_SPACING,
    marginTop: 8,
  },
  utilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  utilityButtonWrapper: {
    marginRight: 12,
    marginBottom: 12,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    marginTop: SECTION_SPACING,
    marginBottom: 40,
    paddingTop: 16,
    paddingBottom: 16,
  },
  transactionsSection: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: SECTION_SPACING,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  transactionsList: {
    // Gap handled by TransactionListItem marginBottom
  },
  actionButtonWrapper: {
    marginHorizontal: 8,
  },
});
