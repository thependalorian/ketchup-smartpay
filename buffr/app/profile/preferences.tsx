/**
 * User Preferences Screen
 * 
 * Location: app/profile/preferences.tsx
 * Purpose: Manage user preferences and app settings
 * 
 * Features:
 * - Language selection
 * - Currency selection
 * - Theme selection
 * - Date/time format
 * - Default wallet
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useUser } from '@/contexts/UserContext';
import { ScreenHeader, SectionHeader, PillButton } from '@/components/common';
import Colors from '@/constants/Colors';
import defaultStyles from '@/constants/Styles';
import Layout from '@/constants/Layout';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'de', name: 'German' },
];

const CURRENCIES = [
  { code: 'N$', name: 'Namibian Dollar (N$)' },
  { code: 'ZAR', name: 'South African Rand (R)' },
  { code: 'USD', name: 'US Dollar ($)' },
];

const THEMES = [
  { value: 'light', name: 'Light' },
  { value: 'dark', name: 'Dark' },
  { value: 'auto', name: 'System' },
];

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', name: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', name: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', name: 'YYYY-MM-DD' },
];

const TIME_FORMATS = [
  { value: '12h', name: '12 Hour' },
  { value: '24h', name: '24 Hour' },
];

export default function UserPreferencesScreen() {
  const router = useRouter();
  const { preferences, updatePreferences } = useUser();
  const [language, setLanguage] = useState(preferences.language || 'en');
  const [currency, setCurrency] = useState(preferences.currency || 'N$');
  const [theme, setTheme] = useState(preferences.theme || 'light');
  const [dateFormat, setDateFormat] = useState(preferences.dateFormat || 'DD/MM/YYYY');
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>(preferences.timeFormat || '24h');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load preferences
    setLanguage(preferences.language || 'en');
    setCurrency(preferences.currency || 'N$');
    setTheme(preferences.theme || 'light');
  }, [preferences]);

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferences({
        language,
        currency,
        theme,
        dateFormat,
        timeFormat,
      });
      Alert.alert('Success', 'Preferences saved successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const showLanguagePicker = () => {
    Alert.alert(
      'Select Language',
      '',
      [
        ...LANGUAGES.map((lang) => ({
          text: lang.name,
          onPress: () => setLanguage(lang.code),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const showCurrencyPicker = () => {
    Alert.alert(
      'Select Currency',
      '',
      [
        ...CURRENCIES.map((curr) => ({
          text: curr.name,
          onPress: () => setCurrency(curr.code),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const showThemePicker = () => {
    Alert.alert(
      'Select Theme',
      '',
      [
        ...THEMES.map((t) => ({
          text: t.name,
          onPress: () => setTheme(t.value as 'light' | 'dark' | 'auto'),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const showDateFormatPicker = () => {
    Alert.alert(
      'Select Date Format',
      '',
      [
        ...DATE_FORMATS.map((format) => ({
          text: format.name,
          onPress: () => setDateFormat(format.value),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const showTimeFormatPicker = () => {
    Alert.alert(
      'Select Time Format',
      '',
      [
        ...TIME_FORMATS.map((format) => ({
          text: format.name,
          onPress: () => setTimeFormat(format.value as '12h' | '24h'),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getLanguageName = (code: string) => {
    return LANGUAGES.find((l) => l.code === code)?.name || code;
  };

  const getCurrencyName = (code: string) => {
    return CURRENCIES.find((c) => c.code === code)?.name || code;
  };

  const getThemeName = (value: string) => {
    return THEMES.find((t) => t.value === value)?.name || value;
  };

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader title="Preferences" onBack={handleBack} showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Display Preferences */}
        <View style={styles.section}>
          <SectionHeader title="Display" />
          <View style={styles.settingCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={showLanguagePicker}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Language</Text>
                <Text style={styles.settingValue}>{getLanguageName(language)}</Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.settingRow}
              onPress={showCurrencyPicker}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Currency</Text>
                <Text style={styles.settingValue}>{getCurrencyName(currency)}</Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.settingRow}
              onPress={showThemePicker}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Theme</Text>
                <Text style={styles.settingValue}>{getThemeName(theme)}</Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Format Preferences */}
        <View style={styles.section}>
          <SectionHeader title="Format" />
          <View style={styles.settingCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={showDateFormatPicker}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Date Format</Text>
                <Text style={styles.settingValue}>{dateFormat}</Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.settingRow}
              onPress={showTimeFormatPicker}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Time Format</Text>
                <Text style={styles.settingValue}>{timeFormat === '12h' ? '12 Hour' : '24 Hour'}</Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <PillButton
          label={saving ? 'Saving...' : 'Save Preferences'}
          variant="primary"
          onPress={handleSave}
          disabled={saving}
          loading={saving}
          style={styles.saveButton}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
  },
  settingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  saveButton: {
    marginHorizontal: 20,
    marginTop: 8,
  },
});
