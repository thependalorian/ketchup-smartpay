/**
 * Group Add Member Screen
 * 
 * Location: app/groups/[id]/add-member.tsx
 * Purpose: Add new members to a group
 * 
 * Features:
 * - Search contacts
 * - Select from favorites/recents
 * - Add by phone number
 * - Send invitation
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import defaultStyles from '@/constants/Styles';
import { ScreenHeader, GlassCard, PillButton, ProfileAvatar, ContactListItem, ContactListItemData } from '@/components/common';
import Layout from '@/constants/Layout';
import { fetchDeviceContacts, requestContactsPermission, DeviceContact } from '@/utils/contacts';
import { log } from '@/utils/logger';

interface Group {
  id: string;
  name: string;
  members: { id: string; name: string }[];
}

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  avatar?: string;
}

export default function GroupAddMemberScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Load group data
  useEffect(() => {
    const loadGroup = async () => {
      setLoading(true);
      try {
        const { apiGet } = await import('@/utils/apiClient');
        const data = await apiGet<Group>(`/groups/${params.id}`);
        setGroup(data);
      } catch (error) {
        log.error('Error loading group:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadGroup();
    }
  }, [params.id]);

  // Load contacts
  useEffect(() => {
    const loadContacts = async () => {
      try {
        // Load from API
        const { apiGet } = await import('@/utils/apiClient');
        const apiContacts = await apiGet<Contact[]>('/contacts');
        
        // Load device contacts
        const hasPermission = await requestContactsPermission();
        let deviceContacts: DeviceContact[] = [];
        if (hasPermission) {
          deviceContacts = await fetchDeviceContacts();
        }

        // Merge contacts
        const merged = [...apiContacts];
        deviceContacts.forEach((dc) => {
          const exists = merged.some(
            (c) => c.phoneNumber === dc.phoneNumber
          );
          if (!exists && dc.phoneNumber) {
            merged.push({
              id: `device-${dc.id}`,
              name: dc.name,
              phoneNumber: dc.phoneNumber,
              avatar: dc.avatar,
            });
          }
        });

        setContacts(merged);
      } catch (error) {
        log.error('Error loading contacts:', error);
      }
    };

    loadContacts();
  }, []);

  const handleBack = () => {
    router.back();
  };

  // Filter contacts based on search and exclude existing members
  const filteredContacts = useMemo(() => {
    const existingMemberIds = group?.members.map((m) => m.id) || [];
    
    return contacts.filter((contact) => {
      // Exclude existing members
      if (existingMemberIds.includes(contact.id)) return false;
      
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          contact.name.toLowerCase().includes(query) ||
          contact.phoneNumber.includes(query)
        );
      }
      return true;
    });
  }, [contacts, group, searchQuery]);

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleAddByPhone = () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Enter Phone Number', 'Please enter a valid phone number');
      return;
    }

    // Check if phone already in selected
    const existingContact = contacts.find((c) => c.phoneNumber === phoneNumber);
    if (existingContact) {
      if (!selectedContacts.includes(existingContact.id)) {
        setSelectedContacts([...selectedContacts, existingContact.id]);
      }
    } else {
      // Add as new contact
      const newContact: Contact = {
        id: `phone-${Date.now()}`,
        name: phoneNumber,
        phoneNumber: phoneNumber,
      };
      setContacts([newContact, ...contacts]);
      setSelectedContacts([...selectedContacts, newContact.id]);
    }
    setPhoneNumber('');
  };

  const handleAddMembers = async () => {
    if (selectedContacts.length === 0) {
      Alert.alert('Select Members', 'Please select at least one contact to add');
      return;
    }

    setSubmitting(true);
    try {
      const { apiPost } = await import('@/utils/apiClient');
      
      // Get selected contact details
      const membersToAdd = selectedContacts.map((id) => {
        const contact = contacts.find((c) => c.id === id);
        return {
          contactId: id,
          name: contact?.name || '',
          phoneNumber: contact?.phoneNumber || '',
        };
      });

      await apiPost(`/groups/${params.id}/members`, {
        members: membersToAdd,
      });

      Alert.alert(
        'Members Added',
        `${selectedContacts.length} member(s) have been invited to ${group?.name}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      log.error('Add members error:', error);
      Alert.alert('Error', error.message || 'Failed to add members');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={defaultStyles.container}>
        <ScreenHeader title="Add Members" showBackButton onBack={handleBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  const contactListItems: ContactListItemData[] = filteredContacts.map((c) => ({
    id: c.id,
    name: c.name,
    phoneNumber: c.phoneNumber,
    avatar: c.avatar,
  }));

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader 
        title="Add Members" 
        showBackButton 
        onBack={handleBack}
        subtitle={group?.name}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Bar */}
        <GlassCard style={styles.searchCard} padding={12} borderRadius={12}>
          <View style={styles.searchContainer}>
            <FontAwesome name="search" size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search contacts..."
              placeholderTextColor={Colors.textSecondary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <FontAwesome name="times-circle" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </GlassCard>

        {/* Add by Phone Number */}
        <GlassCard style={styles.phoneCard} padding={16} borderRadius={16}>
          <Text style={styles.sectionTitle}>Add by Phone Number</Text>
          <View style={styles.phoneInputContainer}>
            <TextInput
              style={styles.phoneInput}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="+264 81 123 4567"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="phone-pad"
            />
            <TouchableOpacity
              style={styles.addPhoneButton}
              onPress={handleAddByPhone}
              disabled={!phoneNumber.trim()}
            >
              <FontAwesome name="plus" size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Selected Members */}
        {selectedContacts.length > 0 && (
          <GlassCard style={styles.selectedCard} padding={16} borderRadius={16}>
            <Text style={styles.sectionTitle}>
              Selected ({selectedContacts.length})
            </Text>
            <View style={styles.selectedList}>
              {selectedContacts.map((id) => {
                const contact = contacts.find((c) => c.id === id);
                if (!contact) return null;
                return (
                  <TouchableOpacity
                    key={id}
                    style={styles.selectedChip}
                    onPress={() => toggleContactSelection(id)}
                  >
                    <ProfileAvatar size={24} imageUri={contact.avatar} name={contact.name} />
                    <Text style={styles.selectedName} numberOfLines={1}>
                      {contact.name}
                    </Text>
                    <FontAwesome name="times" size={12} color={Colors.textSecondary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>
        )}

        {/* Contacts List */}
        <GlassCard style={styles.contactsCard} padding={0} borderRadius={16}>
          <View style={styles.contactsHeader}>
            <Text style={styles.sectionTitle}>Contacts</Text>
            <Text style={styles.contactsCount}>{filteredContacts.length}</Text>
          </View>
          
          {filteredContacts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome name="users" size={32} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No contacts found</Text>
            </View>
          ) : (
            filteredContacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={[
                  styles.contactItem,
                  selectedContacts.includes(contact.id) && styles.contactItemSelected,
                ]}
                onPress={() => toggleContactSelection(contact.id)}
              >
                <ProfileAvatar size={44} imageUri={contact.avatar} name={contact.name} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
                </View>
                <View style={[
                  styles.checkbox,
                  selectedContacts.includes(contact.id) && styles.checkboxSelected,
                ]}>
                  {selectedContacts.includes(contact.id) && (
                    <FontAwesome name="check" size={12} color={Colors.white} />
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </GlassCard>
      </ScrollView>

      {/* Add Button */}
      <View style={styles.footer}>
        <PillButton
          label={submitting ? 'Adding...' : `Add ${selectedContacts.length} Member${selectedContacts.length !== 1 ? 's' : ''}`}
          variant="primary"
          onPress={handleAddMembers}
          disabled={submitting || selectedContacts.length === 0}
        />
      </View>
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
    paddingBottom: 100,
    gap: Layout.SECTION_SPACING,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchCard: {},
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.CARD_GAP,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  phoneCard: {},
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.CARD_GAP,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.slate100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addPhoneButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCard: {},
  selectedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.slate100,
    paddingVertical: 6,
    paddingHorizontal: 12,
    paddingRight: 10,
    borderRadius: 20,
    maxWidth: '48%',
  },
  selectedName: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  contactsCard: {},
  contactsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  contactsCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: Layout.CARD_GAP,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.CARD_GAP,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  contactItemSelected: {
    backgroundColor: `${Colors.primary}08`,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.slate300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
    paddingVertical: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
});
