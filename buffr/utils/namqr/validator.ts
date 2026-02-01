/**
 * NAMQR Code Validator
 * 
 * Validates NAMQR code strings per Bank of Namibia NAMQR Code Standards v5.0.
 * Checks structure, mandatory fields, and business rules.
 * 
 * @file utils/namqr/validator.ts
 * @version 1.0
 */

import {
  NAMQRCode,
  NAMQRValidationResult,
  PointOfInitiationMethod,
  NAMQR_TAGS,
  P2P_MCC,
  MAX_PAYLOAD_LENGTH,
  NAMIBIA_COUNTRY_CODE,
} from '../../types/namqr';
import { validateCRC16 } from './crc';
import { parseNAMQRCode, parseTLVObjects } from './parser';
import { verifyNAMQRSignature, getSignablePayload } from './crypto';
import { tokenVaultService } from '../../services/tokenVaultService';

/**
 * Validate ISO 4217 currency code (numeric)
 */
function isValidCurrencyCode(code: string): boolean {
  return /^\d{3}$/.test(code);
}

/**
 * Validate ISO 3166-1 alpha-2 country code
 */
function isValidCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code);
}

/**
 * Validate Merchant Category Code (4 digits)
 */
function isValidMCC(mcc: string): boolean {
  return /^\d{4}$/.test(mcc);
}

/**
 * Validate amount format (max 2 decimal places)
 */
function isValidAmount(amount: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(amount) && parseFloat(amount) > 0;
}

/**
 * Validate IPP full form alias format
 */
function isValidIPPAlias(alias: string): boolean {
  // Format: identifier@psp (must contain @ symbol)
  return alias.includes('@') && alias.length <= 50;
}

/**
 * Validate Token Vault Unique ID
 */
function isValidTokenVaultId(id: string): boolean {
  // Typically 8 digits (NREF format from NamClear)
  return /^\d{6,12}$/.test(id);
}

/**
 * Validate a NAMQR code string
 * 
 * @param qrString - The NAMQR code string to validate
 * @returns Validation result with errors and warnings
 */
