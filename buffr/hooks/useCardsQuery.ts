/**
 * Cards Query Hooks
 *
 * Location: hooks/useCardsQuery.ts
 * Purpose: React Query hooks for card management with caching
 *
 * Performance Benefits:
 * - Card data cached for 2 minutes (more stable than transactions)
 * - Optimistic updates for card settings changes
 * - Background prefetching for card details
 *
 * Replaces CardsContext fetching with React Query's cache management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/apiClient';
import { queryKeys, invalidateCache } from '@/utils/queryClient';

// Card interface
export interface Card {
  id: string;
  cardNumber: string; // Last 4 digits only
  cardholderName: string;
  expiryDate: string; // MM/YY
  cardType: 'debit' | 'credit' | 'prepaid' | 'virtual';
  network: 'visa' | 'mastercard' | 'amex' | 'discover';
  bankName?: string;
  bankLogo?: string;
  balance?: number; // For prepaid/debit cards
  creditLimit?: number; // For credit cards
  availableCredit?: number;
  isDefault: boolean;
  isActive: boolean;
  cardDesign?: number; // Frame number from Buffr Card Design
  linkedWalletId?: string;
  createdAt: Date;
}

// Card security settings
export interface CardSecuritySettings {
  contactlessEnabled: boolean;
  onlinePaymentsEnabled: boolean;
  internationalEnabled: boolean;
  dailyLimit: number;
  monthlyLimit: number;
  atmWithdrawalLimit: number;
}

interface CardsResponse {
  success: boolean;
  data: Card[];
}

interface CardResponse {
  success: boolean;
  data: Card;
}

interface CardSecurityResponse {
  success: boolean;
  data: CardSecuritySettings;
}

/**
 * Fetch all cards for the current user
 *
 * Usage:
 * ```tsx
 * const { data: cards, isLoading } = useCards();
 * ```
 */
export function useCards() {
  return useQuery({
    queryKey: queryKeys.cards.lists(),
    queryFn: async () => {
      const response = await apiGet<CardsResponse>('/api/cards');
      return response.data.map((card) => ({
        ...card,
        createdAt: new Date(card.createdAt),
      }));
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (cards change less frequently)
  });
}

/**
 * Fetch a single card by ID
 *
 * Usage:
 * ```tsx
 * const { data: card } = useCard('card-123');
 * ```
 */
export function useCard(cardId: string) {
  return useQuery({
    queryKey: queryKeys.cards.detail(cardId),
    queryFn: async () => {
      const response = await apiGet<CardResponse>(`/api/cards/${cardId}`);
      return {
        ...response.data,
        createdAt: new Date(response.data.createdAt),
      };
    },
    enabled: !!cardId,
  });
}

/**
 * Fetch card security settings
 *
 * Usage:
 * ```tsx
 * const { data: security } = useCardSecurity('card-123');
 * ```
 */
export function useCardSecurity(cardId: string) {
  return useQuery({
    queryKey: [...queryKeys.cards.detail(cardId), 'security'],
    queryFn: async () => {
      const response = await apiGet<CardSecurityResponse>(`/api/cards/${cardId}/security`);
      return response.data;
    },
    enabled: !!cardId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get the default card
 *
 * Usage:
 * ```tsx
 * const { data: defaultCard } = useDefaultCard();
 * ```
 */
export function useDefaultCard() {
  const { data: cards } = useCards();

  return useQuery({
    queryKey: [...queryKeys.cards.all, 'default'],
    queryFn: () => {
      if (!cards) return null;
      return cards.find((card) => card.isDefault) || cards[0] || null;
    },
    enabled: !!cards,
    staleTime: Infinity, // Derived from cards data
  });
}

/**
 * Add a new card
 *
 * Usage:
 * ```tsx
 * const addCard = useAddCard();
 * await addCard.mutateAsync({
 *   cardNumber: '4242',
 *   cardholderName: 'John Doe',
 *   expiryDate: '12/25',
 *   cardType: 'debit',
 *   network: 'visa',
 * });
 * ```
 */
export function useAddCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCard: Omit<Card, 'id' | 'createdAt' | 'isDefault' | 'isActive'>) => {
      const response = await apiPost<CardResponse>('/api/cards', newCard);
      return {
        ...response.data,
        createdAt: new Date(response.data.createdAt),
      };
    },
    onMutate: async (newCard) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cards.lists() });

      const previousCards = queryClient.getQueryData<Card[]>(queryKeys.cards.lists());

      // Optimistically add the card
      queryClient.setQueryData<Card[]>(queryKeys.cards.lists(), (old = []) => [
        ...old,
        {
          ...newCard,
          id: `temp-${Date.now()}`,
          createdAt: new Date(),
          isDefault: old.length === 0, // First card is default
          isActive: true,
        } as Card,
      ]);

      return { previousCards };
    },
    onError: (_err, _newCard, context) => {
      if (context?.previousCards) {
        queryClient.setQueryData(queryKeys.cards.lists(), context.previousCards);
      }
    },
    onSettled: () => {
      invalidateCache.cards();
    },
  });
}

/**
 * Update card settings
 *
 * Usage:
 * ```tsx
 * const updateCard = useUpdateCard();
 * await updateCard.mutateAsync({ id: 'card-123', updates: { isActive: false } });
 * ```
 */
