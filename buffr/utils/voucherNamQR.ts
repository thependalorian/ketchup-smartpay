/**
 * Voucher NamQR Generation Utilities
 * 
 * Location: utils/voucherNamQR.ts
 * Purpose: Generate NamQR codes for government vouchers (Purpose Code 18)
 * 
 * Compliance: NamQR Code Standards Version 5.0, PSD-12
 * Purpose Code: 18 = Government voucher (per NamQR specification)
 */

import { generateNAMQR, type NAMQRData } from './namqr';
import { Purpose, InitiationMode, PointOfInitiationMethod } from '@/types/namqr';

export interface VoucherNamQRInput {
  voucherId: string;
  voucherCode: string;
  amount: number;
  currency?: string; // Default: '516' (NAD)
  issuer: string; // e.g., 'Ministry of Finance'
  grantType?: string; // e.g., 'old_age', 'disability', 'child_support'
  beneficiaryName: string;
  beneficiaryCity: string;
  expiryDate?: Date;
  tokenVaultId: string;
  isDynamic?: boolean; // Default: true for vouchers
}

/**
 * Generate NamQR code for government voucher redemption
 * 
 * Uses Purpose Code 18 (Government voucher) as specified in NamQR Standards v5.0
 * 
 * @param input - Voucher information
 * @returns NamQR TLV string
 */
export function generateVoucherNamQR(input: VoucherNamQRInput): string {
  const {
    voucherId,
    voucherCode,
    amount,
    currency = '516', // NAD
    issuer,
    grantType,
    beneficiaryName,
    beneficiaryCity,
    expiryDate,
    tokenVaultId,
    isDynamic = true, // Vouchers are typically dynamic
  } = input;

  // Format amount (2 decimal places, e.g., "99.12")
  const formattedAmount = amount.toFixed(2);

  // Build NAMQR data structure
  const data: NAMQRData = {
    payloadFormatIndicator: '01', // NAMQR format
    pointOfInitiation: isDynamic 
      ? PointOfInitiationMethod.PAYEE_DYNAMIC 
      : PointOfInitiationMethod.PAYEE_STATIC,
    
    // Payee Account Information (IPP alias for Buffr)
    payeeAccountInfo: {
      globallyUniqueIdentifier: 'na.com.buffr.IPP',
      payeeIPPFullFormAlias: `voucher.${voucherId}@buffr`,
      orgId: 'BUFFR', // Buffr organization ID
    },
    
    // Merchant Category Code: '0000' for P2P, but for vouchers we use a specific code
    // Note: Government vouchers may use '0000' or a specific MCC
    merchantCategoryCode: '0000', // P2P transaction
    
    // Transaction details
    transactionCurrency: currency,
    transactionAmount: formattedAmount,
    
    // Location
    countryCode: 'NA', // Namibia
    payeeName: beneficiaryName.substring(0, 25), // Max 25 chars
    payeeCity: beneficiaryCity.substring(0, 15), // Max 15 chars
    
    // Token Vault ID (mandatory)
    tokenVaultUniqueIdentifier: tokenVaultId,
    
    // Unreserved Template (Tag 80) - Critical for Purpose Code 18
    unreservedTemplate: {
      globallyUniqueIdentifier: 'na.com.buffr.namqr',
      initiationMode: isDynamic 
        ? InitiationMode.ONLINE_DYNAMIC_SECURE 
        : InitiationMode.ONLINE_STATIC_SECURE,
      purpose: Purpose.GOVERNMENT_VOUCHER, // Purpose Code 18
    },
    
    // Additional Data Field (Tag 62) - Voucher-specific information
    additionalDataField: {
      referenceLabel: voucherCode, // Voucher code for redemption
      shortDescription: `Government Voucher: ${issuer}${grantType ? ` - ${grantType}` : ''}`,
      billNumber: voucherId, // Use voucher ID as bill number
    },
  };

  // Generate NamQR string
  return generateNAMQR(data);
}

