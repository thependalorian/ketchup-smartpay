/**
 * Staff Action Logger Helper
 * 
 * Location: utils/staffActionLogger.ts
 * Purpose: Helper utility to easily log staff actions in admin endpoints
 * 
 * This wrapper makes it easy to log staff actions with proper context
 * and automatically extracts user ID, IP address, and other metadata.
 */

import { ExpoRequest } from 'expo-router/server';
import { logStaffAction, getIpAddress, getUserAgent } from './auditLogger';
import { getUserIdFromRequest } from './db';
import { log } from '@/utils/logger';

export interface StaffActionContext {
  actionType: string;
  targetEntityType: string;
  targetEntityId: string;
  location?: string;
  actionDetails?: Record<string, any>;
  authorizationLevel?: string;
  biometricVerificationRequired?: boolean;
  biometricVerificationId?: string;
}

/**
 * Log a staff action with automatic context extraction
 * 
 * Usage:
 * ```typescript
 * await logStaffActionWithContext(req, {
 *   actionType: 'pin_reset',
 *   targetEntityType: 'user',
 *   targetEntityId: userId,
 *   location: 'NamPost Branch 001',
 *   actionDetails: { reason: 'Forgotten PIN' },
 *   biometricVerificationId: 'bio-123',
 * });
 * ```
 */
export async function logStaffActionWithContext(
  req: ExpoRequest,
  context: StaffActionContext,
  success: boolean = true,
  errorMessage?: string
): Promise<void> {
  try {
    const staffId = await getUserIdFromRequest(req);
    const ipAddress = getIpAddress(req);
    const userAgent = getUserAgent(req);

    await logStaffAction({
      staff_id: staffId || 'system',
      action_type: context.actionType,
      target_entity_type: context.targetEntityType,
      target_entity_id: context.targetEntityId,
      location: context.location || 'system',
      action_details: {
        ...context.actionDetails,
        userAgent,
        timestamp: new Date().toISOString(),
      },
      authorization_level: context.authorizationLevel || 'admin',
      biometric_verification_required: context.biometricVerificationRequired || false,
      biometric_verification_id: context.biometricVerificationId || null,
      ip_address: ipAddress || null,
      success,
      error_message: errorMessage || null,
    });
  } catch (error) {
    // Non-blocking - log error but don't fail the main operation
    log.error('[Staff Action Logger] Failed to log staff action:', error);
  }
}

/**
 * Create a wrapper function for admin endpoints that automatically logs staff actions
 * 
 * Usage:
 * ```typescript
 * async function postHandler(req: ExpoRequest) {
 *   const logAction = createStaffActionLogger(req, {
 *     actionType: 'trust_account_reconcile',
 *     targetEntityType: 'trust_account',
 *   });
 *   
 *   try {
 *     // Perform action
 *     await logAction({ targetEntityId: accountId, success: true });
 *   } catch (error) {
 *     await logAction({ targetEntityId: accountId, success: false, errorMessage: error.message });
 *   }
 * }
 * ```
 */
export function createStaffActionLogger(
  req: ExpoRequest,
  baseContext: Omit<StaffActionContext, 'targetEntityId'>
) {
  return async (options: {
    targetEntityId: string;
    success: boolean;
    errorMessage?: string;
    actionDetails?: Record<string, any>;
    location?: string;
    biometricVerificationId?: string;
  }) => {
    await logStaffActionWithContext(
      req,
      {
        ...baseContext,
        targetEntityId: options.targetEntityId,
        actionDetails: { ...baseContext.actionDetails, ...options.actionDetails },
        location: options.location || baseContext.location,
        biometricVerificationId: options.biometricVerificationId || baseContext.biometricVerificationId,
      },
      options.success,
      options.errorMessage
    );
  };
}
