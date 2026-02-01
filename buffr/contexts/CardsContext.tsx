/**
 * Cards Context
 * 
 * Location: contexts/CardsContext.tsx
 * Purpose: Global state management for linked payment cards
 * 
 * Provides card data and methods to add, update, and manage linked cards
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { log } from '@/utils/logger';

// Card interface
export interface Card {
  id: string;
  cardNumber: string; // Full card number (stored securely, displayed as last 4)
  last4: string; // Last 4 digits for display
  expiryDate: string; // Format: MM/YY
  cvv?: string; // CVV (only stored temporarily during setup)
  cardholderName: string;
  cardType: 'debit' | 'credit';
  network: 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';
  bankName?: string;
  isDefault?: boolean; // Default payment method
  isVerified: boolean; // Card verification status
  isActive: boolean; // Card active status
  createdAt: Date;
  lastUsedAt?: Date;
}

interface CardsContextType {
  cards: Card[];
  loading: boolean;
  error: string | null;
  fetchCards: () => Promise<void>;
  getCardById: (id: string) => Card | null;
  addCard: (cardData: Omit<Card, 'id' | 'last4' | 'isVerified' | 'isActive' | 'createdAt'>) => Promise<Card>;
  updateCard: (id: string, updates: Partial<Card>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  setDefaultCard: (id: string) => Promise<void>;
  refreshCards: () => Promise<void>;
  getDefaultCard: () => Card | null;
}

const CardsContext = createContext<CardsContextType | undefined>(undefined);

// Helper function to detect card network from number
const detectCardNetwork = (cardNumber: string): 'visa' | 'mastercard' | 'amex' | 'discover' | 'other' => {
  if (!cardNumber || typeof cardNumber !== 'string') return 'other';
  const cleaned = cardNumber.replace(/\s/g, '');
  if (!cleaned) return 'other';
  if (cleaned.startsWith('4')) return 'visa';
  if (cleaned.startsWith('5') || cleaned.startsWith('2')) return 'mastercard';
  if (cleaned.startsWith('3')) return 'amex';
  if (cleaned.startsWith('6')) return 'discover';
  return 'other';
};

// Helper function to detect card type (debit/credit) - simplified logic
const detectCardType = (cardNumber: string): 'debit' | 'credit' => {
  // In production, this would be determined by the card issuer
  // For now, we'll use a simple heuristic or default to debit
  const cleaned = cardNumber.replace(/\s/g, '');
  // Visa/Mastercard starting with 4 or 5 are often debit
  // This is a simplified check - in production, use card issuer API
  return cleaned.length === 16 ? 'debit' : 'credit';
};

// Real API function - Fetches cards from backend
const fetchCardsFromAPI = async (): Promise<Card[]> => {
  const { apiGet } = await import('@/utils/apiClient');
  const cards = await apiGet<Card[]>('/cards');
  return cards || [];
};

interface CardsProviderProps {
  children: ReactNode;
}

export function CardsProvider({ children }: CardsProviderProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCardsFromAPI();
      setCards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cards');
      log.error('Error fetching cards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCards = useCallback(async () => {
    await fetchCards();
  }, [fetchCards]);

  const getCardById = useCallback(
    (id: string): Card | null => {
      return cards.find((card) => card.id === id) || null;
    },
    [cards]
  );

  const getDefaultCard = useCallback((): Card | null => {
    return cards.find((card) => card.isDefault) || cards[0] || null;
  }, [cards]);

  const addCard = useCallback(
    async (
      cardData: Omit<Card, 'id' | 'last4' | 'isVerified' | 'isActive' | 'createdAt'>
    ): Promise<Card> => {
      setLoading(true);
      setError(null);
      try {
        const { apiPost } = await import('@/utils/apiClient');
        const newCard = await apiPost<Card>('/cards', {
          cardNumber: cardData.cardNumber,
          expiryMonth: parseInt(cardData.expiryDate.split('/')[0]),
          expiryYear: parseInt('20' + cardData.expiryDate.split('/')[1]),
          cardholderName: cardData.cardholderName,
          cardType: cardData.cardType || 'debit',
          bankName: cardData.bankName,
        });

        // Refresh cards list
        await fetchCards();
        return newCard;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add card';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchCards]
  );

  const updateCard = useCallback(async (id: string, updates: Partial<Card>) => {
    setLoading(true);
    setError(null);
    try {
      const { apiPut } = await import('@/utils/apiClient');
      await apiPut<Card>(`/cards/${id}`, updates);

      // Refresh cards list to get updated state from server
      await fetchCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update card');
      log.error('Error updating card:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCards]);

  const deleteCard = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { apiDelete } = await import('@/utils/apiClient');
      await apiDelete(`/cards/${id}`);
      
      // Refresh cards list to get updated state from server
      await fetchCards();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete card';
      setError(errorMessage);
      log.error('Error deleting card:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCards]);

  const setDefaultCard = useCallback(async (id: string) => {
    await updateCard(id, { isDefault: true });
  }, [updateCard]);

  const value: CardsContextType = {
    cards,
    loading,
    error,
    fetchCards,
    getCardById,
    addCard,
    updateCard,
    deleteCard,
    setDefaultCard,
    refreshCards,
    getDefaultCard,
  };

  return (
    <CardsContext.Provider value={value}>
      {children}
    </CardsContext.Provider>
  );
}

export function useCards() {
  const context = useContext(CardsContext);
  if (context === undefined) {
    throw new Error('useCards must be used within a CardsProvider');
  }
  return context;
}
