/**
 * Group View Screen
 * 
 * Location: app/groups/[id].tsx
 * Purpose: View group details, members, and total amount saved
 * 
 * Features:
 * - Group details with glass cards
 * - Members list with contributions
 * - Total amount saved display
 * - Contribute option
 * - Add member option
 * - Real estate planning
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
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
  totalAmount: number;
  members: GroupMember[];
  ownerId: string;
  createdAt: Date;
}

export default function GroupViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const currency = user?.currency || 'N$';
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  // Load group data from API
  useEffect(() => {
    const loadGroup = async () => {
      setLoading(true);
      try {
        const { apiGet } = await import('@/utils/apiClient');
        const groupData = await apiGet<Group>(`/groups/${params.id}`);
        setGroup(groupData);
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

  const handleContribute = () => {
    router.push({
      pathname: '/groups/[id]/contribute',
      params: { id: params.id },
    });
  };

  const handleAddMember = () => {
    router.push({
      pathname: '/groups/[id]/add-member',
      params: { id: params.id },
    });
  };

  const handleSettings = () => {
    router.push({
      pathname: '/groups/[id]/settings',
      params: { id: params.id },
    });
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
        <ScreenHeader title="Group" showBackButton onBack={handleBack} />
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
      <ScreenHeader 
        title={group.name} 
        showBackButton 
        onBack={handleBack}
        rightAction={
          <TouchableOpacity onPress={handleSettings}>
            <FontAwesome name="cog" size={20} color={Colors.text} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Amount Card - Glass Effect */}
        <GlassCard style={styles.totalCard} padding={16} borderRadius={16}>
          <Text style={styles.totalLabel}>Total Saved</Text>
          <View style={styles.totalAmountContainer}>
            <Text style={styles.currencySymbol}>{currency}</Text>
            <Text style={styles.totalAmount}>
              {group.totalAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
          <Text style={styles.memberCount}>
            {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
          </Text>
        </GlassCard>

        {/* Description Card - Glass Effect (if description exists) */}
        {group.description && (
          <GlassCard style={styles.descriptionCard} padding={16} borderRadius={16}>
            <Text style={styles.descriptionText}>{group.description}</Text>
          </GlassCard>
        )}

        {/* Members Section */}
        <View style={styles.membersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members</Text>
            {isOwner && (
              <TouchableOpacity onPress={handleAddMember}>
                <FontAwesome name="user-plus" size={18} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>

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
                    size={44}
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
                    <Text style={styles.memberContribution}>
                      Contributed: {currency} {member.contribution.toLocaleString()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.contributionPercentage}>
                  {((member.contribution / group.totalAmount) * 100).toFixed(0)}%
                </Text>
              </View>
            ))}
          </GlassCard>
        </View>

        {/* Group Info Card - Glass Effect */}
        <GlassCard style={styles.infoCard} padding={16} borderRadius={16}>
          <View style={styles.infoRow}>
            <FontAwesome name="calendar" size={16} color={Colors.textSecondary} />
            <Text style={styles.infoText}>
              Created: {group.createdAt.toLocaleDateString()}
            </Text>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <PillButton
          label="Contribute"
          variant="primary"
          onPress={handleContribute}
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
  totalCard: {
    marginBottom: Layout.SECTION_SPACING,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  totalAmountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
    gap: 8,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  totalAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.primary,
  },
  memberCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  descriptionCard: {
    marginBottom: Layout.SECTION_SPACING,
  },
  descriptionText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  membersSection: {
    marginBottom: Layout.SECTION_SPACING,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
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
    gap: 4,
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
  memberContribution: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  contributionPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  infoCard: {
    marginBottom: Layout.SECTION_SPACING,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  buttonContainer: {
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
