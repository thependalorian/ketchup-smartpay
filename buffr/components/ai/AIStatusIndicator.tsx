/**
 * AI Status Indicator Component
 * 
 * Location: components/ai/AIStatusIndicator.tsx
 * Purpose: Display Buffr AI backend connection status
 * 
 * Features:
 * - Real-time health check
 * - Connection status indicator
 * - Offline mode handling
 * - Service availability breakdown
 * 
 * Uses:
 * - useBackendHealth hook from useBuffrAI
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useBackendHealth } from '@/hooks/useBuffrAI';
import Colors from '@/constants/Colors';
import { log } from '@/utils/logger';

interface AIStatusIndicatorProps {
  /** Show as compact badge (for headers) or detailed card */
  variant?: 'badge' | 'card' | 'inline';
  /** Show detailed status on tap */
  showDetails?: boolean;
  /** Auto-check interval in milliseconds (0 = no auto-check) */
  autoCheckInterval?: number;
  /** Callback when status changes */
  onStatusChange?: (healthy: boolean) => void;
}

interface ServiceStatus {
  name: string;
  icon: string;
  status: boolean;
}

export default function AIStatusIndicator({
  variant = 'badge',
  showDetails = true,
  autoCheckInterval = 30000, // 30 seconds
  onStatusChange,
}: AIStatusIndicatorProps) {
  const { checkHealth, healthy, loading, error } = useBackendHealth();
  const [showModal, setShowModal] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);

  // Initial health check
  useEffect(() => {
    performHealthCheck();
  }, []);

  // Auto-check interval
  useEffect(() => {
    if (autoCheckInterval <= 0) return;

    const interval = setInterval(() => {
      performHealthCheck();
    }, autoCheckInterval);

    return () => clearInterval(interval);
  }, [autoCheckInterval]);

  // Notify parent of status changes
  useEffect(() => {
    if (healthy !== null && onStatusChange) {
      onStatusChange(healthy);
    }
  }, [healthy, onStatusChange]);

  const performHealthCheck = async () => {
    try {
      const result = await checkHealth();
      setLastChecked(new Date());
      
      // Parse service statuses from result
      if (result?.services?.agents) {
        const agentServices: ServiceStatus[] = [
          { name: 'Guardian Agent', icon: 'shield', status: result.services.agents.guardian ?? false },
          { name: 'Transaction Analyst', icon: 'line-chart', status: result.services.agents.transaction_analyst ?? false },
          { name: 'Scout Agent', icon: 'search', status: result.services.agents.scout ?? false },
          { name: 'Mentor Agent', icon: 'graduation-cap', status: result.services.agents.mentor ?? false },
          { name: 'Crafter Agent', icon: 'cogs', status: result.services.agents.crafter ?? false },
          { name: 'Companion Agent', icon: 'comments', status: result.services.agents.companion ?? false },
          { name: 'RAG Agent', icon: 'book', status: result.services.agents.rag ?? false },
        ];
        setServices(agentServices);
      }
    } catch (err) {
      log.error('Health check failed:', err);
    }
  };

  const formatLastChecked = (): string => {
    if (!lastChecked) return 'Never';
    const seconds = Math.floor((new Date().getTime() - lastChecked.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getStatusColor = (): string => {
    if (loading) return Colors.gray;
    if (healthy === null) return Colors.gray;
    return healthy ? Colors.success : Colors.error;
  };

  const getStatusText = (): string => {
    if (loading) return 'Checking...';
    if (healthy === null) return 'Unknown';
    if (error) return 'Offline';
    return healthy ? 'Online' : 'Issues';
  };

  const handlePress = () => {
    if (showDetails) {
      setShowModal(true);
    }
  };

  // Badge variant (compact, for headers)
  if (variant === 'badge') {
    return (
      <>
        <TouchableOpacity
          style={styles.badge}
          onPress={handlePress}
          activeOpacity={showDetails ? 0.7 : 1}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          )}
          <Text style={styles.badgeText}>AI</Text>
        </TouchableOpacity>

        {showDetails && renderModal()}
      </>
    );
  }

  // Inline variant (for settings lists)
  if (variant === 'inline') {
    return (
      <>
        <TouchableOpacity
          style={styles.inlineContainer}
          onPress={handlePress}
          activeOpacity={showDetails ? 0.7 : 1}
        >
          <View style={styles.inlineLeft}>
            <FontAwesome name="server" size={18} color={Colors.dark} />
            <View style={styles.inlineInfo}>
              <Text style={styles.inlineTitle}>Buffr AI Services</Text>
              <Text style={styles.inlineSubtitle}>Last checked: {formatLastChecked()}</Text>
            </View>
          </View>
          <View style={styles.inlineRight}>
            {loading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
              </>
            )}
            <FontAwesome name="chevron-right" size={14} color={Colors.gray} />
          </View>
        </TouchableOpacity>

        {showDetails && renderModal()}
      </>
    );
  }

  // Card variant (detailed display)
  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={showDetails ? 0.7 : 1}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <View style={[styles.iconCircle, { backgroundColor: getStatusColor() + '20' }]}>
              <FontAwesome name="magic" size={20} color={getStatusColor()} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Buffr AI</Text>
              <Text style={styles.cardSubtitle}>{getStatusText()}</Text>
            </View>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <TouchableOpacity onPress={performHealthCheck} style={styles.refreshBtn}>
              <FontAwesome name="refresh" size={16} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.lastCheckedText}>Last checked: {formatLastChecked()}</Text>
          {showDetails && (
            <Text style={styles.tapHint}>Tap for details</Text>
          )}
        </View>
      </TouchableOpacity>

      {showDetails && renderModal()}
    </>
  );

  function renderModal() {
    return (
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI Service Status</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <FontAwesome name="times" size={24} color={Colors.dark} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* Overall Status */}
            <View style={styles.overallStatus}>
              <View style={[styles.bigStatusCircle, { backgroundColor: getStatusColor() + '20' }]}>
                <FontAwesome
                  name={healthy ? 'check-circle' : error ? 'times-circle' : 'question-circle'}
                  size={48}
                  color={getStatusColor()}
                />
              </View>
              <Text style={styles.overallStatusText}>
                {healthy ? 'All Systems Operational' : error ? 'Services Unavailable' : 'Checking Status...'}
              </Text>
              <Text style={styles.lastCheckedModal}>Last checked: {formatLastChecked()}</Text>
            </View>

            {/* Services List */}
            <View style={styles.servicesSection}>
              <Text style={styles.sectionTitle}>Agent Services</Text>
              {services.map((service, index) => (
                <View key={index} style={styles.serviceRow}>
                  <View style={styles.serviceLeft}>
                    <FontAwesome name={service.icon as any} size={16} color={Colors.dark} />
                    <Text style={styles.serviceName}>{service.name}</Text>
                  </View>
                  <View style={[styles.serviceStatus, { backgroundColor: service.status ? Colors.success + '20' : Colors.error + '20' }]}>
                    <FontAwesome
                      name={service.status ? 'check' : 'times'}
                      size={12}
                      color={service.status ? Colors.success : Colors.error}
                    />
                    <Text style={[styles.serviceStatusText, { color: service.status ? Colors.success : Colors.error }]}>
                      {service.status ? 'Online' : 'Offline'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Refresh Button */}
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={performHealthCheck}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <FontAwesome name="refresh" size={16} color={Colors.white} />
                  <Text style={styles.refreshButtonText}>Check Again</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Error Message */}
            {error && (
              <View style={styles.errorBox}>
                <FontAwesome name="exclamation-triangle" size={16} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  // Badge variant
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Inline variant
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  inlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inlineInfo: {
    gap: 2,
  },
  inlineTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
  },
  inlineSubtitle: {
    fontSize: 12,
    color: Colors.gray,
  },
  inlineRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Card variant
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.gray,
  },
  refreshBtn: {
    padding: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  lastCheckedText: {
    fontSize: 12,
    color: Colors.gray,
  },
  tapHint: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark,
  },
  modalContent: {
    padding: 20,
  },
  overallStatus: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  bigStatusCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  overallStatusText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  lastCheckedModal: {
    fontSize: 13,
    color: Colors.gray,
  },
  servicesSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceName: {
    fontSize: 15,
    color: Colors.dark,
  },
  serviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.error + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    flex: 1,
  },
});
