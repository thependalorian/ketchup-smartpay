/**
 * AI Chat Interface Component
 * 
 * Location: components/common/AIChatInterface.tsx
 * Purpose: Full AI chat interface for Help, FAQs, and About sections
 * 
 * Features:
 * - Chat with Buffr AI Companion Agent
 * - Message history
 * - Input field with send button
 * - Loading states
 * - Error handling
 * - Fallback to static content
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAIChat } from '@/hooks/useBuffrAI';
import { useUser } from '@/contexts/UserContext';
import Colors from '@/constants/Colors';
import GlassCard from './GlassCard';
import AIChatBubble, { AIChatMessage } from './AIChatBubble';
import { HORIZONTAL_PADDING } from '@/constants/Layout';

interface AIChatInterfaceProps {
  placeholder?: string;
  initialMessage?: string;
  onMessageSent?: (message: string) => void;
  onError?: (error: string) => void;
  style?: any;
  // Support mode props
  mode?: 'companion' | 'support'; // Default: 'companion'
  onTicketCreated?: (ticketNumber: string) => void;
  onEscalated?: (ticketNumber: string) => void;
}

export default function AIChatInterface({
  placeholder = 'Ask Buffr AI anything...',
  initialMessage,
  onMessageSent,
  onError,
  style,
  mode = 'companion',
  onTicketCreated,
  onEscalated,
}: AIChatInterfaceProps) {
  const { user } = useUser();
  const { sendMessage, loading, error } = useAIChat();
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Initialize session for support mode
  useEffect(() => {
    if (mode === 'support' && !sessionId) {
      setSessionId(`support_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
  }, [mode, sessionId]);

  // Add initial message if provided
  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      const welcomeMessage: AIChatMessage = {
        id: 'welcome',
        role: 'ai',
        content: initialMessage,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [initialMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || loading || !user?.id) return;

    const userMessage: AIChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    const aiMessage: AIChatMessage = {
      id: `ai_${Date.now()}`,
      role: 'ai',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setInputText('');
    onMessageSent?.(inputText.trim());

    try {
      let response;
      
      let supportData: {
        ticket_created?: boolean;
        ticket_number?: string;
        escalated?: boolean;
      } = {};
      
      if (mode === 'support') {
        // Use gateway to call companion agent (which now handles support)
        const { apiPost } = await import('@/utils/apiClient');
        const gatewayResponse = await apiPost<{
          success: boolean;
          data: {
            message: string;
            ticket_created?: boolean;
            ticket_number?: string;
            escalated?: boolean;
            knowledge_base_used?: boolean;
          };
        }>('/api/gateway', {
          target: 'ai',
          path: '/api/companion/chat',
          method: 'POST',
          body: {
            message: inputText.trim(),
            user_id: user.id,
            session_id: sessionId || `support_${Date.now()}`,
          },
        });
        
        const gatewayData = gatewayResponse.data || {};
        response = {
          message: gatewayData.message || 'I apologize, but I couldn\'t generate a response. Please try again.',
        };
        
        // Extract support metadata
        supportData = {
          ticket_created: gatewayData.ticket_created,
          ticket_number: gatewayData.ticket_number,
          escalated: gatewayData.escalated,
        };
      } else {
        // Use regular companion chat
        response = await sendMessage(inputText.trim());
      }
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessage.id
            ? {
                ...msg,
                content: response.message || 'I apologize, but I couldn\'t generate a response. Please try again.',
                isLoading: false,
              }
            : msg
        )
      );
      
      // Handle ticket creation and escalation (support mode)
      if (mode === 'support' && supportData.ticket_created && supportData.ticket_number) {
        onTicketCreated?.(supportData.ticket_number);
        
        if (supportData.escalated) {
          onEscalated?.(supportData.ticket_number);
          // Show alert for escalation
          const { Alert } = await import('react-native');
          Alert.alert(
            'Escalated to Support Team',
            `Your issue has been escalated. Ticket number: ${supportData.ticket_number}\n\nA human support agent will review your case and respond shortly.`,
            [{ text: 'OK' }]
          );
        } else {
          const { Alert } = await import('react-native');
          Alert.alert(
            'Support Ticket Created',
            `Ticket number: ${supportData.ticket_number}\n\nWe'll review your request and get back to you.`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get AI response';
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessage.id
            ? {
                ...msg,
                content: '',
                isLoading: false,
                error: errorMessage,
              }
            : msg
        )
      );
      onError?.(errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, style]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Messages Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome 
              name={mode === 'support' ? 'headphones' : 'comments-o'} 
              size={48} 
              color={Colors.textSecondary} 
            />
            <Text style={styles.emptyTitle}>
              {mode === 'support' ? 'Customer Support' : 'Chat with Buffr AI'}
            </Text>
            <Text style={styles.emptyText}>
              {mode === 'support' 
                ? "I'm here to help! Ask me about G2P vouchers, payments, account issues, or anything else related to Buffr. If you need to speak with a human agent, just ask!"
                : 'Ask me anything about Buffr, G2P vouchers, payments, or how to use the app!'
              }
            </Text>
          </View>
        ) : (
          messages.map((message) => (
            <AIChatBubble key={message.id} message={message} />
          ))
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <GlassCard style={styles.inputCard} padding={0} borderRadius={20}>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={Colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!loading && !!user?.id}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || loading || !user?.id) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || loading || !user?.id}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <FontAwesome name="paper-plane" size={18} color={Colors.white} />
            )}
          </TouchableOpacity>
        </GlassCard>
        {!user?.id && (
          <Text style={styles.authHint}>Please sign in to use AI chat</Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: HORIZONTAL_PADDING,
    paddingBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    padding: HORIZONTAL_PADDING,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textTertiary,
    opacity: 0.5,
  },
  authHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
