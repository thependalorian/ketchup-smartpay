/**
 * Voucher Helper Utilities
 * 
 * Location: utils/voucherHelpers.ts
 * Purpose: Helper functions for voucher operations
 * 
 * Compliance: Payment System Management Act, PSD-1/PSD-3
 * Integration: NamPay, NamPost, retail partners
 */

import { query, queryOne } from './db';

/**
 * Generate voucher code for in-person redemption
 */
export function generateVoucherCode(batchId: string, voucherId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VCH-${batchId}-${voucherId.substring(0, 8).toUpperCase()}-${random}`;
}

/**
 * Generate NamPay reference for voucher settlement
 */
export function generateNamPayReference(voucherId: string, method: string): string {
  const timestamp = Date.now();
  const prefix = method === 'wallet' ? 'VCH' : 
                 method === 'bank_transfer' ? 'VCH-BANK' :
                 method === 'merchant_payment' ? 'VCH-MERCHANT' : 'VCH';
  return `${prefix}-${timestamp}-${voucherId.substring(0, 8).toUpperCase()}`;
}

/**
 * Check if voucher requires verification
 */
export async function requiresVerification(voucherId: string): Promise<boolean> {
  const voucher = await queryOne<{ verification_required: boolean; type: string }>(
    'SELECT verification_required, type FROM vouchers WHERE id = $1',
    [voucherId]
  );
  
  // Government vouchers always require verification
  if (voucher?.type === 'government') {
    return true;
  }
  
  return voucher?.verification_required || false;
}

/**
 * Get redemption instructions based on method
 */
export function getRedemptionInstructions(
  method: string,
  redemptionPoint?: string,
  voucherCode?: string
): string {
  switch (method) {
    case 'wallet':
      return 'Funds will be added to your Buffr wallet instantly via NamPay.';
    
    case 'cash_out':
      const point = redemptionPoint || 'NamPost branch';
      return `Go to ${point} with your ID and voucher code: ${voucherCode || 'N/A'}. Biometric verification may be required.`;
    
    case 'bank_transfer':
      return 'Funds will be transferred to your bank account via NamPay within 1-2 business days.';
    
    case 'merchant_payment':
      return 'Present voucher code at POS or scan QR code at participating merchant.';
    
    default:
      return 'Please contact support for redemption instructions.';
  }
}

/**
 * Validate redemption point
 */
export function isValidRedemptionPoint(point: string): boolean {
  const validPoints = [
    'nampost_branch',
    'shoprite',
    'pick_n_pay',
    'buffr_app',
    'bank_transfer',
  ];
  return validPoints.includes(point.toLowerCase());
}

/**
 * Get voucher status summary
 */
export async function getVoucherSummary(userId: string): Promise<{
  total: number;
  available: number;
  redeemed: number;
  expired: number;
  totalAmount: number;
  availableAmount: number;
}> {
  const vouchers = await query<{
    status: string;
    amount: number;
  }>(
    'SELECT status, amount FROM vouchers WHERE user_id = $1',
    [userId]
  );

  const summary = {
    total: vouchers.length,
    available: 0,
    redeemed: 0,
    expired: 0,
    totalAmount: 0,
    availableAmount: 0,
  };

  for (const voucher of vouchers) {
    summary.totalAmount += parseFloat(voucher.amount.toString());
    
    if (voucher.status === 'available') {
      summary.available++;
      summary.availableAmount += parseFloat(voucher.amount.toString());
    } else if (voucher.status === 'redeemed') {
      summary.redeemed++;
    } else if (voucher.status === 'expired') {
      summary.expired++;
    }
  }

  return summary;
}

