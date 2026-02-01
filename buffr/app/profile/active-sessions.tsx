/**
 * Active Sessions Screen
 * 
 * Location: app/profile/active-sessions.tsx
 * Purpose: View and manage active device sessions
 * 
 * Features:
 * - List all active sessions
 * - View session details (device, location, last active)
 * - Revoke sessions
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
import { ScreenHeader, SectionHeader, EmptyState } from '@/components/common';
import Colors from '@/constants/Colors';
import defaultStyles from '@/constants/Styles';
import Layout from '@/constants/Layout';
import { log } from '@/utils/logger';
import { apiGet, apiDelete } from '@/utils/apiClient';

interface Session {
  id: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'web';
  location: string;
  lastActive: Date;
  isCurrent: boolean;
  ipAddress: string;
}

export default function ActiveSessionsScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      // Fetch sessions from API
      const data = await apiGet<Session[]>('/users/sessions');
      setSessions(data || []);
    } catch (error) {
      log.error('Error loading sessions:', error);
      // Show empty state on error
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleRevokeSession = (session: Session) => {
    if (session.isCurrent) {
      Alert.alert(
        'Cannot Revoke Current Session',
        'You cannot revoke your current session. Please use another device to revoke this session.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Revoke Session',
      `Are you sure you want to revoke the session on ${session.deviceName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call API to revoke session
              await apiDelete(`/users/sessions?sessionId=${session.id}`);
              setSessions((prev) => prev.filter((s) => s.id !== session.id));
              Alert.alert('Success', 'Session revoked successfully');
            } catch (error) {
              log.error('Error revoking session:', error);
              Alert.alert('Error', 'Failed to revoke session. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleRevokeAll = () => {
    Alert.alert(
      'Revoke All Sessions',
      'Are you sure you want to revoke all other sessions? You will remain signed in on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call API to revoke all other sessions
              await apiDelete('/users/sessions?revokeAll=true');
              setSessions((prev) => prev.filter((s) => s.isCurrent));
              Alert.alert('Success', 'All other sessions have been revoked');
            } catch (error) {
              log.error('Error revoking all sessions:', error);
              Alert.alert('Error', 'Failed to revoke sessions. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getDeviceIcon = (deviceType: Session['deviceType']) => {
    switch (deviceType) {
      case 'mobile':
        return 'mobile';
      case 'tablet':
        return 'tablet';
      case 'desktop':
        return 'laptop';
      case 'web':
        return 'globe';
      default:
        return 'desktop';
    }
  };

  const formatLastActive = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <View style={defaultStyles.container}>
        <ScreenHeader title="Active Sessions" onBack={handleBack} showBackButton />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={defaultStyles.container}>
      <ScreenHeader title="Active Sessions" onBack={handleBack} showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sessions.length === 0 ? (
          <EmptyState
            icon="mobile"
            title="No Active Sessions"
            message="You don't have any active sessions"
          />
        ) : (
          <>
            <View style={styles.section}>
              <SectionHeader title="Active Devices" />
              <View style={styles.sessionsList}>
                {sessions.map((session, index) => (
                  <View key={session.id}>
                    <View style={styles.sessionCard}>
                      <View style={styles.sessionHeader}>
                        <View style={styles.sessionIconContainer}>
                          <FontAwesome
                            name={getDeviceIcon(session.deviceType) as any}
                            size={24}
                            color={Colors.primary}
                          />
                        </View>
                        <View style={styles.sessionInfo}>
                          <View style={styles.sessionTitleRow}>
                            <Text style={styles.sessionDeviceName}>{session.deviceName}</Text>
                            {session.isCurrent && (
                              <View style={styles.currentBadge}>
                                <Text style={styles.currentBadgeText}>Current</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.sessionLocation}>{session.location}</Text>
                          <Text style={styles.sessionDetails}>
                            {formatLastActive(session.lastActive)} • {session.ipAddress}
                          </Text>
                        </View>
                        {!session.isCurrent && (
                          <TouchableOpacity
                            style={styles.revokeButton}
                            onPress={() => handleRevokeSession(session)}
                            activeOpacity={0.7}
                          >
                            <FontAwesome name="times" size={18} color={Colors.error} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    {index < sessions.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>

            {sessions.filter((s) => !s.isCurrent).length > 0 && (
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.revokeAllButton}
                  onPress={handleRevokeAll}
                  activeOpacity={0.7}
                >
                  <Text style={styles.revokeAllText}>Revoke All Other Sessions</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
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
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
  },
  sessionsList: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  sessionCard: {
    padding: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sessionDeviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  currentBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
    textTransform: 'uppercase',
  },
  sessionLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  sessionDetails: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  revokeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 64,
  },
  revokeAllButton: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.error,
    alignItems: 'center',
  },
  revokeAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
});
