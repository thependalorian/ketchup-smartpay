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
interface OTPRequest {
    userId: string;
    userType: 'beneficiary' | 'agent' | 'admin';
    transactionType: 'payment' | 'withdrawal' | 'transfer' | 'voucher_redemption';
    transactionId?: string;
    transactionAmount?: number;
    method?: 'sms_otp' | 'email_otp';
}
interface OTPValidation {
    userId: string;
    otpCode: string;
    transactionId: string;
}
interface TwoFactorAuthResult {
    authId: string;
    success: boolean;
    message: string;
    expiresAt?: Date;
    attemptsRemaining?: number;
}
export declare class TwoFactorAuthService {
    private static readonly OTP_LENGTH;
    private static readonly OTP_EXPIRY_MINUTES;
    private static readonly MAX_ATTEMPTS;
    /**
     * Generate and send OTP
     * PSD-12 Section 12.2: Required before payment transaction
     */
    static generateOTP(request: OTPRequest): Promise<TwoFactorAuthResult>;
    /**
     * Validate OTP
     * PSD-12 Section 12.2: Verify before allowing payment
     */
    static validateOTP(validation: OTPValidation): Promise<TwoFactorAuthResult>;
    /**
     * Verify 2FA is completed before payment
     * PSD-12 Enforcement: Payment cannot proceed without 2FA
     */
    static verifyTransactionAuth(transactionId: string): Promise<boolean>;
    /**
     * Generate OTP code
     */
    private static generateOTPCode;
    /**
     * Hash OTP for secure storage
     */
    private static hashOTP;
    /**
     * Send OTP via SMS or Email
     * In production, integrate with SMS provider (e.g., Twilio, African's Talking)
     */
    private static sendOTP;
    /**
     * Get 2FA statistics for reporting
     */
    static get2FAStatistics(startDate: Date, endDate: Date): Promise<{
        totalAttempts: number;
        successfulAuth: number;
        failedAuth: number;
        expiredOTPs: number;
        blockedAttempts: number;
        successRate: number;
    }>;
}
export {};
//# sourceMappingURL=TwoFactorAuthService.d.ts.map