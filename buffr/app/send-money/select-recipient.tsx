/**
 * Select Recipient Screen - Step 1 of Send Money Flow
 * 
 * Location: app/send-money/select-recipient.tsx
 * Purpose: Select recipient for sending money
 * 
 * Based on actual design: Send To screen with Recents, Favorites, and Contacts
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { HORIZONTAL_PADDING, SECTION_SPACING } from '@/constants/Layout';
import { defaultStyles } from '@/constants/Styles';
import { ScreenHeader, ContactCarousel, ContactListItem, EmptyState, GlassCard, type ContactCarouselItem, type ContactListItemData } from '@/components/common';
import { fetchDeviceContacts, requestContactsPermission, type DeviceContact } from '@/utils/contacts';
import logger, { log } from '@/utils/logger';
import { useContacts } from '@/contexts/ContactsContext';

// Contact interface
interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  avatar?: string;
  isRecent?: boolean;
  isFavorite?: boolean;
}

export default function SelectRecipientScreen() {
  const router = useRouter();
  const { contacts: apiContacts, favorites, fetchContacts, loading: loadingApiContacts } = useContacts();
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceContacts, setDeviceContacts] = useState<DeviceContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactsPermissionGranted, setContactsPermissionGranted] = useState(false);

  // Load API contacts on mount and when search changes
  useEffect(() => {
    fetchContacts(searchQuery);
  }, [fetchContacts, searchQuery]);

  // Load device contacts on mount
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
        Alert.alert(
          'Permission Required',
          'Please grant contacts permission to access your phone contacts.',
          [{ text: 'OK' }]
        );
      } finally {
        setLoadingContacts(false);
      }
    };

    loadDeviceContacts();
  }, []);

  // Merge API contacts, favorites, and device contacts (no mock data)
  const allAvailableContacts = useMemo(() => {
    const combined: Contact[] = [];
    
    // Add API contacts (from ContactsContext)
    apiContacts.forEach((apiContact) => {
      combined.push({
        id: apiContact.id,
        name: apiContact.name,
        phoneNumber: apiContact.phone || '',
        avatar: apiContact.avatar,
        isRecent: false, // Could be enhanced with recent transactions
        isFavorite: apiContact.isFavorite || false,
      });
    });
    
    // Add favorites from context
    favorites.forEach((favorite) => {
      if (!combined.find(c => c.id === favorite.id)) {
        combined.push({
          id: favorite.id,
          name: favorite.name,
          phoneNumber: favorite.phoneNumber || '',
          avatar: favorite.avatar,
          isRecent: false,
          isFavorite: true,
        });
      }
    });
    
    // Add device contacts that aren't already in API contacts
    deviceContacts.forEach((deviceContact) => {
      // Check if contact already exists (by phone number)
      const exists = combined.some(
        (c) => c.phoneNumber === deviceContact.phoneNumber
      );
      
      if (!exists && deviceContact.phoneNumber) {
        combined.push({
          id: `device-${deviceContact.id}`,
          name: deviceContact.name,
          phoneNumber: deviceContact.phoneNumber,
          avatar: deviceContact.avatar,
          isRecent: false,
          isFavorite: false,
        });
      }
    });
    
    return combined;
  }, [apiContacts, favorites, deviceContacts]);

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) {
      return allAvailableContacts;
    }
    const query = searchQuery.toLowerCase();
    return allAvailableContacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.phoneNumber.includes(query)
    );
  }, [searchQuery, allAvailableContacts]);

  // Separate contacts by category
  const recentRecipients = filteredContacts.filter((c) => c.isRecent);
  const favoriteContacts = filteredContacts.filter((c) => c.isFavorite);
  const allContacts = filteredContacts.filter((c) => !c.isRecent && !c.isFavorite);

  const handleRecipientSelect = (contact: Contact) => {
    logger.info('Selected contact:', { name: contact.name });
    // Navigate to receiver details screen
    router.push({
      pathname: '/send-money/receiver-details',
      params: {
        contactId: contact.id,
        contactName: contact.name,
        contactPhone: contact.phoneNumber || '',
      },
    } as any);
  };

  const handleAddContact = () => {
    // Navigate to add contact or manual entry
    logger.info('Add contact pressed');
  };

  const handleQRScan = () => {
    router.push('/send-money/qr-scanner');
  };

  const handleManualEntry = () => {
    // Navigate to manual phone entry (to be implemented)
    logger.info('Manual entry pressed');
  };

  // Convert contacts to carousel format
  const recentCarouselItems: ContactCarouselItem[] = recentRecipients.map((c) => ({
    id: c.id,
    name: c.name,
    phoneNumber: c.phoneNumber,
    avatar: c.avatar,
    isGroup: c.name === 'Group of 5',
    groupCount: c.name === 'Group of 5' ? 2 : undefined, // +2 overlay as shown in design
  }));

  const favoriteCarouselItems: ContactCarouselItem[] = favoriteContacts.map((c) => ({
    id: c.id,
    name: c.name,
    phoneNumber: c.phoneNumber,
    avatar: c.avatar,
  }));

  // Convert contacts to list item format
  const contactListItems: ContactListItemData[] = allContacts.map((c) => ({
    id: c.id,
    name: c.name,
    phoneNumber: c.phoneNumber,
    avatar: c.avatar,
  }));

  return (
    <View style={defaultStyles.containerFull}>
      <ScreenHeader
        title="Send To"
        showBackButton
        onBack={() => router.back()}
        rightAction={
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddContact}
            activeOpacity={0.7}
          >
            <FontAwesome name="user-plus" size={20} color={Colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <GlassCard style={styles.searchCard} padding={12} borderRadius={16}>
          <View style={styles.searchContainer}>
            <FontAwesome
              name="search"
              size={18}
              color={Colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search via Phone, UPI, UID etc."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </GlassCard>

        {/* Recent Recipients Carousel */}
        {recentRecipients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recents</Text>
            <ContactCarousel
              contacts={recentCarouselItems}
              onContactPress={(contact) => {
                logger.info('Carousel contact pressed:', { name: contact.name });
                const fullContact = allAvailableContacts.find((c) => c.id === contact.id);
                if (fullContact) {
                  logger.info('Found full contact, navigating...');
                  handleRecipientSelect(fullContact);
                } else {
                  logger.info('Full contact not found for:', { id: contact.id });
                }
              }}
              avatarSize={60}
            />
          </View>
        )}

        {/* Favorites Carousel */}
        {favoriteContacts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Favorites</Text>
            <ContactCarousel
              contacts={favoriteCarouselItems}
              onContactPress={(contact) => {
                logger.info('Favorite contact pressed:', { name: contact.name });
                const fullContact = allAvailableContacts.find((c) => c.id === contact.id);
                if (fullContact) {
                  logger.info('Found full contact, navigating...');
                  handleRecipientSelect(fullContact);
                } else {
                  logger.info('Full contact not found for:', { id: contact.id });
                }
              }}
              avatarSize={60}
            />
          </View>
        )}

        {/* Contacts List */}
        {(loadingContacts || loadingApiContacts) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading contacts...</Text>
          </View>
        ) : allContacts.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contacts</Text>
            <View style={styles.contactsList}>
              {contactListItems.map((contact) => (
                <ContactListItem
                  key={contact.id}
                  contact={contact}
                  onPress={(c) => {
                    logger.info('List contact pressed:', { name: c.name });
                    const fullContact = allAvailableContacts.find((mc) => mc.id === c.id);
                    if (fullContact) {
                      logger.info('Found full contact, navigating...');
                      handleRecipientSelect(fullContact);
                    } else {
                      logger.info('Full contact not found for:', { id: c.id });
                    }
                  }}
                  avatarSize={40}
                  showPhoneNumber={true}
                />
              ))}
            </View>
          </View>
        ) : !contactsPermissionGranted ? (
          <View style={styles.permissionContainer}>
            <FontAwesome name="address-book" size={48} color={Colors.textSecondary} />
            <Text style={styles.permissionText}>
              Grant contacts permission to see your phone contacts
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={async () => {
                const granted = await requestContactsPermission();
                if (granted) {
                  setContactsPermissionGranted(true);
                  const contacts = await fetchDeviceContacts();
                  setDeviceContacts(contacts);
                } else {
                  Alert.alert(
                    'Permission Denied',
                    'Please enable contacts permission in your device settings.',
                    [{ text: 'OK' }]
                  );
                }
              }}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Empty State */}
        {filteredContacts.length === 0 && (
          <EmptyState
            icon="search"
            iconSize={48}
            iconColor={Colors.textSecondary}
            title="No contacts found"
            message={searchQuery ? 'Try a different search term' : 'Add contacts to get started'}
          />
        )}

        {/* Manual Entry Button */}
        <TouchableOpacity
          onPress={handleManualEntry}
          activeOpacity={0.7}
        >
          <GlassCard style={styles.manualEntryButton} padding={16} borderRadius={16}>
            <Text style={styles.manualEntryText}>Enter Phone Number Manually</Text>
          </GlassCard>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: HORIZONTAL_PADDING,
    paddingBottom: 40,
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchCard: {
    marginBottom: SECTION_SPACING,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  section: {
    marginBottom: SECTION_SPACING,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  contactsList: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  manualEntryButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  manualEntryText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  permissionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  permissionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: SECTION_SPACING,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
