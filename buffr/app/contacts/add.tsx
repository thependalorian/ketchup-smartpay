/**
 * Add Contact Screen
 * 
 * Location: app/contacts/add.tsx
 * Purpose: Add a new contact manually or import from device
 * 
 * Features:
 * - Manual entry (name, phone, email)
 * - Import from device contacts
 * - QR code scan to add contact
 * - Validation before saving
 * - Glass card design
 * 
 * Used by: Contacts screen, Send Money flow
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import defaultStyles from '@/constants/Styles';
import { ScreenHeader, GlassCard, ProfileAvatar } from '@/components/common';
import Layout from '@/constants/Layout';
import { fetchDeviceContacts, requestContactsPermission, type DeviceContact } from '@/utils/contacts';
import { apiPost } from '@/utils/apiClient';
import { log } from '@/utils/logger';

interface ContactFormData {
  name: string;
  phoneNumber: string;
  email: string;
  nickname: string;
}

const initialFormData: ContactFormData = {
  name: '',
  phoneNumber: '+264 ',
  email: '',
  nickname: '',
};

export default function AddContactScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [importedContacts, setImportedContacts] = useState<DeviceContact[]>([]);
  const [showImported, setShowImported] = useState(false);
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phoneNumber.trim() || formData.phoneNumber === '+264 ') {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+264\s?\d{2}\s?\d{3}\s?\d{4}$/.test(formData.phoneNumber.replace(/\s/g, ' ').trim())) {
      // Basic Namibian phone validation
      // Allow various formats
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await apiPost('/contacts', {
        name: formData.name.trim(),
        phone_number: formData.phoneNumber.trim(),
        email: formData.email.trim() || null,
        nickname: formData.nickname.trim() || null,
      });
      
      Alert.alert('Success', 'Contact added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      log.error('Error adding contact:', error);
      Alert.alert('Error', 'Failed to add contact. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportContacts = async () => {
    try {
      const hasPermission = await requestContactsPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please allow access to contacts in your device settings to import contacts.'
        );
        return;
      }

      setLoading(true);
      const contacts = await fetchDeviceContacts();
      setImportedContacts(contacts);
      setShowImported(true);
    } catch (error) {
      log.error('Error importing contacts:', error);
      Alert.alert('Error', 'Failed to import contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectImported = (contact: DeviceContact) => {
    setFormData({
      name: contact.name,
      phoneNumber: contact.phoneNumber || '+264 ',
      email: contact.email || '',
      nickname: '',
    });
    setShowImported(false);
  };

  const handleScanQR = () => {
    router.push('/qr-scanner');
  };

  const handleBack = () => {
    router.back();
  };

  const updateField = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader 
        title="Add Contact" 
        showBackButton 
        onBack={handleBack}
        rightAction={
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
              Save
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={handleImportContacts}
            disabled={loading}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.primary}15` }]}>
              <FontAwesome name="address-book" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionText}>Import from Phone</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={handleScanQR}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#4CAF5015' }]}>
              <FontAwesome name="qrcode" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.quickActionText}>Scan QR Code</Text>
          </TouchableOpacity>
        </View>

        {/* Import List */}
        {showImported && importedContacts.length > 0 && (
          <View style={styles.importSection}>
            <View style={styles.importHeader}>
              <Text style={styles.importTitle}>Select a Contact</Text>
              <TouchableOpacity onPress={() => setShowImported(false)}>
                <FontAwesome name="times" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <GlassCard style={styles.importCard} padding={0} borderRadius={16}>
              <ScrollView style={styles.importList} nestedScrollEnabled>
                {importedContacts.slice(0, 20).map((contact) => (
                  <TouchableOpacity
                    key={contact.id}
                    style={styles.importItem}
                    onPress={() => handleSelectImported(contact)}
                  >
                    <ProfileAvatar name={contact.name} size={40} />
                    <View style={styles.importItemContent}>
                      <Text style={styles.importItemName}>{contact.name}</Text>
                      <Text style={styles.importItemPhone}>{contact.phoneNumber}</Text>
                    </View>
                    <FontAwesome name="plus-circle" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </GlassCard>
          </View>
        )}

        {/* Manual Entry Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Contact Details</Text>
          
          <GlassCard style={styles.formCard} padding={16} borderRadius={16}>
            {/* Name Field */}
            <View style={styles.formField}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                <FontAwesome name="user" size={16} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  placeholderTextColor={Colors.textTertiary}
                  value={formData.name}
                  onChangeText={(value) => updateField('name', value)}
                  autoCapitalize="words"
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Phone Field */}
            <View style={styles.formField}>
              <Text style={styles.label}>Phone Number *</Text>
              <View style={[styles.inputContainer, errors.phoneNumber && styles.inputError]}>
                <FontAwesome name="phone" size={16} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="+264 81 XXX XXXX"
                  placeholderTextColor={Colors.textTertiary}
                  value={formData.phoneNumber}
                  onChangeText={(value) => updateField('phoneNumber', value)}
                  keyboardType="phone-pad"
                />
              </View>
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
            </View>

            {/* Email Field (Optional) */}
            <View style={styles.formField}>
              <Text style={styles.label}>Email (Optional)</Text>
              <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                <FontAwesome name="envelope" size={16} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  placeholderTextColor={Colors.textTertiary}
                  value={formData.email}
                  onChangeText={(value) => updateField('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Nickname Field (Optional) */}
            <View style={styles.formField}>
              <Text style={styles.label}>Nickname (Optional)</Text>
              <View style={styles.inputContainer}>
                <FontAwesome name="tag" size={16} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Mom, Work"
                  placeholderTextColor={Colors.textTertiary}
                  value={formData.nickname}
                  onChangeText={(value) => updateField('nickname', value)}
                />
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButtonLarge, loading && styles.saveButtonLargeDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <FontAwesome name="check" size={18} color={Colors.white} />
              <Text style={styles.saveButtonLargeText}>Save Contact</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <FontAwesome name="info-circle" size={14} color={Colors.textTertiary} />
          <Text style={styles.infoText}>
            Contacts are stored securely and used only for money transfers within Buffr.
          </Text>
        </View>
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
    paddingBottom: 40,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  saveButtonDisabled: {
    color: Colors.textTertiary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Layout.SECTION_SPACING,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
  importSection: {
    marginBottom: Layout.SECTION_SPACING,
  },
  importHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  importTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  importCard: {},
  importList: {
    maxHeight: 200,
  },
  importItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  importItemContent: {
    flex: 1,
  },
  importItemName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  importItemPhone: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  formSection: {
    marginBottom: Layout.SECTION_SPACING,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  formCard: {},
  formField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
  saveButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginBottom: Layout.SECTION_SPACING,
  },
  saveButtonLargeDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  saveButtonLargeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textTertiary,
    lineHeight: 18,
  },
});