export function validateNAMQRCode(qrString: string): NAMQRValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!qrString || qrString.length === 0) {
    errors.push('Empty QR code string');
    return { isValid: false, errors, warnings };
  }
  
  // Check payload length
  if (qrString.length > MAX_PAYLOAD_LENGTH) {
    warnings.push(`Payload length (${qrString.length}) exceeds recommended maximum (${MAX_PAYLOAD_LENGTH})`);
  }
  
  // Validate CRC
  const crcResult = validateCRC16(qrString);
  if (!crcResult.isValid) {
    errors.push(`CRC validation failed. Expected: ${crcResult.expectedCrc}, Got: ${crcResult.actualCrc}`);
  }
  
  // Parse the QR code
  const parseResult = parseNAMQRCode(qrString);
  
  if (!parseResult.success) {
    errors.push(...parseResult.errors);
    warnings.push(...parseResult.warnings);
    return { isValid: false, errors, warnings, crcValid: crcResult.isValid };
  }
  
  const data = parseResult.data!;
  
  // Validate Point of Initiation Method
  const validPOIMs = ['11', '12', '13', '14'];
  if (!validPOIMs.includes(data.pointOfInitiationMethod)) {
    errors.push(`Invalid Point of Initiation Method: ${data.pointOfInitiationMethod}. Must be 11, 12, 13, or 14`);
  }
  
  // Validate MCC
  if (!isValidMCC(data.merchantCategoryCode)) {
    errors.push(`Invalid Merchant Category Code: ${data.merchantCategoryCode}. Must be 4 digits`);
  }
  
  // Validate Country Code
  if (!isValidCountryCode(data.countryCode)) {
    errors.push(`Invalid Country Code: ${data.countryCode}. Must be ISO 3166-1 alpha-2`);
  }
  
  // Validate Payee Name length
  if (data.payeeName.length > 25) {
    errors.push(`Payee Name too long: ${data.payeeName.length} chars. Maximum is 25`);
  }
  
  // Validate Payee City length
  if (data.payeeCity.length > 15) {
    errors.push(`Payee City too long: ${data.payeeCity.length} chars. Maximum is 15`);
  }
  
  // Validate Transaction Currency if present
  if (data.transactionCurrency && !isValidCurrencyCode(data.transactionCurrency)) {
    errors.push(`Invalid Transaction Currency: ${data.transactionCurrency}. Must be 3 digits (ISO 4217)`);
  }
  
  // Validate Transaction Amount if present
  if (data.transactionAmount !== undefined) {
    if (data.transactionAmount <= 0) {
      errors.push('Transaction Amount must be greater than 0');
    }
    // Check decimal places
    const amountStr = data.transactionAmount.toString();
    const decimalIndex = amountStr.indexOf('.');
    if (decimalIndex !== -1 && amountStr.length - decimalIndex - 1 > 2) {
      errors.push('Transaction Amount cannot have more than 2 decimal places');
    }
  }
  
  // Validate IPP Alias if present
  if (data.ippPayeeAlias?.fullFormAlias && !isValidIPPAlias(data.ippPayeeAlias.fullFormAlias)) {
    errors.push(`Invalid IPP Payee Alias format: ${data.ippPayeeAlias.fullFormAlias}`);
  }
  if (data.ippPayerAlias?.fullFormAlias && !isValidIPPAlias(data.ippPayerAlias.fullFormAlias)) {
    errors.push(`Invalid IPP Payer Alias format: ${data.ippPayerAlias.fullFormAlias}`);
  }
  
  // Business rule validations
  
  // For P2P transactions, MCC should be 0000
  if (data.merchantCategoryCode === P2P_MCC) {
    // This is P2P - check that it's not trying to be a merchant QR
    if (data.template80?.merchantType || data.template80?.merchantGenre) {
      warnings.push('P2P QR (MCC=0000) should not include merchant type/genre');
    }
  }
  
  // For payer-presented QR, certain tags should not be present
  const isPayerPresented = data.pointOfInitiationMethod === PointOfInitiationMethod.PAYER_STATIC ||
                           data.pointOfInitiationMethod === PointOfInitiationMethod.PAYER_DYNAMIC;
  if (isPayerPresented) {
    if (data.additionalDataField?.storeLabel) {
      warnings.push('Store Label should not be present in payer-presented QR');
    }
    if (data.additionalDataField?.terminalLabel) {
      warnings.push('Terminal Label should not be present in payer-presented QR');
    }
  }
  
  // Check for dynamic QR expiry
  const isDynamic = data.pointOfInitiationMethod === PointOfInitiationMethod.PAYEE_DYNAMIC ||
                    data.pointOfInitiationMethod === PointOfInitiationMethod.PAYER_DYNAMIC;
  if (isDynamic && data.template82?.namqrExpiry) {
    const expiry = new Date(data.template82.namqrExpiry);
    if (expiry < new Date()) {
      errors.push('NAMQR code has expired');
    }
  }
  
  // Mandate validation
  if (data.template83) {
    // Validate date format (ddmmyyyy)
    const dateRegex = /^\d{8}$/;
    if (!dateRegex.test(data.template83.validityStart)) {
      errors.push(`Invalid mandate validity start date format: ${data.template83.validityStart}. Expected ddmmyyyy`);
    }
    if (!dateRegex.test(data.template83.validityEnd)) {
      errors.push(`Invalid mandate validity end date format: ${data.template83.validityEnd}. Expected ddmmyyyy`);
    }
    
    // Check validity period
    if (data.template83.validityStart && data.template83.validityEnd) {
      const start = parseDate(data.template83.validityStart);
      const end = parseDate(data.template83.validityEnd);
      if (start && end && end < start) {
        errors.push('Mandate validity end date is before start date');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    crcValid: crcResult.isValid,
  };
}

/**
 * Parse ddmmyyyy date string
 */
function parseDate(dateStr: string): Date | null {
  if (!/^\d{8}$/.test(dateStr)) {
    return null;
  }
  const dd = parseInt(dateStr.substring(0, 2), 10);
  const mm = parseInt(dateStr.substring(2, 4), 10) - 1;
  const yyyy = parseInt(dateStr.substring(4, 8), 10);
  return new Date(yyyy, mm, dd);
}

/**
 * Validate NAMQR against Token Vault (placeholder)
 * 
 * In production, this would call the Token Vault API to validate
 * that the QR parameters match those stored in the vault.
 */
export async function validateWithTokenVault(
  qrString: string,
  tokenVaultEndpoint?: string
): Promise<NAMQRValidationResult> {
  const basicValidation = validateNAMQRCode(qrString);
  
  if (!basicValidation.isValid) {
    return basicValidation;
  }
  
  const parseResult = parseNAMQRCode(qrString);
  if (!parseResult.success || !parseResult.data) {
    return basicValidation;
  }
  
  const tokenVaultId = parseResult.data.tokenVaultUniqueId;
  
  if (!tokenVaultId) {
    basicValidation.warnings.push('No Token Vault ID present - cannot validate with Token Vault');
    return basicValidation;
  }
  
  // Call Token Vault API
  const vaultResult = await tokenVaultService.validateToken({
    tokenVaultId,
    merchantId: parseResult.data.merchantCategoryCode,
    amount: parseResult.data.transactionAmount,
    currency: parseResult.data.transactionCurrency
  });

  if (!vaultResult.isValid) {
    basicValidation.isValid = false;
    basicValidation.errors.push(`Token Vault validation failed: ${vaultResult.error || 'Invalid token'}`);
  } else {
    basicValidation.warnings.push('Validated with Token Vault');
  }
  
  return basicValidation;
}

/**
 * Quick validation check for scanning
 * 
 * Performs minimal validation for quick feedback when scanning a QR code.
 */
export function quickValidate(qrString: string): {
  isValid: boolean;
  error?: string;
} {
  if (!qrString || qrString.length === 0) {
    return { isValid: false, error: 'Empty QR code' };
  }
  
  // Check if it starts with payload format indicator
  if (!qrString.startsWith('0002')) {
    return { isValid: false, error: 'Invalid NAMQR format' };
  }
  
  // Quick CRC check
  const crcResult = validateCRC16(qrString);
  if (!crcResult.isValid) {
    return { isValid: false, error: 'CRC validation failed' };
  }
  
  return { isValid: true };
}

/**
 * Validate signed QR for IPP transactions
 * 
 * For IPP app-based transactions, the QR should be signed.
 * This validates the digital signature if present.
 */
export async function validateSignedQR(qrString: string): Promise<NAMQRValidationResult> {
  const basicValidation = validateNAMQRCode(qrString);
  
  if (!basicValidation.isValid) {
    return basicValidation;
  }
  
  const parseResult = parseNAMQRCode(qrString);
  if (!parseResult.success || !parseResult.data) {
    return basicValidation;
  }
  
  const signature = parseResult.data.digitalSignature;
  
  if (!signature) {
    basicValidation.warnings.push('QR code is not signed - for IPP transactions, signed QR is recommended');
    return { ...basicValidation, signatureValid: false };
  }
  
  // Verify signature
  const signablePayload = getSignablePayload(qrString);
  
  // In production, the public key would be fetched from the VAE (Verified Address Entries)
  // based on the IPP Payee Alias or Merchant ID.
  const mockPublicKey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...';
  
  const isSignatureValid = await verifyNAMQRSignature(
    signablePayload,
    signature,
    mockPublicKey
  );

  if (!isSignatureValid) {
    basicValidation.isValid = false;
    basicValidation.errors.push('Digital signature verification failed');
  } else {
    basicValidation.warnings.push('Digital signature verified');
  }
  
  return { ...basicValidation, signatureValid: isSignatureValid };
}
