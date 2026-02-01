/**
 * Request Money - Select Recipient Screen (Step 1)
 * 
 * Location: app/request-money/select-recipient.tsx
 * Purpose: Select recipient for requesting money
 * 
 * Features:
 * - Search contacts
 * - Recent contacts carousel
 * - Favorites section
 * - All contacts list
 * - Glass effect cards
 * - Real estate planning with distinct sections
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import defaultStyles from '@/constants/Styles';
import { ScreenHeader, ContactCarousel, ContactListItem, type ContactCarouselItem, type ContactListItemData, GlassCard } from '@/components/common';
import { fetchDeviceContacts, requestContactsPermission, type DeviceContact } from '@/utils/contacts';
import Layout from '@/constants/Layout';
import { log } from '@/utils/logger';

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  avatar?: string;
  isRecent?: boolean;
  isFavorite?: boolean;
}

export default function RequestMoneySelectRecipientScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceContacts, setDeviceContacts] = useState<DeviceContact[]>([]);
  const [apiContacts, setApiContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactsPermissionGranted, setContactsPermissionGranted] = useState(false);

  // Load contacts from API
  useEffect(() => {
    const loadApiContacts = async () => {
      try {
        const { apiGet } = await import('@/utils/apiClient');
        const contacts = await apiGet<{
          id: string;
          name: string;
          phone_number: string;
          avatar_url?: string;
          is_recent?: boolean;
          is_favorite?: boolean;
        }[]>('/contacts');
        setApiContacts(contacts.map((c) => ({
          id: c.id,
          name: c.name,
          phoneNumber: c.phone_number,
          avatar: c.avatar_url,
          isRecent: c.is_recent || false,
          isFavorite: c.is_favorite || false,
        })));
      } catch (error) {
        log.error('Error loading contacts from API:', error);
      }
    };
    loadApiContacts();
  }, []);

  // Load device contacts
  useEffect(() => {
    const loadDeviceContacts = async () => {
      try {
        setLoadingContacts(true);
        const hasPermission = await requestContactsPermission();
        setContactsPermissionGranted(hasPermission);
        
        if (hasPermission) {
          const contacts = await fetchDeviceContacts();
          setDeviceContacts(contacts);
        }
      } catch (error) {
        log.error('Error loading contacts:', error);
      } finally {
        setLoadingContacts(false);
      }
    };

    loadDeviceContacts();
  }, []);

  // Merge and filter contacts - API + device contacts, no mock data
  const allContacts = useMemo(() => {
    const combined: Contact[] = [...apiContacts];
    
    deviceContacts.forEach((deviceContact) => {
      const exists = combined.some(
        (c) =>
          c.phoneNumber === deviceContact.phoneNumber ||
          c.name.toLowerCase() === deviceContact.name.toLowerCase()
      );
      if (!exists && deviceContact.phoneNumber) {
        combined.push({
          id: `device-${deviceContact.id}`,
          name: deviceContact.name,
          phoneNumber: deviceContact.phoneNumber,
          avatar: deviceContact.avatar,
        });
      }
    });

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return combined.filter(
        (contact) =>
          contact.name.toLowerCase().includes(query) ||
          contact.phoneNumber.includes(query)
      );
    }

    return combined;
  }, [apiContacts, deviceContacts, searchQuery]);

  // Separate contacts by category
  const recentContacts = useMemo(() => allContacts.filter((c) => c.isRecent), [allContacts]);
  const favoriteContacts = useMemo(() => allContacts.filter((c) => c.isFavorite), [allContacts]);
  const otherContacts = useMemo(
    () => allContacts.filter((c) => !c.isRecent && !c.isFavorite),
    [allContacts]
  );

  // Convert to carousel format
  const recentCarouselItems: ContactCarouselItem[] = recentContacts.map((contact) => ({
    id: contact.id,
    name: contact.name,
    phoneNumber: contact.phoneNumber,
    avatar: contact.avatar,
  }));

  // Convert to list format
  const favoriteListItems: ContactListItemData[] = favoriteContacts.map((contact) => ({
    id: contact.id,
    name: contact.name,
    phoneNumber: contact.phoneNumber,
    avatar: contact.avatar,
  }));

  const otherListItems: ContactListItemData[] = otherContacts.map((contact) => ({
    id: contact.id,
    name: contact.name,
    phoneNumber: contact.phoneNumber,
    avatar: contact.avatar,
  }));

  const handleContactSelect = (contactId: string) => {
    const contact = allContacts.find((c) => c.id === contactId);
    if (contact) {
      router.push({
        pathname: '/request-money/enter-amount',
        params: {
          contactId: contact.id,
          contactName: contact.name,
          contactPhone: contact.phoneNumber,
        },
      });
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader title="Request Money" showBackButton onBack={handleBack} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar - Glass Card */}
        <GlassCard style={styles.searchCard} padding={12} borderRadius={16}>
          <View style={styles.searchContainer}>
            <FontAwesome name="search" size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
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

        {/* Recent Contacts Section */}
        {recentContacts.length > 0 && !searchQuery && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <ContactCarousel
              contacts={recentCarouselItems}
              onContactPress={(contact) => handleContactSelect(contact.id)}
            />
          </View>
        )}

        {/* Favorites Section */}
        {favoriteContacts.length > 0 && !searchQuery && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Favorites</Text>
            <GlassCard style={styles.favoritesCard} padding={0} borderRadius={16}>
              {favoriteListItems.map((contact) => (
                <ContactListItem
                  key={contact.id}
                  contact={contact}
                  onPress={() => handleContactSelect(contact.id)}
                />
              ))}
            </GlassCard>
          </View>
        )}

        {/* All Contacts Section */}
        {otherListItems.length > 0 && (
          <View style={styles.section}>
            {!searchQuery && <Text style={styles.sectionTitle}>All Contacts</Text>}
            <GlassCard style={styles.contactsCard} padding={0} borderRadius={16}>
              {otherListItems.map((contact) => (
                <ContactListItem
                  key={contact.id}
                  contact={contact}
                  onPress={() => handleContactSelect(contact.id)}
                />
              ))}
            </GlassCard>
          </View>
        )}

        {/* Loading State */}
        {(loadingContacts || loadingContacts) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading contacts...</Text>
          </View>
        )}

        {/* Empty State */}
        {!loadingContacts && !loadingContacts && allContacts.length === 0 && (
          <View style={styles.emptyContainer}>
            <FontAwesome name="users" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No contacts found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search term' : 'Add contacts to request money'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
    paddingTop: Layout.SECTION_SPACING,
    paddingBottom: Layout.LARGE_SECTION_SPACING,
  },
  searchCard: {
    marginBottom: Layout.SECTION_SPACING,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  section: {
    marginBottom: Layout.LARGE_SECTION_SPACING,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  favoritesCard: {
    marginTop: 8,
  },
  contactsCard: {
    marginTop: 8,
  },
  loadingContainer: {
    paddingVertical: Layout.LARGE_SECTION_SPACING,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: Layout.LARGE_SECTION_SPACING * 2,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
