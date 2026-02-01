/**
 * CardSelectionView Component
 * 
 * Location: components/cards/CardSelectionView.tsx
 * Purpose: Display selectable list of cards for payment/transaction selection
 * 
 * Features:
 * - List of linked cards (debit/credit)
 * - Selection state management
 * - Card details display
 * - Add new card option
 * - Consistent with CardList but with selection capability
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { EmptyState, GlassCard } from '@/components/common';

interface Card {
  id: string;
  last4: string;
  cardType: 'debit' | 'credit';
  network: 'visa' | 'mastercard' | 'other';
  cardholderName: string;
  expiryDate: string;
  isDefault?: boolean;
}

interface CardSelectionViewProps {
  cards: Card[];
  selectedCardId?: string;
  onCardSelect?: (card: Card) => void;
  onAddCard?: () => void;
  showAddCard?: boolean;
}

export default function CardSelectionView({
  cards,
  selectedCardId,
  onCardSelect,
  onAddCard,
  showAddCard = true,
}: CardSelectionViewProps) {
  const getNetworkIcon = (network: string) => {
    switch (network) {
      case 'visa':
        return 'cc-visa';
      case 'mastercard':
        return 'cc-mastercard';
      default:
        return 'credit-card';
    }
  };

  const getNetworkColor = (network: string) => {
    switch (network) {
      case 'visa':
        return '#1A1F71';
      case 'mastercard':
        return '#EB001B';
      default:
        return Colors.primary;
    }
  };

  if (cards.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="credit-card"
          title="No cards linked"
          message="Add a card to use for payments"
          actionLabel="Add Your First Card"
          onAction={onAddCard}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {cards.map((card) => {
          const isSelected = selectedCardId === card.id;
          const networkColor = getNetworkColor(card.network);

          return (
            <TouchableOpacity
              key={card.id}
              onPress={() => onCardSelect?.(card)}
              activeOpacity={0.7}
            >
              <GlassCard
                style={[
                  styles.cardItem,
                  isSelected && styles.cardItemSelected,
                ]}
                padding={16}
                borderRadius={16}
              >
                <View style={styles.cardContent}>
                  <View
                    style={[
                      styles.cardIcon,
                      { backgroundColor: networkColor + '20' },
                    ]}
                  >
                    <FontAwesome
                      name={getNetworkIcon(card.network) as any}
                      size={32}
                      color={networkColor}
                    />
                  </View>
                  <View style={styles.cardInfo}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardType}>
                        {card.cardType === 'credit' ? 'Credit' : 'Debit'} Card
                      </Text>
                      {card.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardNumber}>
                      •••• •••• •••• {card.last4}
                    </Text>
                    <Text style={styles.cardName}>{card.cardholderName}</Text>
                    <Text style={styles.cardExpiry}>Expires {card.expiryDate}</Text>
                  </View>
                  <View style={styles.selectionIndicator}>
                    {isSelected ? (
                      <View style={styles.selectedCircle}>
                        <FontAwesome name="check" size={16} color={Colors.white} />
                      </View>
                    ) : (
                      <View style={styles.unselectedCircle} />
                    )}
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}

        {showAddCard && (
          <TouchableOpacity onPress={onAddCard} activeOpacity={0.7}>
            <GlassCard
              style={styles.addCardItem}
              padding={16}
              borderRadius={16}
            >
              <View style={styles.addCardContent}>
                <View
                  style={[
                    styles.addCardIcon,
                    { backgroundColor: Colors.primary + '20' },
                  ]}
                >
                  <FontAwesome name="plus" size={24} color={Colors.primary} />
                </View>
                <Text style={styles.addCardText}>Add New Card</Text>
                <FontAwesome
                  name="chevron-right"
                  size={18}
                  color={Colors.textSecondary}
                />
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    flex: 1,
    padding: 20,
  },
  cardItem: {
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  cardItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardType: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  defaultBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  cardNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  cardName: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  cardExpiry: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unselectedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  addCardItem: {
    marginTop: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  addCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCardText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
});
