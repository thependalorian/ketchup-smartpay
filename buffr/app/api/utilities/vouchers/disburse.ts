/**
 * Voucher Disbursement API Route
 * 
 * Location: app/api/utilities/vouchers/disburse.ts
 * Purpose: Receive vouchers from Ketchup SmartPay (real-time) or batch disbursement (admin)
 * 
 * Two Modes:
 * 1. **Real-Time SmartPay Integration** (Priority 3 - Critical Foundation):
 *    - Receives vouchers from Ketchup SmartPay system via real-time API
 *    - Validates beneficiary data against SmartPay database
 *    - Generates NamQR codes (Purpose Code 18)
 *    - Sends real-time response to SmartPay
 *    - Delivers vouchers to recipients via Buffr app
 * 
 * 2. **Admin Batch Disbursement**:
 *    - Admin/system use only
 *    - Batch voucher creation from Ministry of Finance or other issuers
 *    - CSV batch upload support
 * 
 * Compliance: Payment System Management Act, PSD-1/PSD-3
 * Integration: Ketchup SmartPay (real-time), Ministry of Finance API, CSV batch upload
 */

import { ExpoRequest } from 'expo-router/server';
import { query, queryOne, getUserIdFromRequest } from '@/utils/db';
import { isAdmin } from '@/utils/adminAuth';
import { sendPushNotification } from '@/utils/sendPushNotification';
import { sendVoucherSMS } from '@/utils/sendSMS';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { logVoucherOperation, logAPISyncOperation, generateRequestId, getIpAddress } from '@/utils/auditLogger';
import { ketchupSmartPayService } from '@/services/ketchupSmartPayService';
import { generateVoucherNamQR } from '@/utils/voucherNamQR';
import { fineractService } from '@/services/fineractService';
import { log } from '@/utils/logger';

/**
 * POST /api/utilities/vouchers/disburse
 * 
 * Body (Real-Time SmartPay Mode):
 * - source: 'smartpay' (indicates real-time SmartPay call)
 * - beneficiary_id: SmartPay beneficiary ID (required for SmartPay mode)
 * - voucher: Single voucher object
 *   - amount: Voucher amount
 *   - grant_type: Grant type (e.g., 'old_age', 'disability')
 *   - batch_id: Batch identifier from SmartPay
 *   - expiry_date: Expiry date (ISO format)
 *   - issuer: Issuer name (e.g., 'Ministry of Finance')
 *   - verification_required: Whether biometric/ID verification required
 *   - metadata: Additional data
 * 
 * Body (Admin Batch Mode):
 * - source: 'admin' or omitted (defaults to admin mode)
 * - batchId: Batch identifier from issuer
 * - vouchers: Array of voucher objects
 *   - userId: User ID (phone number or external_id)
 *   - type: 'government', 'merchant', 'corporate'
 *   - title: Voucher title
 *   - description: Voucher description
 *   - amount: Voucher amount
 *   - expiryDate: Expiry date (ISO format)
 *   - issuer: Issuer name (e.g., 'Ministry of Finance')
 *   - grantType: For government vouchers (e.g., 'old_age', 'disability')
 *   - verificationRequired: Whether biometric/ID verification required
 *   - metadata: Additional data
 */
