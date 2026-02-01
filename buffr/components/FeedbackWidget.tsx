/**
 * FeedbackWidget – In-app and USSD feedback and NPS collection
 *
 * Location: buffr/components/FeedbackWidget.tsx
 * Purpose: Post-transaction and periodic NPS/feedback (CONSOLIDATED_PRD User-Centric KPIs, SASSA-style beneficiary voice).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export type FeedbackContext = 'post_transaction' | 'periodic' | 'ussd_prompt' | 'manual';

export interface FeedbackWidgetProps {
  /** Context for analytics */
  context?: FeedbackContext;
  /** Prefill NPS (0-10) if known */
  initialNPS?: number | null;
  /** Submit callback: NPS 0-10, optional comment */
  onSubmit?: (nps: number, comment?: string) => Promise<void>;
  /** Compact mode (e.g. floating button) */
  compact?: boolean;
}

const NPS_LABELS: Record<number, string> = {
  0: 'Not at all likely',
  1: '',
  2: '',
  3: '',
  4: '',
  5: 'Neutral',
  6: '',
  7: '',
  8: '',
  9: '',
  10: 'Extremely likely',
};

export default function FeedbackWidget({
  context = 'manual',
  initialNPS = null,
  onSubmit,
  compact = false,
}: FeedbackWidgetProps) {
  const [visible, setVisible] = useState(false);
  const [nps, setNps] = useState<number | null>(initialNPS ?? null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (nps === null || !onSubmit) return;
    setLoading(true);
    try {
      await onSubmit(nps, comment.trim() || undefined);
      setSent(true);
      setTimeout(() => {
        setVisible(false);
        setSent(false);
        setNps(null);
        setComment('');
      }, 1500);
    } catch (e) {
      // Show error in production
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Give feedback or rate your experience"
        >
          <Text style={styles.fabText}>Feedback</Text>
        </TouchableOpacity>
        <Modal visible={visible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.title}>How likely are you to recommend Buffr?</Text>
              <View style={styles.npsRow}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.npsCell, nps === v && styles.npsCellSelected]}
                    onPress={() => setNps(v)}
                  >
                    <Text style={styles.npsCellText}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {nps !== null && (
                <Text style={styles.npsLabel}>{NPS_LABELS[nps] || ''}</Text>
              )}
              <TextInput
                style={styles.comment}
                placeholder="Optional: tell us more"
                placeholderTextColor="#94a3b8"
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={500}
              />
              {loading ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : sent ? (
                <Text style={styles.thankYou}>Thank you!</Text>
              ) : (
                <TouchableOpacity
                  style={[styles.submitBtn, nps === null && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={nps === null}
                >
                  <Text style={styles.submitBtnText}>Submit</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  return (
    <View style={styles.inline}>
      <Text style={styles.inlineTitle}>Rate your experience (NPS)</Text>
      <View style={styles.npsRow}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.npsCell, nps === v && styles.npsCellSelected]}
            onPress={() => setNps(v)}
          >
            <Text style={styles.npsCellText}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.comment}
        placeholder="Optional comment"
        placeholderTextColor="#94a3b8"
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={500}
      />
      {onSubmit && (
        <TouchableOpacity
          style={[styles.submitBtn, nps === null && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={nps === null || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit feedback</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  fabText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  inline: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  inlineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  npsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  npsCell: {
    width: 28,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  npsCellSelected: {
    backgroundColor: '#3B82F6',
  },
  npsCellText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  npsLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  comment: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
    minHeight: 80,
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  thankYou: {
    fontSize: 16,
    color: '#16a34a',
    textAlign: 'center',
    marginVertical: 8,
  },
  cancelBtn: {
    marginTop: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    color: '#64748b',
  },
});
