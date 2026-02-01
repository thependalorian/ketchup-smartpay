/**
 * Adumo Payment Hook
 * 
 * Location: hooks/useAdumoPayment.ts
 * Purpose: React hook for Adumo Online payment processing
 * 
 * Features:
 * - Process payments via Adumo
 * - Handle 3D Secure flow
 * - Manage payment states
 * - Error handling
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  initiatePayment,
  authorisePayment,
  settlePayment,
  completePaymentFlow,
  complete3DSecureFlow,
  prepare3DSecureForm,
  InitiatePaymentRequest,
  CompletePaymentFlowRequest,
  ThreeDSecureFormData,
} from '@/services/adumoService';
import { useNotifications } from '@/contexts/NotificationsContext';
import { formatCurrency } from '@/utils/formatters';

export interface UseAdumoPaymentReturn {
  processPayment: (request: CompletePaymentFlowRequest) => Promise<PaymentResult>;
  process3DSecure: (transactionId: string, amount: number, cvv?: string) => Promise<PaymentResult>;
  loading: boolean;
  error: string | null;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  statusCode: number;
  statusMessage: string;
  requires3DSecure: boolean;
  threeDSecureFormData?: ThreeDSecureFormData;
  authorisationCode?: string;
  settled: boolean;
}

export function useAdumoPayment(): UseAdumoPaymentReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const processPayment = useCallback(
    async (request: CompletePaymentFlowRequest): Promise<PaymentResult> => {
      setLoading(true);
      setError(null);

      try {
        const result = await completePaymentFlow(request);

        if (result.success) {
          addNotification({
            type: 'transaction',
            title: 'Payment Successful',
            message: `Payment of ${formatCurrency(request.amount)} processed successfully`,
            icon: 'check-circle',
            priority: 'high',
          });
        } else if (result.requires3DSecure) {
          // 3D Secure required - return form data for user to complete
          return result;
        } else {
          // Payment failed
          addNotification({
            type: 'system',
            title: 'Payment Failed',
            message: result.statusMessage || 'Payment could not be processed',
            icon: 'exclamation-circle',
            priority: 'high',
          });
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Payment processing failed';
        setError(errorMessage);

        addNotification({
          type: 'system',
          title: 'Payment Error',
          message: errorMessage,
          icon: 'exclamation-circle',
          priority: 'high',
        });

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addNotification]
  );

  const process3DSecure = useCallback(
    async (transactionId: string, amount: number, cvv?: string): Promise<PaymentResult> => {
      setLoading(true);
      setError(null);

      try {
        const result = await complete3DSecureFlow(transactionId, amount, cvv);

        if (result.success) {
          addNotification({
            type: 'transaction',
            title: 'Payment Successful',
            message: `Payment of ${formatCurrency(amount)} processed successfully`,
            icon: 'check-circle',
            priority: 'high',
          });
        } else {
          addNotification({
            type: 'system',
            title: 'Payment Failed',
            message: result.statusMessage || '3D Secure authentication failed',
            icon: 'exclamation-circle',
            priority: 'high',
          });
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '3D Secure processing failed';
        setError(errorMessage);

        addNotification({
          type: 'system',
          title: 'Payment Error',
          message: errorMessage,
          icon: 'exclamation-circle',
          priority: 'high',
        });

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addNotification]
  );

  return {
    processPayment,
    process3DSecure,
    loading,
    error,
  };
}
