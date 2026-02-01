/**
 * Voucher Redemption API Route
 * 
 * Location: app/api/utilities/vouchers/redeem.ts
 * Purpose: Redeem vouchers via multiple methods (wallet, cash-out, bank transfer)
 * 
 * Redemption Methods:
 * - wallet: Transfer voucher value to Buffr wallet (instant, via NamPay)
 * - cash_out: Cash out at NamPost/retail partner (requires in-person verification)
 * - bank_transfer: Transfer to bank account (via NamPay)
 * - merchant_payment: Use voucher for payment at participating merchant
 * 
 * Compliance: Payment System Management Act, PSD-1/PSD-3
 * Integration: NamPay for instant settlement
 */

import { ExpoRequest } from 'expo-router/server';
import { query, queryOne, getUserIdFromRequest } from '@/utils/db';
import { nampayService } from '@/services/nampayService';
import { sendPushNotification } from '@/utils/sendPushNotification';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { logVoucherOperation, generateRequestId } from '@/utils/auditLogger';
import { getIpAddress, getUserAgent } from '@/utils/auditLogger';
import { ketchupSmartPayService } from '@/services/ketchupSmartPayService';
import { fineractService } from '@/services/fineractService';
import { log } from '@/utils/logger';
import { prepareEncryptedBankAccount } from '@/utils/encryptedFields';