export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Card> }) => {
      const response = await apiPut<CardResponse>(`/api/cards/${id}`, updates);
      return {
        ...response.data,
        createdAt: new Date(response.data.createdAt),
      };
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cards.detail(id) });

      const previousCard = queryClient.getQueryData<Card>(queryKeys.cards.detail(id));

      // Optimistic update
      queryClient.setQueryData<Card>(queryKeys.cards.detail(id), (old) =>
        old ? { ...old, ...updates } : old
      );

      // Also update in the list
      queryClient.setQueryData<Card[]>(queryKeys.cards.lists(), (old = []) =>
        old.map((card) => (card.id === id ? { ...card, ...updates } : card))
      );

      return { previousCard };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(queryKeys.cards.detail(id), context.previousCard);
      }
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.detail(id) });
      invalidateCache.cards();
    },
  });
}

/**
 * Update card security settings
 *
 * Usage:
 * ```tsx
 * const updateSecurity = useUpdateCardSecurity();
 * await updateSecurity.mutateAsync({
 *   cardId: 'card-123',
 *   settings: { contactlessEnabled: false }
 * });
 * ```
 */
export function useUpdateCardSecurity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cardId,
      settings,
    }: {
      cardId: string;
      settings: Partial<CardSecuritySettings>;
    }) => {
      const response = await apiPut<CardSecurityResponse>(`/api/cards/${cardId}/security`, settings);
      return response.data;
    },
    onMutate: async ({ cardId, settings }) => {
      const queryKey = [...queryKeys.cards.detail(cardId), 'security'];
      await queryClient.cancelQueries({ queryKey });

      const previousSettings = queryClient.getQueryData<CardSecuritySettings>(queryKey);

      // Optimistic update
      queryClient.setQueryData<CardSecuritySettings>(queryKey, (old) =>
        old ? { ...old, ...settings } : old
      );

      return { previousSettings, queryKey };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousSettings && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousSettings);
      }
    },
    onSettled: (_data, _error, { cardId }) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.cards.detail(cardId), 'security'] });
    },
  });
}

/**
 * Set a card as the default
 *
 * Usage:
 * ```tsx
 * const setDefault = useSetDefaultCard();
 * await setDefault.mutateAsync('card-123');
 * ```
 */
export function useSetDefaultCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId: string) => {
      const response = await apiPut<CardResponse>(`/api/cards/${cardId}/set-default`, {});
      return response.data;
    },
    onMutate: async (cardId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cards.lists() });

      const previousCards = queryClient.getQueryData<Card[]>(queryKeys.cards.lists());

      // Optimistically update all cards
      queryClient.setQueryData<Card[]>(queryKeys.cards.lists(), (old = []) =>
        old.map((card) => ({
          ...card,
          isDefault: card.id === cardId,
        }))
      );

      return { previousCards };
    },
    onError: (_err, _cardId, context) => {
      if (context?.previousCards) {
        queryClient.setQueryData(queryKeys.cards.lists(), context.previousCards);
      }
    },
    onSettled: () => {
      invalidateCache.cards();
    },
  });
}

/**
 * Delete/remove a card
 *
 * Usage:
 * ```tsx
 * const removeCard = useRemoveCard();
 * await removeCard.mutateAsync('card-123');
 * ```
 */
export function useRemoveCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId: string) => {
      await apiDelete(`/api/cards/${cardId}`);
      return cardId;
    },
    onMutate: async (cardId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cards.lists() });

      const previousCards = queryClient.getQueryData<Card[]>(queryKeys.cards.lists());

      // Optimistically remove
      queryClient.setQueryData<Card[]>(queryKeys.cards.lists(), (old = []) =>
        old.filter((card) => card.id !== cardId)
      );

      return { previousCards };
    },
    onError: (_err, _cardId, context) => {
      if (context?.previousCards) {
        queryClient.setQueryData(queryKeys.cards.lists(), context.previousCards);
      }
    },
    onSettled: () => {
      invalidateCache.cards();
    },
  });
}

/**
 * Toggle card active status (freeze/unfreeze)
 *
 * Usage:
 * ```tsx
 * const toggleStatus = useToggleCardStatus();
 * toggleStatus.mutate('card-123'); // Toggles current state
 * ```
 */
export function useToggleCardStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId: string) => {
      const card = queryClient.getQueryData<Card>(queryKeys.cards.detail(cardId));
      const newStatus = !card?.isActive;

      const response = await apiPut<CardResponse>(`/api/cards/${cardId}`, {
        isActive: newStatus,
      });
      return response.data;
    },
    onMutate: async (cardId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cards.detail(cardId) });

      const previousCard = queryClient.getQueryData<Card>(queryKeys.cards.detail(cardId));

      // Optimistic toggle
      queryClient.setQueryData<Card>(queryKeys.cards.detail(cardId), (old) =>
        old ? { ...old, isActive: !old.isActive } : old
      );

      // Also update in the list
      queryClient.setQueryData<Card[]>(queryKeys.cards.lists(), (old = []) =>
        old.map((card) => (card.id === cardId ? { ...card, isActive: !card.isActive } : card))
      );

      return { previousCard };
    },
    onError: (_err, cardId, context) => {
      if (context?.previousCard) {
        queryClient.setQueryData(queryKeys.cards.detail(cardId), context.previousCard);
      }
    },
    onSettled: () => {
      invalidateCache.cards();
    },
  });
}
