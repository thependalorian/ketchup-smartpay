/**
 * Group Settings Screen
 * 
 * Location: app/groups/[id]/settings.tsx
 * Purpose: Manage group settings, members, and group information
 * 
 * Features:
 * - Group name and description editing
 * - Member management
 * - Remove member option
 * - Leave group option
 * - Real estate planning
 */

import React, { useState, useEffect } from 'react';
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
import { ScreenHeader, PillButton, GlassCard, ProfileAvatar } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import Layout from '@/constants/Layout';
import { log } from '@/utils/logger';

interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  contribution: number;
  isOwner?: boolean;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: GroupMember[];
}

export default function GroupSettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load group data from API
  useEffect(() => {
    const loadGroup = async () => {
      setLoading(true);
      try {
        const { apiGet } = await import('@/utils/apiClient');
        const groupData = await apiGet<Group>(`/groups/${params.id}`);
        setGroup(groupData);
        setGroupName(groupData.name);
        setDescription(groupData.description || '');
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to load group');
        log.error('Error loading group:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadGroup();
    }
  }, [params.id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { apiPut } = await import('@/utils/apiClient');
      const updatedGroup = await apiPut<Group>(`/groups/${params.id}`, {
        name: groupName.trim(),
        description: description.trim() || undefined,
      });
      
      setGroup(updatedGroup);
      setEditingName(false);
      setEditingDescription(false);
      Alert.alert('Success', 'Group settings updated');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update group settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { apiDelete } = await import('@/utils/apiClient');
              await apiDelete(`/groups/${params.id}/members?memberId=${memberId}`);
              
              // Refresh group data
              const { apiGet } = await import('@/utils/apiClient');
              const updatedGroup = await apiGet<Group>(`/groups/${params.id}`);
              setGroup(updatedGroup);
              
              Alert.alert('Member Removed', `${memberName} has been removed from the group`);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group? You will lose access to the group and your contributions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const { apiDelete } = await import('@/utils/apiClient');
              await apiDelete(`/groups/${params.id}/members?memberId=${user?.id}`);
              
              Alert.alert('Left Group', 'You have left the group');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to leave group');
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={[defaultStyles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading group...</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={defaultStyles.container}>
        <ScreenHeader title="Settings" showBackButton onBack={handleBack} />
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Group not found</Text>
        </View>
      </View>
    );
  }

  const isOwner = group.ownerId === user?.id;

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader title="Group Settings" showBackButton onBack={handleBack} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Information</Text>
          
          {/* Group Name Card - Glass Effect */}
          <GlassCard style={styles.inputCard} padding={16} borderRadius={16}>
            <View style={styles.inputHeader}>
              <Text style={styles.inputLabel}>Group Name</Text>
              {!editingName && (
                <TouchableOpacity onPress={() => setEditingName(true)}>
                  <FontAwesome name="edit" size={16} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>
            {editingName ? (
              <TextInput
                style={styles.textInput}
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Enter group name"
                placeholderTextColor={Colors.textSecondary}
                maxLength={50}
                autoFocus={true}
              />
            ) : (
              <Text style={styles.displayText}>{groupName}</Text>
            )}
          </GlassCard>

          {/* Description Card - Glass Effect */}
          <GlassCard style={styles.inputCard} padding={16} borderRadius={16}>
            <View style={styles.inputHeader}>
              <Text style={styles.inputLabel}>Description</Text>
              {!editingDescription && (
                <TouchableOpacity onPress={() => setEditingDescription(true)}>
                  <FontAwesome name="edit" size={16} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>
            {editingDescription ? (
              <TextInput
                style={[styles.textInput, styles.descriptionInput]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description"
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
                maxLength={200}
                textAlignVertical="top"
              />
            ) : (
              <Text style={styles.displayText}>
                {description || 'No description'}
              </Text>
            )}
          </GlassCard>

          {/* Save Button (if editing) */}
          {(editingName || editingDescription) && (
            <View style={styles.saveButtonContainer}>
              <PillButton
                label={isSaving ? 'Saving...' : 'Save Changes'}
                variant="primary"
                onPress={handleSave}
                disabled={isSaving}
              />
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditingName(false);
                  setEditingDescription(false);
                  setGroupName(group.name);
                  setDescription(group.description || '');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members ({group.members.length})</Text>
          
          <GlassCard style={styles.membersCard} padding={0} borderRadius={16}>
            {group.members.map((member, index) => (
              <View
                key={member.id}
                style={[
                  styles.memberItem,
                  index < group.members.length - 1 && styles.memberItemBorder,
                ]}
              >
                <View style={styles.memberInfo}>
                  <ProfileAvatar
                    size={40}
                    imageUri={member.avatar}
                    name={member.name}
                  />
                  <View style={styles.memberDetails}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      {member.isOwner && (
                        <View style={styles.ownerBadge}>
                          <Text style={styles.ownerBadgeText}>Owner</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                {isOwner && !member.isOwner && (
                  <TouchableOpacity
                    onPress={() => handleRemoveMember(member.id, member.name)}
                    style={styles.removeButton}
                  >
                    <FontAwesome name="times" size={18} color={Colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </GlassCard>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <GlassCard style={styles.dangerCard} padding={16} borderRadius={16}>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleLeaveGroup}
            >
              <FontAwesome name="sign-out" size={18} color={Colors.error} />
              <Text style={styles.dangerButtonText}>Leave Group</Text>
            </TouchableOpacity>
          </GlassCard>
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
    paddingBottom: Layout.LARGE_SECTION_SPACING,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
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
  inputCard: {
    marginBottom: Layout.SECTION_SPACING,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 8,
  },
  descriptionInput: {
    minHeight: 80,
  },
  displayText: {
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 8,
  },
  saveButtonContainer: {
    marginTop: 8,
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  membersCard: {
    marginTop: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  memberItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberDetails: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  ownerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: Colors.primaryMuted,
    borderRadius: 8,
  },
  ownerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  removeButton: {
    padding: 8,
  },
  dangerCard: {
    marginTop: 8,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
});
