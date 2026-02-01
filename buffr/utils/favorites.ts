/**
 * Favorites Utility
 * 
 * Location: utils/favorites.ts
 * Purpose: Manage favorite contacts/recipients
 * 
 * Features:
 * - Save favorite contacts
 * - Remove favorites
 * - Get favorites list
 * - Check if contact is favorite
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from '@/utils/logger';

const FAVORITES_KEY = '@buffr_favorites';

export interface FavoriteContact {
  id: string;
  name: string;
  phoneNumber: string;
  contactId?: string;
  addedAt: Date;
}

/**
 * Get all favorite contacts
 */
export async function getFavorites(): Promise<FavoriteContact[]> {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    if (data) {
      const favorites = JSON.parse(data);
      return favorites.map((f: any) => ({
        ...f,
        addedAt: new Date(f.addedAt),
      }));
    }
    return [];
  } catch (error) {
    log.error('Error getting favorites:', error);
    return [];
  }
}

/**
 * Add contact to favorites
 */
export async function addFavorite(contact: Omit<FavoriteContact, 'addedAt'>): Promise<void> {
  try {
    const favorites = await getFavorites();
    
    // Check if already favorite
    if (favorites.some(f => f.id === contact.id || f.phoneNumber === contact.phoneNumber)) {
      return; // Already favorite
    }
    
    const newFavorite: FavoriteContact = {
      ...contact,
      addedAt: new Date(),
    };
    
    favorites.push(newFavorite);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    log.error('Error adding favorite:', error);
    throw error;
  }
}

/**
 * Remove contact from favorites
 */
export async function removeFavorite(contactId: string): Promise<void> {
  try {
    const favorites = await getFavorites();
    const filtered = favorites.filter(f => f.id !== contactId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
  } catch (error) {
    log.error('Error removing favorite:', error);
    throw error;
  }
}

/**
 * Check if contact is favorite
 */
export async function isFavorite(contactId: string): Promise<boolean> {
  try {
    const favorites = await getFavorites();
    return favorites.some(f => f.id === contactId);
  } catch (error) {
    log.error('Error checking favorite:', error);
    return false;
  }
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(
  contact: Omit<FavoriteContact, 'addedAt'>
): Promise<boolean> {
  try {
    const isFav = await isFavorite(contact.id);
    if (isFav) {
      await removeFavorite(contact.id);
      return false;
    } else {
      await addFavorite(contact);
      return true;
    }
  } catch (error) {
    log.error('Error toggling favorite:', error);
    throw error;
  }
}
