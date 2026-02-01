/**
 * AI Chat Bubble Component
 * 
 * Location: components/common/AIChatBubble.tsx
 * Purpose: Reusable AI chat message bubble for displaying AI responses
 * 
 * Features:
 * - User and AI message bubbles
 * - Loading state indicator
 * - Error state handling
 * - Streaming support (optional)
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

export interface AIChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp?: Date;
  isLoading?: boolean;
  error?: string;
}

interface AIChatBubbleProps {
  message: AIChatMessage;
}

export default function AIChatBubble({ message }: AIChatBubbleProps) {
  const isUser = message.role === 'user';
  const isAI = message.role === 'ai';
  const isLoading = message.isLoading;
  const hasError = !!message.error;

  if (isUser) {
    return (
      <View style={[styles.bubble, styles.userBubble]}>
        <Text style={styles.userText}>{message.content}</Text>
      </View>
    );
  }

  if (isAI) {
    return (
      <View style={[styles.bubble, styles.aiBubble]}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Buffr AI is thinking...</Text>
          </View>
        ) : hasError ? (
          <View style={styles.errorContainer}>
            <FontAwesome name="exclamation-circle" size={16} color={Colors.error} />
            <Text style={styles.errorText}>
              {message.error || 'Sorry, I encountered an error. Please try again.'}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.aiHeader}>
              <FontAwesome name="comments" size={16} color={Colors.primary} />
              <Text style={styles.aiLabel}>Buffr AI</Text>
            </View>
            <Text style={styles.aiText}>{message.content}</Text>
          </>
        )}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.backgroundGray,
    borderBottomLeftRadius: 4,
  },
  userText: {
    fontSize: 15,
    color: Colors.white,
    lineHeight: 20,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  aiText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    flex: 1,
  },
});
