/**
 * Send Money: Enter Amount Screen
 * 
 * Location: app/send-money/enter-amount.tsx
 * 
 * Purpose: First step after selecting a recipient. User enters the amount to send.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import defaultStyles from '@/constants/Styles';
import Layout from '@/constants/Layout';
import { ScreenHeader, ContactDetailCard, PillButton, NumericKeypad } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import { log } from '@/utils/logger';

export default function EnterAmountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    contactId?: string;
    contactName?: string;
    contactPhone?: string;
  }>();
  
  const { user } = useUser();
  const currency = user?.currency || 'N$';
  
  const [amount, setAmount] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  // Check if contact is favorite on mount
  React.useEffect(() => {
    const checkFavorite = async () => {
      if (params.contactId) {
        try {
          const { isFavorite: checkIsFavorite } = await import('@/utils/favorites');
          const favorite = await checkIsFavorite(params.contactId);
          setIsFavorite(favorite);
        } catch (error) {
          log.error('Error checking favorite:', error);
        }
      }
    };
    checkFavorite();
  }, [params.contactId]);

  const handleFavoriteToggle = async () => {
    try {
      const { toggleFavorite } = await import('@/utils/favorites');
      const newFavoriteStatus = await toggleFavorite({
        id: params.contactId || '',
        name: params.contactName || 'Unknown',
        phoneNumber: params.contactPhone || '',
        contactId: params.contactId,
      });
      setIsFavorite(newFavoriteStatus);
    } catch (error) {
      log.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setAmount(cleaned);
  };

  const handleContinue = () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    router.push({
      pathname: '/send-money/select-method',
      params: { ...params, amount },
    });
  };

  const quickAmounts = [100, 500, 1000];

  const contactData = {
    name: params.contactName || 'Unknown',
    phoneNumber: params.contactPhone || '',
    avatar: undefined,
  };

  return (
    <View style={defaultStyles.containerFull}>
      <ScreenHeader
        title="Send Money"
        showBackButton
        onBack={() => router.back()}
        rightAction={
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoriteToggle}
            activeOpacity={0.7}
          >
            <FontAwesome
              name={isFavorite ? 'heart' : 'heart-o'}
              size={20}
              color={isFavorite ? Colors.error : Colors.text}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.recipientSection}>
          <ContactDetailCard contact={contactData} avatarSize={80} />
        </View>

        <View style={styles.amountSection}>
          <View style={styles.amountDisplayContainer}>
            <Text style={styles.currencySymbolLarge}>{currency}</Text>
            <Text style={[styles.amountTextLarge, !amount && styles.placeholderText]}>
              {amount || '0'}
            </Text>
          </View>
          
          <NumericKeypad
            onPress={(key) => {
              if (key === '.') {
                if (!amount.includes('.')) setAmount(prev => prev + '.');
              } else {
                setAmount(prev => prev + key);
              }
            }}
            onBackspace={() => setAmount(prev => prev.slice(0, -1))}
          />
        </View>
      </ScrollView>

      <View style={styles.continueButtonContainer}>
        <PillButton
          label="Continue"
          variant="primary"
          onPress={handleContinue}
          disabled={!amount || parseFloat(amount) <= 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Layout.HORIZONTAL_PADDING,
    paddingBottom: 40,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipientSection: {
    marginBottom: Layout.SECTION_SPACING,
    alignItems: 'center',
  },
  amountSection: {
    alignItems: 'center',
  },
  amountDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 40,
  },
  currencySymbolLarge: {
    fontSize: 32,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  amountTextLarge: {
    fontSize: 64,
    fontWeight: '700',
    color: Colors.text,
  },
  placeholderText: {
    color: Colors.border,
  },
  continueButtonContainer: {
    padding: Layout.HORIZONTAL_PADDING,
    paddingBottom: 40,
    backgroundColor: Colors.background,
  },
});