async function postHandler(req: ExpoRequest) {
  try {
    const body = await req.json();
    const { voucherId, redemptionMethod, redemptionPoint, bankAccountNumber, bankName, verificationToken } = body;

    if (!voucherId || !redemptionMethod) {
      return errorResponse('voucherId and redemptionMethod are required', HttpStatus.BAD_REQUEST);
    }

    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    // PSD-12 Compliance: Require 2FA verification for all voucher redemptions
    if (!verificationToken) {
      return errorResponse(
        '2FA verification required. Please verify your PIN or biometric before redeeming.',
        HttpStatus.UNAUTHORIZED
      );
    }

    // Verify the verificationToken against Redis cache (PSD-12 Compliance)
    const { twoFactorTokens } = await import('@/utils/redisClient');
    const tokenData = await twoFactorTokens.verify(userId, verificationToken);
    
    if (!tokenData) {
      return errorResponse(
        'Invalid or expired 2FA verification token. Please verify your PIN or biometric again.',
        HttpStatus.UNAUTHORIZED
      );
    }

    // Validate redemption method
    const validMethods = ['wallet', 'cash_out', 'bank_transfer', 'merchant_payment'];
    if (!validMethods.includes(redemptionMethod)) {
      return errorResponse(`Invalid redemption method. Use: ${validMethods.join(', ')}`, HttpStatus.BAD_REQUEST);
    }

    // Get voucher (including SmartPay beneficiary ID for real-time sync)
    const voucher = await queryOne<{
      id: string;
      user_id: string;
      amount: number;
      status: string;
      expiry_date: Date | null;
      verification_required: boolean;
      type: string;
      smartpay_beneficiary_id: string | null;
    }>(
      'SELECT id, user_id, amount, status, expiry_date, verification_required, type, smartpay_beneficiary_id FROM vouchers WHERE id = $1',
      [voucherId]
    );

    if (!voucher) {
      return errorResponse('Voucher not found', HttpStatus.NOT_FOUND);
    }

    // Verify ownership
    if (voucher.user_id !== userId) {
      return errorResponse('Unauthorized', HttpStatus.FORBIDDEN);
    }

    // Check status
    if (voucher.status !== 'available') {
      return errorResponse(`Voucher is ${voucher.status}`, HttpStatus.BAD_REQUEST);
    }

    // Check expiry
    if (voucher.expiry_date && new Date(voucher.expiry_date) < new Date()) {
      // Auto-expire
      await query(
        'UPDATE vouchers SET status = $1 WHERE id = $2',
        ['expired', voucherId]
      );
      return errorResponse('Voucher has expired', HttpStatus.BAD_REQUEST);
    }

    // Get Fineract voucher mapping (if exists)
    const voucherMapping = await queryOne<{
      fineract_voucher_id: number;
      voucher_code: string;
    }>(
      'SELECT fineract_voucher_id, voucher_code FROM fineract_vouchers WHERE voucher_id = $1',
      [voucherId]
    );

    // Get Fineract client for user
    let fineractClient = await fineractService.getClientByExternalId(userId, { userId });
    if (!fineractClient) {
      // Try to get user details to create Fineract client
      const userDetails = await queryOne<{
        first_name: string;
        last_name: string;
        phone_number: string;
      }>(
        'SELECT first_name, last_name, phone_number FROM users WHERE id = $1',
        [userId]
      );
      
      if (userDetails) {
        fineractClient = await fineractService.createClient({
          firstname: userDetails.first_name,
          lastname: userDetails.last_name,
          mobileNo: userDetails.phone_number,
          externalId: userId,
        }, { userId });
      }
    }

    // Handle different redemption methods
    switch (redemptionMethod) {
      case 'wallet': {
        // Transfer to Fineract wallet (instant)
        // Get or create Fineract wallet for user
        let fineractWallet = fineractClient 
          ? await fineractService.getWalletByExternalId(userId, { userId })
          : null;

        if (!fineractWallet && fineractClient) {
          // Create Fineract wallet if doesn't exist
          fineractWallet = await fineractService.createWallet({
            clientId: fineractClient.id,
            externalId: userId, // Buffr user ID as external ID
            ussdEnabled: true, // Enable USSD access
          }, { userId });

          // Store wallet mapping
          await query(
            `INSERT INTO fineract_accounts (
              user_id, fineract_client_id, fineract_wallet_id, wallet_no, status
            ) VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id) 
            DO UPDATE SET fineract_wallet_id = $3, wallet_no = $4, status = $5`,
            [
              userId,
              fineractClient.id,
              fineractWallet.id,
              fineractWallet.walletNumber,
              'ACTIVE',
            ]
          ).catch(err => log.error('Failed to store wallet mapping:', err));
        }

        if (!fineractWallet) {
          return errorResponse('Failed to get or create Fineract wallet. Please try again.', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Generate NamPay reference
        const nampayReference = `VCH-${Date.now()}-${voucherId.substring(0, 8).toUpperCase()}`;
        const requestId = generateRequestId();

        // Start transaction
        await query('BEGIN');

        try {
          // 1. Redeem voucher in Fineract (debits trust account automatically)
          if (voucherMapping?.fineract_voucher_id) {
            try {
              const redemptionDate = new Date().toISOString().split('T')[0];
              await fineractService.redeemVoucher(
                voucherMapping.fineract_voucher_id,
                {
                  redemptionMethod: 1, // 1=QR (wallet redemption)
                  redemptionDate,
                  description: `Voucher redemption to wallet via ${redemptionPoint || 'buffr_app'}`,
                },
                { requestId, userId }
              );

              // Update voucher mapping status
              await query(
                `UPDATE fineract_vouchers 
                 SET status = 'REDEEMED', synced_at = NOW()
                 WHERE voucher_id = $1`,
                [voucherId]
              );

              // Update SmartPay status in Fineract (if voucher has SmartPay beneficiary ID)
              if (voucher.smartpay_beneficiary_id) {
                try {
                  await fineractService.updateSmartPayStatus(
                    voucherMapping.fineract_voucher_id,
                    {
                      smartPayStatus: 'REDEEMED',
                      description: `Voucher redeemed via ${redemptionMethod}`,
                    },
                    { requestId, userId }
                  );
                } catch (error: any) {
                  log.error('Failed to update SmartPay status in Fineract:', error);
                  // Continue - SmartPay status sync can be retried
                }
              }
            } catch (error: any) {
              log.error('Failed to redeem voucher in Fineract:', error);
              // Continue with Buffr DB redemption - Fineract sync can be retried
            }
          }

          // 2. Deposit to Fineract wallet (instant credit)
          try {
            const transactionDate = new Date().toISOString().split('T')[0];
            await fineractService.depositToWallet(
              fineractWallet.id,
              {
                amount: voucher.amount,
                transactionDate,
                reference: nampayReference,
                description: `Voucher redemption: ${voucher.type}`,
                channel: 'mobile_app',
              },
              { requestId, userId }
            );
          } catch (error: any) {
            log.error('Failed to deposit to Fineract wallet:', error);
            // Fallback to Buffr DB wallet if Fineract fails
            const buffrWallet = await queryOne<{ id: string }>(
              'SELECT id FROM wallets WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1',
              [userId]
            );
            
            if (buffrWallet) {
              await query(
                'UPDATE wallets SET balance = balance + $1 WHERE id = $2',
                [voucher.amount, buffrWallet.id]
              );
            }
          }

          // 3. Update voucher status in Buffr DB
          await query(
            `UPDATE vouchers 
             SET status = 'redeemed',
                 redeemed_at = NOW(),
                 redemption_method = 'wallet',
                 redemption_point = $1,
                 nampay_reference = $2,
                 nampay_settled = TRUE,
                 nampay_settled_at = NOW()
             WHERE id = $3`,
            [redemptionPoint || 'buffr_app', nampayReference, voucherId]
          );

          // 4. Mark voucher as redeemed after warning (for analytics)
          try {
            const { voucherExpiryService } = await import('@/services/voucherExpiryService');
            await voucherExpiryService.markVoucherRedeemedAfterWarning(voucherId);
          } catch (error: any) {
            log.debug('Failed to mark voucher redeemed after warning (non-critical):', error);
          }

          // 5. Create transaction record in Buffr DB (for analytics)
          await query(
            `INSERT INTO transactions (
              user_id, wallet_id, type, amount, status, description, category
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              userId,
              fineractWallet.id.toString(), // Store Fineract wallet ID as reference
              'received',
              voucher.amount,
              'completed',
              `Voucher redemption: ${voucher.type}`,
              'voucher',
            ]
          );

          // 5. Create redemption audit record
          await query(
            `INSERT INTO voucher_redemptions (
              voucher_id, user_id, redemption_method, redemption_point, amount,
              nampay_reference, status, completed_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [
              voucherId,
              userId,
              'wallet',
              redemptionPoint || 'buffr_app',
              voucher.amount,
              nampayReference,
              'completed',
            ]
          );

          await query('COMMIT');

          // Log voucher redemption operation (audit trail)
          const ipAddress = getIpAddress(req);
          
          await logVoucherOperation({
            voucherId,
            operationType: 'redeemed',
            userId,
            smartpay_beneficiary_id: voucher.smartpay_beneficiary_id || '',
            new_status: 'redeemed',
            amount: voucher.amount,
            redemption_method: 'wallet',
            settlement_reference: nampayReference,
            metadata: {
              walletId: wallet.id,
              redemptionPoint: 'buffr_app',
            },
          }).catch(err => log.error('Failed to log voucher operation:', err));

          // Real-time status sync to SmartPay (if beneficiary ID exists)
          if (voucher.smartpay_beneficiary_id) {
            await ketchupSmartPayService.updateVoucherStatusWithRetry({
              voucher_id: voucherId,
              status: 'redeemed',
              beneficiary_id: voucher.smartpay_beneficiary_id,
              amount: voucher.amount,
              redemption_method: 'wallet',
              settlement_reference: nampayReference,
              timestamp: new Date().toISOString(),
            }, requestId).catch(err => {
              log.error('Failed to sync voucher status to SmartPay:', err);
              // Don't fail redemption if sync fails - will retry later
            });
          }

          // Notify user of successful redemption
          await sendPushNotification({
            userIds: userId,
            title: '✅ Voucher Redeemed',
            body: `Your ${voucher.amount} voucher has been successfully redeemed to your wallet.`,
            data: { type: 'transaction', voucherId },
            categoryId: 'transaction',
            priority: 'high'
          }).catch(err => log.error('Failed to send redemption notification:', err));

          return createdResponse({
            voucherId,
            amount: parseFloat(voucher.amount.toString()),
            nampayReference,
            fineractWalletId: fineractWallet.id,
            walletNumber: fineractWallet.walletNumber,
          }, `/api/vouchers/${voucherId}`, 'Voucher redeemed successfully. Funds added to wallet.');
        } catch (error) {
          await query('ROLLBACK');
          throw error;
        }
      }

      case 'cash_out': {
        // Cash out at NamPost/retail partner (requires in-person verification)
        if (!redemptionPoint) {
          return errorResponse(
            'redemptionPoint is required for cash_out (e.g., nampost_branch, shoprite, model)',
            HttpStatus.BAD_REQUEST
          );
        }

        // Generate voucher code for in-person redemption
        const voucherCode = `VCH-${voucherId.substring(0, 8).toUpperCase()}-${Date.now().toString().slice(-6)}`;
        const requestId = generateRequestId();

        // Redeem voucher in Fineract (if mapping exists)
        if (voucherMapping?.fineract_voucher_id) {
          try {
            const redemptionDate = new Date().toISOString().split('T')[0];
            await fineractService.redeemVoucher(
              voucherMapping.fineract_voucher_id,
              {
                redemptionMethod: 4, // 4=Cash Out
                redemptionDate,
                description: `Cash-out at ${redemptionPoint}`,
              },
              { requestId, userId }
            );

            // Update voucher mapping status
            await query(
              `UPDATE fineract_vouchers 
               SET status = 'REDEEMED', synced_at = NOW()
               WHERE voucher_id = $1`,
              [voucherId]
            );
          } catch (error: any) {
            log.error('Failed to redeem voucher in Fineract:', error);
            // Continue with Buffr DB redemption - Fineract sync can be retried
          }
        }

        // Update voucher with redemption method and code
        await query(
          `UPDATE vouchers 
           SET status = 'pending_settlement',
               redemption_method = 'cash_out',
               redemption_point = $1,
               voucher_code = $2
           WHERE id = $3`,
          [redemptionPoint, voucherCode, voucherId]
        );

        // Create redemption audit record
        await query(
          `INSERT INTO voucher_redemptions (
            voucher_id, user_id, redemption_method, redemption_point, amount, status
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            voucherId,
            userId,
            'cash_out',
            redemptionPoint,
            voucher.amount,
            'pending',
          ]
        );

        // Log voucher operation and sync to SmartPay
        const requestId = generateRequestId();
        await logVoucherOperation({
          voucherId,
          operationType: 'redeemed',
          userId,
          smartpay_beneficiary_id: voucher.smartpay_beneficiary_id || '',
          new_status: 'pending_settlement',
          amount: voucher.amount,
          redemption_method: 'cash_out',
          metadata: {
            redemptionPoint,
            voucherCode,
          },
        }).catch(err => log.error('Failed to log voucher operation:', err));

        // Real-time status sync to SmartPay
        if (voucher.smartpay_beneficiary_id) {
          await ketchupSmartPayService.updateVoucherStatusWithRetry({
            voucher_id: voucherId,
            status: 'pending_settlement',
            beneficiary_id: voucher.smartpay_beneficiary_id,
            amount: voucher.amount,
            redemption_method: 'cash_out',
            timestamp: new Date().toISOString(),
          }, requestId).catch(err => {
            log.error('Failed to sync voucher status to SmartPay:', err);
          });
        }

        // Notify user of cash-out preparation
        await sendPushNotification({
          userIds: userId,
          title: '💵 Cash-out Ready',
          body: `Your voucher is ready for cash-out at ${redemptionPoint}. Code: ${voucherCode}`,
          data: { type: 'transaction', voucherId, voucherCode },
          categoryId: 'transaction',
          priority: 'high'
        }).catch(err => log.error('Failed to send cash-out notification:', err));

        return createdResponse({
          voucherId,
          voucherCode,
          redemptionPoint,
          amount: parseFloat(voucher.amount.toString()),
          instructions: `Go to ${redemptionPoint} with your ID and voucher code: ${voucherCode}`,
          verificationRequired: voucher.verification_required,
        }, `/api/vouchers/${voucherId}`, 'Voucher prepared for cash-out. Present voucher code and ID at redemption point.');
      }

      case 'bank_transfer': {
        // Transfer to bank account (via NamPay)
        if (!bankAccountNumber || !bankName) {
          return errorResponse('bankAccountNumber and bankName are required for bank_transfer', HttpStatus.BAD_REQUEST);
        }

        // Generate NamPay reference
        const nampayReference = `VCH-BANK-${Date.now()}-${voucherId.substring(0, 8).toUpperCase()}`;
        const requestId = generateRequestId();

        // Redeem voucher in Fineract (if mapping exists)
        if (voucherMapping?.fineract_voucher_id) {
          try {
            const redemptionDate = new Date().toISOString().split('T')[0];
            const { encryptField } = await import('@/utils/encryptedFields');
            const bankAccountEncrypted = await encryptField(bankAccountNumber);

            await fineractService.redeemVoucher(
              voucherMapping.fineract_voucher_id,
              {
                redemptionMethod: 2, // 2=Bank Transfer
                redemptionDate,
                bankAccountEncrypted,
                description: `Bank transfer to ${bankName}`,
              },
              { requestId, userId }
            );

            // Update voucher mapping status
            await query(
              `UPDATE fineract_vouchers 
               SET status = 'REDEEMED', synced_at = NOW()
               WHERE voucher_id = $1`,
              [voucherId]
            );

            // Update SmartPay status in Fineract
            if (voucher.smartpay_beneficiary_id) {
              try {
                await fineractService.updateSmartPayStatus(
                  voucherMapping.fineract_voucher_id,
                  {
                    smartPayStatus: 'REDEEMED',
                    description: `Bank transfer to ${bankName}`,
                  },
                  { requestId, userId }
                );
              } catch (error: any) {
                log.error('Failed to update SmartPay status in Fineract:', error);
              }
            }
          } catch (error: any) {
            log.error('Failed to redeem voucher in Fineract:', error);
            // Continue with Buffr DB redemption - Fineract sync can be retried
          }
        }

        // Encrypt bank account number for database storage
        const encrypted = prepareEncryptedBankAccount(bankAccountNumber);

        // Update voucher with encrypted bank account
        await query(
          `UPDATE vouchers 
           SET status = 'pending_settlement',
               redemption_method = 'bank_transfer',
               bank_account_number_encrypted = $1,
               bank_account_number_iv = $2,
               bank_account_number_tag = $3,
               bank_name = $4,
               nampay_reference = $5
           WHERE id = $6`,
          [
            encrypted.account_number_encrypted_data,
            encrypted.account_number_iv,
            encrypted.account_number_tag,
            bankName,
            nampayReference,
            voucherId
          ]
        );

        // Create redemption audit record with encrypted bank account
        await query(
          `INSERT INTO voucher_redemptions (
            voucher_id, user_id, redemption_method, amount,
            bank_account_number_encrypted, bank_account_number_iv, bank_account_number_tag,
            bank_name, nampay_reference, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            voucherId,
            userId,
            'bank_transfer',
            voucher.amount,
            encrypted.account_number_encrypted_data,
            encrypted.account_number_iv,
            encrypted.account_number_tag,
            bankName,
            nampayReference,
            'pending',
          ]
        );

        // Log voucher operation and sync to SmartPay
        await logVoucherOperation({
          voucherId,
          operationType: 'redeemed',
          userId,
          smartpay_beneficiary_id: voucher.smartpay_beneficiary_id || '',
          new_status: 'pending_settlement',
          amount: voucher.amount,
          redemption_method: 'bank_transfer',
          settlement_reference: nampayReference,
          metadata: {
            // Don't store plain text bank account in metadata - it's encrypted in database
            bankName,
            hasBankAccount: true,
            fineractVoucherId: voucherMapping?.fineract_voucher_id,
          },
        }).catch(err => log.error('Failed to log voucher operation:', err));

        // Real-time status sync to SmartPay
        if (voucher.smartpay_beneficiary_id) {
          await ketchupSmartPayService.updateVoucherStatusWithRetry({
            voucher_id: voucherId,
            status: 'pending_settlement',
            beneficiary_id: voucher.smartpay_beneficiary_id,
            amount: voucher.amount,
            redemption_method: 'bank_transfer',
            settlement_reference: nampayReference,
            timestamp: new Date().toISOString(),
          }, requestId).catch(err => {
            log.error('Failed to sync voucher status to SmartPay:', err);
          });
        }

        // Initiate NamPay transfer
        const nampayResponse = await nampayService.initiateTransfer({
          amount: voucher.amount,
          currency: 'NAD',
          recipientName: 'Bank Transfer',
          bankName: bankName,
          accountNumber: bankAccountNumber,
          reference: nampayReference,
          type: 'bank_transfer'
        });

        if (!nampayResponse.success) {
          return errorResponse(`NamPay transfer failed: ${nampayResponse.error || 'Unknown error'}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Notify user of successful bank transfer initiation
        await sendPushNotification({
          userIds: userId,
          title: '🏦 Bank Transfer Initiated',
          body: `Your ${voucher.amount} voucher transfer to ${bankName} has been initiated.`,
          data: { type: 'transaction', voucherId, nampayReference },
          categoryId: 'transaction',
          priority: 'high'
        }).catch(err => log.error('Failed to send bank transfer notification:', err));

        return createdResponse({
          voucherId,
          amount: parseFloat(voucher.amount.toString()),
          bankAccountNumber: '****', // Don't return full account number in response
          bankName,
          nampayReference,
          estimatedArrival: '1-2 business days',
        }, `/api/vouchers/${voucherId}`, 'Bank transfer initiated. Funds will be transferred within 1-2 business days.');
      }

      case 'merchant_payment': {
        // Use voucher for payment at participating merchant
        if (!redemptionPoint) {
          return errorResponse('redemptionPoint (merchant_id) is required for merchant_payment', HttpStatus.BAD_REQUEST);
        }

        // Generate NamPay reference
        const nampayReference = `VCH-MERCHANT-${Date.now()}-${voucherId.substring(0, 8).toUpperCase()}`;

        // Update voucher
        await query(
          `UPDATE vouchers 
           SET status = 'pending_settlement',
               redemption_method = 'merchant_payment',
               redemption_point = $1,
               nampay_reference = $2
           WHERE id = $3`,
          [redemptionPoint, nampayReference, voucherId]
        );

        // Create redemption audit record
        await query(
          `INSERT INTO voucher_redemptions (
            voucher_id, user_id, redemption_method, redemption_point, amount,
            nampay_reference, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            voucherId,
            userId,
            'merchant_payment',
            redemptionPoint,
            voucher.amount,
            nampayReference,
            'pending',
          ]
        );

        // Log voucher operation and sync to SmartPay
        const requestId = generateRequestId();
        await logVoucherOperation({
          voucherId,
          operationType: 'redeemed',
          userId,
          smartpay_beneficiary_id: voucher.smartpay_beneficiary_id || '',
          new_status: 'pending_settlement',
          amount: voucher.amount,
          redemption_method: 'merchant_payment',
          settlement_reference: nampayReference,
          metadata: {
            merchantId: redemptionPoint,
          },
        }).catch(err => log.error('Failed to log voucher operation:', err));

        // Real-time status sync to SmartPay
        if (voucher.smartpay_beneficiary_id) {
          await ketchupSmartPayService.updateVoucherStatusWithRetry({
            voucher_id: voucherId,
            status: 'pending_settlement',
            beneficiary_id: voucher.smartpay_beneficiary_id,
            amount: voucher.amount,
            redemption_method: 'merchant_payment',
            settlement_reference: nampayReference,
            timestamp: new Date().toISOString(),
          }, requestId).catch(err => {
            log.error('Failed to sync voucher status to SmartPay:', err);
          });
        }

        // Notify user of merchant payment preparation
        await sendPushNotification({
          userIds: userId,
          title: '🛒 Merchant Payment Ready',
          body: `Your voucher is ready for payment at ${redemptionPoint}.`,
          data: { type: 'transaction', voucherId, nampayReference },
          categoryId: 'transaction',
          priority: 'high'
        }).catch(err => log.error('Failed to send merchant payment notification:', err));

        return createdResponse({
          voucherId,
          amount: parseFloat(voucher.amount.toString()),
          merchantId: redemptionPoint,
          nampayReference,
        }, `/api/vouchers/${voucherId}`, 'Voucher prepared for merchant payment. Present at POS or scan QR code.');
      }

      default:
        return errorResponse('Invalid redemption method', HttpStatus.BAD_REQUEST);
    }
  } catch (error: any) {
    log.error('Error redeeming voucher:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to redeem voucher',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureAuthRoute(RATE_LIMITS.payment, postHandler);