async function postHandler(req: ExpoRequest) {
  const requestId = generateRequestId();
  const ipAddress = getIpAddress(req);
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { source, beneficiary_id, voucher, batchId, vouchers } = body;

    // Determine mode: Real-Time SmartPay or Admin Batch
    const isSmartPayMode = source === 'smartpay' && beneficiary_id && voucher;

    if (isSmartPayMode) {
      // ========================================================================
      // REAL-TIME SMARTPAY MODE (Priority 3 - Critical Foundation)
      // ========================================================================
      return await handleSmartPayDisbursement(req, body, requestId, ipAddress, startTime);
    } else {
      // ========================================================================
      // ADMIN BATCH MODE (Existing functionality)
      // ========================================================================
      // Require admin authentication for batch mode
      const userId = await getUserIdFromRequest(req);
      if (!userId) {
        return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
      }

      const authorized = await isAdmin(userId);
      if (!authorized) {
        return errorResponse('Unauthorized. Admin access required.', HttpStatus.FORBIDDEN);
      }

      return await handleBatchDisbursement(req, body, userId, requestId, ipAddress, startTime);
    }
  } catch (error: any) {
    log.error('Error in voucher disbursement:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to disburse vouchers',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Handle real-time SmartPay voucher disbursement
 */
async function handleSmartPayDisbursement(
  req: ExpoRequest,
  body: any,
  requestId: string,
  ipAddress: string | undefined,
  startTime: number
) {
  const { beneficiary_id, voucher } = body;

  // Validate SmartPay request
  if (!beneficiary_id || !voucher || !voucher.amount) {
    return errorResponse('beneficiary_id and voucher (with amount) are required for SmartPay mode', HttpStatus.BAD_REQUEST);
  }

  // Log incoming API sync (inbound: SmartPay → Buffr)
  await logAPISyncOperation({
    direction: 'inbound',
    endpoint: '/api/utilities/vouchers/disburse',
    method: 'POST',
    request_payload: { beneficiary_id, voucher: { ...voucher, amount: '[REDACTED]' } }, // Sanitize amount in log
    response_payload: null, // Will be set after processing
    status_code: null,
    response_time_ms: null,
    success: false, // Will be updated
    beneficiary_id,
    request_id: requestId,
  }).catch(err => log.error('Failed to log inbound API sync:', err));

  try {
    // 1. Verify beneficiary exists in SmartPay system
    const beneficiaryResult = await ketchupSmartPayService.verifyBeneficiary(beneficiary_id, requestId);

    if (!beneficiaryResult.success || !beneficiaryResult.data?.verified) {
      const responseTime = Date.now() - startTime;
      await logAPISyncOperation({
        direction: 'inbound',
        endpoint: '/api/utilities/vouchers/disburse',
        method: 'POST',
        request_payload: { beneficiary_id },
        response_payload: { error: 'Beneficiary not found or inactive' },
        status_code: 404,
        response_time_ms: responseTime,
        success: false,
        error_message: beneficiaryResult.error || 'Beneficiary not found or inactive',
        beneficiary_id,
        request_id: requestId,
      }).catch(() => {});

      return errorResponse(
        beneficiaryResult.error || 'Beneficiary not found or inactive in SmartPay system',
        HttpStatus.NOT_FOUND
      );
    }

    const beneficiary = beneficiaryResult.data.beneficiary;

    // 2. Find or create user in Buffr system
    let user = await queryOne<{ id: string; phone_number: string }>(
      `SELECT id, phone_number FROM users 
       WHERE phone_number = $1 OR external_id = $2 
       LIMIT 1`,
      [beneficiary.phone_number, beneficiary_id]
    );

    if (!user) {
      // Create user account if doesn't exist
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Encrypt national_id if provided
      let encryptedNationalId: {
        national_id_encrypted: string;
        national_id_iv: string;
        national_id_tag: string;
        national_id_hash: string;
        national_id_salt: string;
      } | null = null;
      
      if (beneficiary.national_id) {
        const { prepareEncryptedNationalId } = await import('@/utils/encryptedFields');
        encryptedNationalId = prepareEncryptedNationalId(beneficiary.national_id);
      }
      
      await query(
        `INSERT INTO users (
          id, phone_number, first_name, last_name, full_name, external_id, is_verified,
          ${encryptedNationalId ? 'national_id_encrypted, national_id_iv, national_id_tag, national_id_hash, national_id_salt,' : ''}
          created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          ${encryptedNationalId ? '$8, $9, $10, $11, $12,' : ''}
          NOW()
        )`,
        encryptedNationalId
          ? [
              newUserId,
              beneficiary.phone_number,
              beneficiary.first_name,
              beneficiary.last_name,
              `${beneficiary.first_name} ${beneficiary.last_name}`,
              beneficiary_id,
              beneficiary.biometric_enrolled,
              encryptedNationalId.national_id_encrypted,
              encryptedNationalId.national_id_iv,
              encryptedNationalId.national_id_tag,
              encryptedNationalId.national_id_hash,
              encryptedNationalId.national_id_salt,
            ]
          : [
              newUserId,
              beneficiary.phone_number,
              beneficiary.first_name,
              beneficiary.last_name,
              `${beneficiary.first_name} ${beneficiary.last_name}`,
              beneficiary_id,
              beneficiary.biometric_enrolled,
            ]
      );

      user = { id: newUserId, phone_number: beneficiary.phone_number };

      // Notify SmartPay of account creation
      await ketchupSmartPayService.notifyAccountCreation(
        beneficiary_id,
        newUserId,
        beneficiary.phone_number,
        requestId
      ).catch(err => {
        log.error('Failed to notify SmartPay of account creation:', err);
        // Don't fail voucher issuance if notification fails
      });
    }

    // 2a. Ensure Fineract client exists (get or create)
    let fineractClient;
    try {
      // Try to get existing client by external ID (Buffr user ID)
      fineractClient = await fineractService.getClientByExternalId(user.id, { requestId, userId: user.id });
      
      if (!fineractClient) {
        // Create Fineract client if doesn't exist
        fineractClient = await fineractService.createClient({
          firstname: beneficiary.first_name,
          lastname: beneficiary.last_name,
          mobileNo: beneficiary.phone_number,
          dateOfBirth: beneficiary.date_of_birth,
          externalId: user.id, // Buffr user ID as external ID
        }, { requestId, userId: user.id });

        // Log sync status
        await query(
          `INSERT INTO fineract_sync_logs (entity_type, entity_id, fineract_id, sync_status, synced_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (entity_type, entity_id) 
           DO UPDATE SET fineract_id = $3, sync_status = $4, synced_at = NOW()`,
          ['client', user.id, fineractClient.id, 'synced']
        ).catch(err => log.error('Failed to log Fineract client sync:', err));
      }
    } catch (error: any) {
      log.error('Failed to ensure Fineract client exists:', error);
      // Continue with voucher creation - Fineract integration is optional for now
      // In production, you may want to fail here or retry
    }

    // 3. Generate voucher code
    const voucherCode = `VCH-${voucher.batch_id}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 4. Generate NamQR code (Purpose Code 18 - Government Voucher)
    // Note: We'll generate after voucher creation since we need voucherId
    let namqrCode: string | null = null;

    // 5. Create voucher in Buffr database
    const voucherResult = await query<{ id: string }>(
      `INSERT INTO vouchers (
        user_id, type, title, description, amount, status,
        expiry_date, issuer, voucher_code, batch_id, grant_type,
        verification_required, metadata, smartpay_beneficiary_id, namqr_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id`,
      [
        user.id,
        'government',
        voucher.title || `${voucher.grant_type || 'Government'} Grant Voucher`,
        voucher.description || null,
        voucher.amount,
        'available',
        voucher.expiry_date ? new Date(voucher.expiry_date) : null,
        voucher.issuer || 'Ministry of Finance',
        voucherCode,
        voucher.batch_id,
        voucher.grant_type || null,
        voucher.verification_required || false,
        JSON.stringify(voucher.metadata || {}),
        beneficiary_id,
        namqrCode,
      ]
    );

    if (voucherResult.length === 0) {
      throw new Error('Failed to create voucher');
    }

    const voucherId = voucherResult[0].id;

    // 5a. Generate NamQR code now that we have voucherId
    try {
      namqrCode = generateVoucherNamQR({
        voucherId,
        voucherCode,
        amount: voucher.amount,
        currency: '516', // NAD
        issuer: voucher.issuer || 'Ministry of Finance',
        grantType: voucher.grant_type,
        beneficiaryName: `${beneficiary.first_name} ${beneficiary.last_name}`,
        beneficiaryCity: beneficiary.address?.split(',')[0] || 'Windhoek', // Extract city from address or default
        expiryDate: voucher.expiry_date ? new Date(voucher.expiry_date) : undefined,
        tokenVaultId: `voucher_${voucherId}`, // Token Vault ID for voucher
        isDynamic: true,
      });

      // Update voucher with NamQR code
      await query(
        'UPDATE vouchers SET namqr_code = $1 WHERE id = $2',
        [namqrCode, voucherId]
      );
    } catch (error) {
      log.error('Failed to generate NamQR code:', error);
      // Continue without QR code - can be generated later
    }

    // 5b. Create voucher in Fineract (fineract-voucher module)
    let fineractVoucherId: number | null = null;
    if (fineractClient) {
      try {
        const externalId = `buffr_voucher_${voucherId}`;
        const issuedDate = new Date().toISOString().split('T')[0];
        const expiryDate = voucher.expiry_date ? new Date(voucher.expiry_date).toISOString().split('T')[0] : issuedDate;

        const fineractVoucher = await fineractService.createVoucher({
          clientId: fineractClient.id,
          amount: voucher.amount,
          currencyCode: 'NAD',
          issuedDate,
          expiryDate,
          externalId, // Buffr voucher ID as external ID
          namqrData: namqrCode || undefined,
          tokenVaultId: `voucher_${voucherId}`,
        }, { requestId, userId: user.id });

        fineractVoucherId = fineractVoucher.id;

        // Store voucher mapping in fineract_vouchers table
        await query(
          `INSERT INTO fineract_vouchers (
            voucher_id, fineract_voucher_id, voucher_code, status, synced_at
          ) VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (voucher_id) 
          DO UPDATE SET fineract_voucher_id = $2, voucher_code = $3, status = $4, synced_at = NOW()`,
          [
            voucherId,
            fineractVoucher.id,
            fineractVoucher.voucherCode || voucherCode,
            fineractVoucher.status?.value || 'ISSUED',
          ]
        ).catch(err => log.error('Failed to store voucher mapping:', err));

        // Log sync status
        await query(
          `INSERT INTO fineract_sync_logs (entity_type, entity_id, fineract_id, sync_status, synced_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (entity_type, entity_id) 
           DO UPDATE SET fineract_id = $3, sync_status = $4, synced_at = NOW()`,
          ['voucher', voucherId, fineractVoucher.id, 'synced']
        ).catch(err => log.error('Failed to log Fineract voucher sync:', err));
      } catch (error: any) {
        log.error('Failed to create voucher in Fineract:', error);
        // Continue - voucher created in Buffr DB, Fineract sync can be retried later
      }
    }

    // 6. Log voucher issuance (audit trail)
    await logVoucherOperation({
      voucherId,
      operationType: 'issued',
      userId: user.id,
      smartpay_beneficiary_id: beneficiary_id,
      new_status: 'available',
      amount: voucher.amount,
      metadata: {
        batch_id: voucher.batch_id,
        grant_type: voucher.grant_type,
        issuer: voucher.issuer,
        source: 'smartpay_realtime',
      },
    }).catch(err => log.error('Failed to log voucher operation:', err));

    // 7. Send push notification to user (if app installed)
    await sendPushNotification({
      userIds: user.id,
      title: '🎫 New Voucher Received!',
      body: `You have received a new ${voucher.grant_type || 'government'} voucher for N$${voucher.amount}.`,
      data: {
        type: 'voucher',
        voucherId,
        voucherType: 'government',
      },
      categoryId: 'general',
      priority: 'high'
    }).catch(err => log.error('Failed to send push notification:', err));

    // 7a. PRD FR1.4: Send SMS notification (always sent to all users, regardless of device type)
    await sendVoucherSMS(user.phone_number, {
      amount: voucher.amount,
      grantType: voucher.grant_type,
      voucherId,
      expiryDate: voucher.expiry_date ? new Date(voucher.expiry_date) : undefined,
    }).catch(err => log.error('Failed to send SMS notification:', err));

    // 8. Prepare real-time response to SmartPay
    const responseTime = Date.now() - startTime;
    const response = {
      success: true,
      voucher_id: voucherId,
      status: 'issued',
      user_id: user.id,
      phone_number: user.phone_number,
      fineract_voucher_id: fineractVoucherId, // Include Fineract voucher ID if created
      timestamp: new Date().toISOString(),
    };

    // 9. Log successful API sync (inbound)
    await logAPISyncOperation({
      direction: 'inbound',
      endpoint: '/api/utilities/vouchers/disburse',
      method: 'POST',
      request_payload: { beneficiary_id, voucher: { ...voucher, amount: '[REDACTED]' } },
      response_payload: response,
      status_code: 200,
      response_time_ms: responseTime,
      success: true,
      beneficiary_id,
      voucher_id: voucherId,
      user_id: user.id,
      request_id: requestId,
    }).catch(err => log.error('Failed to log inbound API sync:', err));

    return successResponse(response, 'Voucher issued successfully');
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log failed API sync (inbound)
    await logAPISyncOperation({
      direction: 'inbound',
      endpoint: '/api/utilities/vouchers/disburse',
      method: 'POST',
      request_payload: { beneficiary_id },
      response_payload: { error: errorMessage },
      status_code: 500,
      response_time_ms: responseTime,
      success: false,
      error_message: errorMessage,
      beneficiary_id,
      request_id: requestId,
    }).catch(() => {});

    return errorResponse(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Handle admin batch voucher disbursement (existing functionality)
 */
async function handleBatchDisbursement(
  req: ExpoRequest,
  body: any,
  adminUserId: string,
  requestId: string,
  ipAddress: string | undefined,
  startTime: number
) {
    const { batchId, vouchers } = body;

    if (!batchId || !Array.isArray(vouchers) || vouchers.length === 0) {
      return errorResponse('batchId and vouchers array (non-empty) are required', HttpStatus.BAD_REQUEST);
    }

    // Validate vouchers
    for (const voucher of vouchers) {
      if (!voucher.userId || !voucher.type || !voucher.title || !voucher.amount) {
        return errorResponse('Each voucher must have userId, type, title, and amount', HttpStatus.BAD_REQUEST);
      }
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      voucherIds: [] as string[],
    };

    // Disburse vouchers in batch
    for (const voucherData of vouchers) {
      try {
        // Find user by phone number or external_id
        const user = await query<{ id: string }>(
          `SELECT id FROM users 
           WHERE phone_number = $1 OR external_id = $1 OR id = $1 
           LIMIT 1`,
          [voucherData.userId]
        );

        if (user.length === 0) {
          results.failed++;
          results.errors.push(`User not found: ${voucherData.userId}`);
          continue;
        }

        const userId = user[0].id;

        // Generate unique voucher code
        const voucherCode = `VCH-${batchId}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // Insert voucher
        const result = await query<{ id: string }>(
          `INSERT INTO vouchers (
            user_id, type, title, description, amount, status,
            expiry_date, issuer, voucher_code, batch_id, grant_type,
            verification_required, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING id`,
          [
            userId,
            voucherData.type,
            voucherData.title,
            voucherData.description || null,
            voucherData.amount,
            'available',
            voucherData.expiryDate ? new Date(voucherData.expiryDate) : null,
            voucherData.issuer || 'Ministry of Finance',
            voucherCode,
            batchId,
            voucherData.grantType || null,
            voucherData.verificationRequired || false,
            JSON.stringify(voucherData.metadata || {}),
          ]
        );

        if (result.length > 0) {
          results.success++;
          results.voucherIds.push(result[0].id);

          // Notify user of new voucher (push notification if app installed)
          await sendPushNotification({
            userIds: userId,
            title: '🎫 New Voucher Received!',
            body: `You have received a new ${voucherData.title} for ${voucherData.amount}.`,
            data: {
              type: 'voucher',
              voucherId: result[0].id,
              voucherType: voucherData.type
            },
            categoryId: 'general',
            priority: 'high'
          }).catch(err => log.error('Failed to send push notification:', err));

          // PRD FR1.4: Send SMS notification (always sent to all users)
          const userPhone = await query<{ phone_number: string }>(
            'SELECT phone_number FROM users WHERE id = $1',
            [userId]
          );
          if (userPhone.length > 0) {
            await sendVoucherSMS(userPhone[0].phone_number, {
              amount: voucherData.amount,
              grantType: voucherData.grantType,
              voucherId: result[0].id,
              expiryDate: voucherData.expiryDate ? new Date(voucherData.expiryDate) : undefined,
            }).catch(err => log.error('Failed to send SMS notification:', err));
          }
        } else {
          results.failed++;
          results.errors.push(`Failed to create voucher for user: ${voucherData.userId}`);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Error for user ${voucherData.userId}: ${error.message}`);
      }
    }

    return successResponse({
      batchId,
      total: vouchers.length,
      successful: results.success,
      failed: results.failed,
      voucherIds: results.voucherIds,
      errors: results.errors.length > 0 ? results.errors : undefined,
    }, `Disbursed ${results.success} vouchers, ${results.failed} failed`);
}

export const POST = secureAuthRoute(RATE_LIMITS.payment, postHandler);