/**
 * Generate NamQR for voucher display (for in-person redemption at NamPost)
 * 
 * This creates a QR code that can be scanned at NamPost branches or mobile dispensers
 * for cash-out redemption with biometric verification.
 * 
 * @param input - Voucher information
 * @returns NamQR TLV string
 */
export function generateVoucherRedemptionNamQR(input: VoucherNamQRInput): string {
  return generateVoucherNamQR({
    ...input,
    isDynamic: true, // Always dynamic for redemption
  });
}

/**
 * Generate static NamQR for voucher wallet transfer
 * 
 * Creates a static QR code for transferring voucher value to Buffr wallet
 * (no amount specified, user enters amount)
 * 
 * @param input - Voucher information (without amount)
 * @returns NamQR TLV string
 */
export function generateVoucherWalletTransferNamQR(
  input: Omit<VoucherNamQRInput, 'amount'>
): string {
  return generateVoucherNamQR({
    ...input,
    amount: 0, // Static QR, amount entered by user
    isDynamic: false,
  });
}

/**
 * Generate NamQR code for merchant payments
 * 
 * Uses Purpose Code 19 (Private Corporate voucher) for merchant QR codes
 * 
 * @param input - Merchant information
 * @returns NamQR TLV string
 */
export interface MerchantNamQRInput {
  merchantName: string;
  merchantCity?: string;
  amount?: string; // Formatted amount (e.g., "99.12") or undefined for static QR
  currency?: string; // Default: '516' (NAD)
  tokenVaultId: string;
  purposeCode?: string; // Default: '19' (Private Corporate voucher)
  isStatic?: boolean; // true = static QR, false = dynamic QR
  description?: string;
  merchantId?: string; // Optional merchant identifier
}

export function generateMerchantNAMQR(input: MerchantNamQRInput): string {
  const {
    merchantName,
    merchantCity = 'Namibia',
    amount,
    currency = '516', // NAD
    tokenVaultId,
    purposeCode = '19', // Private Corporate voucher
    isStatic = true,
    description,
    merchantId,
  } = input;

  // Build NAMQR data structure
  const data: NAMQRData = {
    payloadFormatIndicator: '01', // NAMQR format
    pointOfInitiation: isStatic
      ? PointOfInitiationMethod.PAYEE_STATIC
      : PointOfInitiationMethod.PAYEE_DYNAMIC,
    
    // Payee Account Information (IPP alias for Buffr merchant)
    payeeAccountInfo: {
      globallyUniqueIdentifier: 'na.com.buffr.IPP',
      payeeIPPFullFormAlias: merchantId
        ? `merchant.${merchantId}@buffr`
        : `merchant.${merchantName.toLowerCase().replace(/\s+/g, '.')}@buffr`,
      orgId: 'BUFFR',
      merchantId: merchantId || undefined,
    },
    
    // Merchant Category Code: Use '0000' for general merchants
    merchantCategoryCode: '0000', // P2P/General merchant
    
    // Transaction details
    transactionCurrency: currency,
    transactionAmount: amount, // May be undefined for static QR
    
    // Location
    countryCode: 'NA', // Namibia
    payeeName: merchantName.substring(0, 25), // Max 25 chars
    payeeCity: merchantCity.substring(0, 15), // Max 15 chars
    
    // Token Vault ID (mandatory)
    tokenVaultUniqueIdentifier: tokenVaultId,
    
    // Unreserved Template (Tag 80) - Purpose Code 19 for merchants
    unreservedTemplate: {
      globallyUniqueIdentifier: 'na.com.buffr.namqr',
      initiationMode: isStatic
        ? InitiationMode.ONLINE_STATIC_SECURE
        : InitiationMode.ONLINE_DYNAMIC_SECURE,
      purpose: purposeCode, // Purpose Code 19 (Private Corporate voucher)
    },
    
    // Additional Data Field (Tag 62) - Optional merchant description
    additionalDataField: description
      ? {
          shortDescription: description.substring(0, 25), // Max 25 chars
        }
      : undefined,
  };

  // Generate NamQR string
  return generateNAMQR(data);
}
