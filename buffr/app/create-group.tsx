/**
 * Create Group Screen
 * 
 * Location: app/create-group.tsx
 * Purpose: Create a new savings group
 * 
 * Features:
 * - Group name input
 * - Optional description
 * - Create group with validation
 * - Glass effect components
 * - Real estate planning
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import defaultStyles from '@/constants/Styles';
import Layout from '@/constants/Layout';
import { ScreenHeader, PillButton, GlassCard } from '@/components/common';
import { log } from '@/utils/logger';

export default function CreateGroupScreen() {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    setIsCreating(true);
    try {
      const { apiPost } = await import('@/utils/apiClient');
      const newGroup = await apiPost<{ id: string }>('/groups', {
        name: groupName.trim(),
        description: description.trim() || undefined,
      });
      
      Alert.alert(
        'Group Created',
        `Group "${groupName}" has been created successfully`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace({
                pathname: '/groups/[id]',
                params: { id: newGroup.id },
              });
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create group. Please try again.');
      log.error('Error creating group:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={defaultStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScreenHeader title="Create Group" showBackButton onBack={handleBack} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Create Savings Group</Text>
          <Text style={styles.headerSubtitle}>
            Start saving together with friends and family
          </Text>
        </View>

        {/* Group Name Card - Glass Effect */}
        <GlassCard style={styles.nameCard} padding={20} borderRadius={16}>
          <Text style={styles.label}>Group Name</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="Enter group name"
            placeholderTextColor={Colors.textSecondary}
            value={groupName}
            onChangeText={setGroupName}
            maxLength={50}
            autoFocus={true}
          />
        </GlassCard>

        {/* Description Card - Glass Effect */}
        <GlassCard style={styles.descriptionCard} padding={20} borderRadius={16}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="What are you saving for?"
            placeholderTextColor={Colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={200}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>
            {description.length}/200
          </Text>
        </GlassCard>

        {/* Info Card - Glass Effect */}
        <GlassCard style={styles.infoCard} padding={16} borderRadius={16}>
          <View style={styles.infoRow}>
            <FontAwesome name="info-circle" size={18} color={Colors.info} />
            <Text style={styles.infoText}>
              Group members can contribute to the savings goal. You can add members after creating the group.
            </Text>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Create Button */}
      <View style={styles.buttonContainer}>
        <PillButton
          label={isCreating ? 'Creating...' : 'Create Group'}
          variant="primary"
          onPress={handleCreate}
          disabled={isCreating || !groupName.trim()}
        />
      </View>
    </KeyboardAvoidingView>
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
  headerSection: {
    marginBottom: Layout.LARGE_SECTION_SPACING,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  nameCard: {
    marginBottom: Layout.SECTION_SPACING,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    paddingVertical: 8,
  },
  descriptionCard: {
    marginBottom: Layout.SECTION_SPACING,
  },
  descriptionInput: {
    fontSize: 16,
    color: Colors.text,
    minHeight: 100,
    paddingVertical: 8,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: 8,
  },
  infoCard: {
    marginBottom: Layout.SECTION_SPACING,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
