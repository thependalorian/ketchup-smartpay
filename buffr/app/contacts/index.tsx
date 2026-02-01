/**
 * Contact List Screen
 * 
 * Location: app/contacts/index.tsx
 * Purpose: View and manage contacts, send money, request money
 * 
 * Features:
 * - Search contacts
 * - Contact list with actions
 * - Send money to contact
 * - Request money from contact
 * - Add contact option
 * - Glass effect components
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
import { ScreenHeader, ContactListItem, type ContactListItemData, GlassCard } from '@/components/common';
import { fetchDeviceContacts, requestContactsPermission, type DeviceContact } from '@/utils/contacts';
import Layout from '@/constants/Layout';
import { log } from '@/utils/logger';

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  avatar?: string;
}

export default function ContactsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceContacts, setDeviceContacts] = useState<DeviceContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactsPermissionGranted, setContactsPermissionGranted] = useState(false);
  const [apiContacts, setApiContacts] = useState<Contact[]>([]);
  const [loadingApiContacts, setLoadingApiContacts] = useState(false);

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

  // Load contacts from API
  useEffect(() => {
    const loadApiContacts = async () => {
      setLoadingApiContacts(true);
      try {
        const { apiGet } = await import('@/utils/apiClient');
        const contacts = await apiGet<Contact[]>('/contacts');
        setApiContacts(contacts);
      } catch (error) {
        log.error('Error loading contacts from API:', error);
        // Fallback to mock contacts on error
      } finally {
        setLoadingApiContacts(false);
      }
    };
    loadApiContacts();
  }, []);

  // Merge and filter contacts - API contacts + device contacts, no mock data
  const allContacts = useMemo(() => {
    const combined: Contact[] = [...apiContacts];
    
    // Add device contacts that don't exist in API contacts
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

    // Filter by search query
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

  // Convert to list format
  const contactListItems: ContactListItemData[] = allContacts.map((contact) => ({
    id: contact.id,
    name: contact.name,
    phoneNumber: contact.phoneNumber,
    avatar: contact.avatar,
  }));

  const handleSendMoney = (contactId: string) => {
    const contact = allContacts.find((c) => c.id === contactId);
    if (contact) {
      router.push({
        pathname: '/send-money/select-recipient',
        params: {
          contactId: contact.id,
          contactName: contact.name,
          contactPhone: contact.phoneNumber,
        },
      });
    }
  };

  const handleRequestMoney = (contactId: string) => {
    const contact = allContacts.find((c) => c.id === contactId);
    if (contact) {
      router.push({
        pathname: '/request-money/select-recipient',
        params: {
          contactId: contact.id,
          contactName: contact.name,
          contactPhone: contact.phoneNumber,
        },
      });
    }
  };

  const handleContactPress = (contactId: string) => {
    // Show action sheet: Send Money or Request Money
    const contact = allContacts.find((c) => c.id === contactId);
    if (!contact) return;

    Alert.alert(
      contact.name,
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Money',
          onPress: () => handleSendMoney(contactId),
        },
        {
          text: 'Request Money',
          onPress: () => handleRequestMoney(contactId),
        },
      ]
    );
  };

  const handleAddContact = () => {
    // Navigate to add contact screen
    router.push('/contacts/add');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader title="Contacts" showBackButton onBack={handleBack} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar - Glass Card */}
        <GlassCard style={styles.searchCard} padding={12} borderRadius={12}>
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

        {/* Add Contact Button */}
        <TouchableOpacity
          style={styles.addContactButton}
          onPress={handleAddContact}
        >
          <FontAwesome name="user-plus" size={18} color={Colors.primary} />
          <Text style={styles.addContactText}>Add Contact</Text>
        </TouchableOpacity>

        {/* Contacts List */}
        {contactListItems.length > 0 && (
          <GlassCard style={styles.contactsCard} padding={0} borderRadius={16}>
            {contactListItems.map((contact) => (
              <ContactListItem
                key={contact.id}
                contact={contact}
                onPress={() => handleContactPress(contact.id)}
                showActions={true}
                actions={[
                  {
                    icon: 'paper-plane',
                    label: 'Send',
                    onPress: () => handleSendMoney(contact.id),
                    color: Colors.primary,
                  },
                  {
                    icon: 'hand-paper-o',
                    label: 'Request',
                    onPress: () => handleRequestMoney(contact.id),
                    color: Colors.info,
                  },
                ]}
              />
            ))}
          </GlassCard>
        )}

        {/* Loading State */}
        {(loadingContacts || loadingApiContacts) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading contacts...</Text>
          </View>
        )}

        {/* Empty State */}
        {!loadingContacts && !loadingApiContacts && allContacts.length === 0 && (
          <View style={styles.emptyContainer}>
            <FontAwesome name="users" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No contacts found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search term' : 'Add contacts to get started'}
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
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: Layout.SECTION_SPACING,
  },
  addContactText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
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
