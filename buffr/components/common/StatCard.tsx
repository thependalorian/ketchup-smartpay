/**
 * Stat Card Component
 *
 * Location: components/common/StatCard.tsx
 * Purpose: Reusable stat card for displaying large numbers with labels and trend indicators
 *
 * Features:
 * - Large number display
 * - Label
 * - Trend indicator (up/down)
 * - Optional icon
 * - Glass effect
 *
 * @psychology
 * - **Miller's Law**: Large, prominent numbers (28px, 700 weight) are easy to
 *   chunk and remember. Limit dashboard to 3-5 stat cards to stay within
 *   cognitive limits.
 * - **Visual Hierarchy**: Number is most prominent, followed by label, then
 *   trend. This guides eye movement through content by importance.
 * - **Color Psychology**: Trend indicators use semantic colors:
 *   - Green (up) → Positive change, growth
 *   - Red (down) → Negative change, decline
 *   This creates instant emotional recognition without reading.
 * - **Gestalt Figure-Ground**: GlassCard elevates stat above background,
 *   creating focus and establishing data importance.
 * - **Anchoring Effect**: Large numbers anchor user perception. Show positive
 *   metrics prominently to reinforce app value.
 *
 * @accessibility
 * - Trend direction should not rely on color alone - arrow icons provide redundancy
 * - Large text size improves readability
 * - Currency context should be clear for screen readers
 *
 * @see GlassCard for card styling
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import GlassCard from './GlassCard';
import Colors from '@/constants/Colors';

interface StatCardProps {
  value: number | string;
  label: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label?: string;
  };
  icon?: string;
  iconColor?: string;
  currency?: string;
  style?: StyleProp<ViewStyle>;
}

export default function StatCard({
  value,
  label,
  trend,
  icon,
  iconColor = Colors.primary,
  currency,
  style,
}: StatCardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    if (currency) {
      return `${currency} ${val.toFixed(2)}`;
    }
    return val.toLocaleString();
  };

  return (
    <GlassCard style={[styles.container, style]} padding={20} borderRadius={16}>
      <View style={styles.content}>
        {icon && (
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: iconColor + '20' },
            ]}
          >
            <FontAwesome name={icon as any} size={24} color={iconColor} />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.value}>{formatValue(value)}</Text>
          <Text style={styles.label}>{label}</Text>
          {trend && (
            <View style={styles.trendContainer}>
              <FontAwesome
                name={trend.direction === 'up' ? 'arrow-up' : 'arrow-down'}
                size={12}
                color={trend.direction === 'up' ? Colors.success : Colors.error}
              />
              <Text
                style={[
                  styles.trendText,
                  {
                    color:
                      trend.direction === 'up' ? Colors.success : Colors.error,
                  },
                ]}
              >
                {Math.abs(trend.value)}% {trend.label || ''}
              </Text>
            </View>
          )}
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
