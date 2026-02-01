/**
 * Contacts Context
 *
 * Location: contexts/ContactsContext.tsx
 * Purpose: Global state management for contacts and favorites
 *
 * Provides:
 * - Contacts list with search
 * - Favorites management
 * - Recent contacts
 * - Add/remove favorites
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getFavorites, addFavorite, removeFavorite, toggleFavorite as toggleFavoriteUtil, isFavorite as isFavoriteUtil, FavoriteContact } from '@/utils/favorites';
import logger, { log } from '@/utils/logger';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  isFavorite?: boolean;
}

interface ContactsContextType {
  contacts: Contact[];
  favorites: FavoriteContact[];
  recentContacts: Contact[];
  loading: boolean;
  error: string | null;

  // Methods
  fetchContacts: (searchQuery?: string) => Promise<void>;
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (contact: Contact) => Promise<void>;
  isFavorite: (contactId: string) => boolean;
  refreshAll: () => Promise<void>;
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

// Fetch contacts from API
const fetchContactsFromAPI = async (searchQuery?: string): Promise<Contact[]> => {
  try {
    const { apiGet } = await import('@/utils/apiClient');
    const queryParam = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
    const response = await apiGet<Array<{
      id: string;
      name: string;
      phone: string;
      email?: string;
      is_favorite?: boolean;
    }>>(`/contacts${queryParam}`);

    return response.map((contact) => ({
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      isFavorite: contact.is_favorite || false,
    }));
  } catch (error) {
    log.error('Error fetching contacts from API:', error);
    return [];
  }
};

interface ContactsProviderProps {
  children: ReactNode;
}

export function ContactsProvider({ children }: ContactsProviderProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [favorites, setFavorites] = useState<FavoriteContact[]>([]);
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async (searchQuery?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchContactsFromAPI(searchQuery);
      setContacts(data);

      // Update recent contacts (first 5)
      setRecentContacts(data.slice(0, 5));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contacts');
      log.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    try {
      const favs = await getFavorites();
      setFavorites(favs);
    } catch (err) {
      log.error('Error fetching favorites:', err);
    }
  }, []);

  const toggleFavorite = useCallback(async (contact: Contact) => {
    try {
      // Update local favorites storage
      await toggleFavoriteUtil({
        id: contact.id,
        name: contact.name,
        phoneNumber: contact.phone,
      });

      // Update favorites list
      await fetchFavorites();

      // Update contacts list to reflect favorite status
      setContacts(prev => prev.map(c =>
        c.id === contact.id ? { ...c, isFavorite: !c.isFavorite } : c
      ));

      // Optionally sync with API (if you have an endpoint)
      try {
        const { apiPost } = await import('@/utils/apiClient');
        await apiPost('/contacts/toggle-favorite', {
          contactId: contact.id,
          isFavorite: !contact.isFavorite,
        });
      } catch (apiError) {
        // API sync failed but local storage updated
        logger.warn('Failed to sync favorite to API:', { apiError });
      }
    } catch (err) {
      log.error('Error toggling favorite:', err);
      throw err;
    }
  }, [fetchFavorites]);

  const isFavorite = useCallback((contactId: string) => {
    return favorites.some(f => f.id === contactId);
  }, [favorites]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchContacts(),
      fetchFavorites(),
    ]);
  }, [fetchContacts, fetchFavorites]);

  const value: ContactsContextType = {
    contacts,
    favorites,
    recentContacts,
    loading,
    error,
    fetchContacts,
    fetchFavorites,
    toggleFavorite,
    isFavorite,
    refreshAll,
  };

  return (
    <ContactsContext.Provider value={value}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts(): ContactsContextType {
  const context = useContext(ContactsContext);
  if (context === undefined) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
}
