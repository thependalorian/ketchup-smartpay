/**
 * Two-Factor Authentication Service
 *
 * Purpose: Implement 2FA for all payment transactions
 * Regulation: PSD-12 Section 12.2 - Safety Standards
 * Location: backend/src/services/compliance/TwoFactorAuthService.ts
 *
 * Requirements:
 * - Two-factor authentication required for EVERY payment transaction
 * - Prior to effecting any payment during payment initiation
 * - Must be implemented on payment instruments, websites, and mobile applications
 *
 * PSD-12 Section 12.2: "Prior to the effecting of any payment transaction during
 * payment initiation on a payment instrument, website, and mobile application,
 * two-factor authentication must be required. This means two-factor authentication
 * is required for every payment."
 */
import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
const sql = neon(process.env.DATABASE_URL);
export class TwoFactorAuthService {
    static OTP_LENGTH = 6;
    static OTP_EXPIRY_MINUTES = 5;
    static MAX_ATTEMPTS = 3;
    /**
     * Generate and send OTP
     * PSD-12 Section 12.2: Required before payment transaction
     */
    static async generateOTP(request) {
        try {
            // Step 1: Generate 6-digit OTP
            const otpCode = this.generateOTPCode();
            const otpHash = this.hashOTP(otpCode); // Store hashed, not plain text
            // Step 2: Calculate expiry (5 minutes)
            const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);
            // Step 3: Store OTP log
            const result = await sql `
        INSERT INTO two_factor_auth_logs (
          user_id,
          user_type,
          auth_method,
          transaction_type,
          transaction_id,
          transaction_amount,
          otp_code,
          otp_sent_at,
          otp_expires_at,
          auth_status
        ) VALUES (
          ${request.userId},
          ${request.userType},
          ${request.method || 'sms_otp'},
          ${request.transactionType},
          ${request.transactionId || null},
          ${request.transactionAmount || null},
          ${otpHash},
          NOW(),
          ${expiresAt.toISOString()},
          'pending'
        )
        RETURNING id, otp_expires_at
      `;
            const authId = result[0].id;
            // Step 4: Send OTP (in production, integrate SMS/Email provider)
            await this.sendOTP(request.userId, otpCode, request.method || 'sms_otp');
            // Step 5: Log to audit trail
            await sql `
        INSERT INTO compliance_audit_trail (
          audit_type,
          regulation,
          section,
          action_taken,
          performed_by,
          result,
          notes
        ) VALUES (
          '2fa_generation',
          'PSD-12',
          '12.2',
          '2FA OTP generated for payment transaction',
          ${request.userId},
          'pending',
          ${`Transaction: ${request.transactionType}, Amount: N$${request.transactionAmount || 0}`}
        )
      `;
            console.log(`✅ 2FA OTP sent to user ${request.userId} (expires in ${this.OTP_EXPIRY_MINUTES} min)`);
            return {
                authId,
                success: true,
                message: `OTP sent via ${request.method || 'SMS'}. Expires in ${this.OTP_EXPIRY_MINUTES} minutes.`,
                expiresAt,
                attemptsRemaining: this.MAX_ATTEMPTS,
            };
        }
        catch (error) {
            console.error('❌ Failed to generate OTP:', error.message);
            throw error;
        }
    }
    /**
     * Validate OTP
     * PSD-12 Section 12.2: Verify before allowing payment
     */
    static async validateOTP(validation) {
        try {
            // Step 1: Get pending OTP for this user and transaction
            const otpRecords = await sql `
        SELECT * FROM two_factor_auth_logs
        WHERE user_id = ${validation.userId}
          AND transaction_id = ${validation.transactionId}
          AND auth_status = 'pending'
        ORDER BY created_at DESC
        LIMIT 1
      `;
            if (otpRecords.length === 0) {
                return {
                    authId: '',
                    success: false,
                    message: 'No pending OTP found for this transaction',
                };
            }
            const otpRecord = otpRecords[0];
            // Step 2: Check if expired
            const now = new Date();
            const expiresAt = new Date(otpRecord.otp_expires_at);
            if (now > expiresAt) {
                await sql `
          UPDATE two_factor_auth_logs
          SET auth_status = 'expired', updated_at = NOW()
          WHERE id = ${otpRecord.id}
        `;
                return {
                    authId: otpRecord.id,
                    success: false,
                    message: 'OTP has expired. Please request a new one.',
                };
            }
            // Step 3: Check attempts
            if (otpRecord.otp_attempts >= this.MAX_ATTEMPTS) {
                await sql `
          UPDATE two_factor_auth_logs
          SET auth_status = 'blocked', updated_at = NOW()
          WHERE id = ${otpRecord.id}
        `;
                return {
                    authId: otpRecord.id,
                    success: false,
                    message: 'Maximum OTP attempts exceeded. Transaction blocked.',
                };
            }
            // Step 4: Verify OTP
            const otpHash = this.hashOTP(validation.otpCode);
            const isValid = otpHash === otpRecord.otp_code;
            // Step 5: Update log
            if (isValid) {
                await sql `
          UPDATE two_factor_auth_logs
          SET 
            auth_status = 'success',
            verified_at = NOW(),
            updated_at = NOW()
          WHERE id = ${otpRecord.id}
        `;
                // Log success to audit trail
                await sql `
          INSERT INTO compliance_audit_trail (
            audit_type,
            regulation,
            section,
            action_taken,
            performed_by,
            result
          ) VALUES (
            '2fa_validation',
            'PSD-12',
            '12.2',
            '2FA verification successful - payment authorized',
            ${validation.userId},
            'compliant'
          )
        `;
                console.log(`✅ 2FA validation successful for user ${validation.userId}`);
                return {
                    authId: otpRecord.id,
                    success: true,
                    message: 'OTP verified successfully. Payment authorized.',
                };
            }
            else {
                // Increment attempt count
                const newAttempts = otpRecord.otp_attempts + 1;
                const remainingAttempts = this.MAX_ATTEMPTS - newAttempts;
                await sql `
          UPDATE two_factor_auth_logs
          SET 
            otp_attempts = ${newAttempts},
            auth_status = ${newAttempts >= this.MAX_ATTEMPTS ? 'blocked' : 'pending'},
            failure_reason = 'Invalid OTP code',
            updated_at = NOW()
          WHERE id = ${otpRecord.id}
        `;
                return {
                    authId: otpRecord.id,
                    success: false,
                    message: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
                    attemptsRemaining: remainingAttempts,
                };
            }
        }
        catch (error) {
            console.error('❌ Failed to validate OTP:', error.message);
            throw error;
        }
    }
    /**
     * Verify 2FA is completed before payment
     * PSD-12 Enforcement: Payment cannot proceed without 2FA
     */
    static async verifyTransactionAuth(transactionId) {
        try {
            const result = await sql `
        SELECT * FROM two_factor_auth_logs
        WHERE transaction_id = ${transactionId}
          AND auth_status = 'success'
        LIMIT 1
      `;
            const isAuthorized = result.length > 0;
            if (!isAuthorized) {
                console.warn(`🚨 PSD-12 VIOLATION: Payment transaction ${transactionId} attempted without 2FA`);
            }
            return isAuthorized;
        }
        catch (error) {
            console.error('❌ Failed to verify transaction auth:', error.message);
            return false;
        }
    }
    /**
     * Generate OTP code
     */
    static generateOTPCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    /**
     * Hash OTP for secure storage
     */
    static hashOTP(otp) {
        return crypto.createHash('sha256').update(otp).digest('hex');
    }
    /**
     * Send OTP via SMS or Email
     * In production, integrate with SMS provider (e.g., Twilio, African's Talking)
     */
    static async sendOTP(userId, otpCode, method) {
        // TODO: Integration with SMS/Email provider
        // For development, log to console
        console.log(`📱 [${method.toUpperCase()}] OTP for ${userId}: ${otpCode}`);
        // In production:
        // if (method === 'sms_otp') {
        //   await twilioClient.messages.create({
        //     body: `Your Ketchup SmartPay OTP: ${otpCode}. Valid for 5 minutes.`,
        //     to: userPhoneNumber,
        //     from: TWILIO_PHONE_NUMBER
        //   });
        // }
    }
    /**
     * Get 2FA statistics for reporting
     */
    static async get2FAStatistics(startDate, endDate) {
        try {
            const result = await sql `
        SELECT 
          COUNT(*) as total_attempts,
          COUNT(CASE WHEN auth_status = 'success' THEN 1 END) as successful,
          COUNT(CASE WHEN auth_status = 'failed' THEN 1 END) as failed,
          COUNT(CASE WHEN auth_status = 'expired' THEN 1 END) as expired,
          COUNT(CASE WHEN auth_status = 'blocked' THEN 1 END) as blocked
        FROM two_factor_auth_logs
        WHERE created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}
      `;
            const stats = result[0];
            const totalAttempts = parseInt(stats.total_attempts);
            const successfulAuth = parseInt(stats.successful);
            return {
                totalAttempts,
                successfulAuth,
                failedAuth: parseInt(stats.failed),
                expiredOTPs: parseInt(stats.expired),
                blockedAttempts: parseInt(stats.blocked),
                successRate: totalAttempts > 0 ? (successfulAuth / totalAttempts) * 100 : 0,
            };
        }
        catch (error) {
            console.error('❌ Failed to get 2FA statistics:', error.message);
            throw error;
        }
    }
}
//# sourceMappingURL=TwoFactorAuthService.js.map