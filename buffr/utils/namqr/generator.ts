/**
 * NAMQR Code Generator
 * 
 * Generates NAMQR code strings per Bank of Namibia NAMQR Code Standards v5.0.
 * Supports all payment types: P2P, P2M, ATM, Mandate, Voucher, and International.
 * 
 * @file utils/namqr/generator.ts
 * @version 1.0
 */

import {
  NAMQRCode,
  NAMQRGenerationInput,
  NAMQRGenerationResult,
  PointOfInitiationMethod,
  InitiationMode,
  Purpose,
  NAMQR_TAGS,
  ADDITIONAL_DATA_TAGS,
  TEMPLATE_80_TAGS,
  TEMPLATE_81_TAGS,
  TEMPLATE_82_TAGS,
  TEMPLATE_83_TAGS,
  TEMPLATE_84_TAGS,
  IPP_TEMPLATE_TAGS,
  IPP_GUID,
  NAMQR_OPERATOR_GUID,
  NAMCLEAR_NRTC_GUID,
  NAMIBIA_COUNTRY_CODE,
  NAD_CURRENCY_CODE,
  P2P_MCC,
  MAX_PAYLOAD_LENGTH,
} from '../../types/namqr';
import { buildCRCTag } from './crc';

/**
 * Build a TLV (Tag-Length-Value) string
 */
function buildTLV(tag: string, value: string): string {
  if (!value || value.length === 0) return '';
  const length = value.length.toString().padStart(2, '0');
  return `${tag}${length}${value}`;
}

/**
 * Build a template with nested TLV objects
 */
function buildTemplate(tag: string, content: string): string {
  if (!content || content.length === 0) return '';
  return buildTLV(tag, content);
}

/**
 * Format amount to NAMQR standard (max 2 decimal places)
 */
function formatAmount(amount: number): string {
  return amount.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Format date to ddmmyyyy format
 */
function formatDateDDMMYYYY(date: Date): string {
  const dd = date.getDate().toString().padStart(2, '0');
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = date.getFullYear().toString();
  return dd + mm + yyyy;
}

/**
 * Format date to ISO DateTime string
 */
function formatISODateTime(date: Date): string {
  return date.toISOString();
}

/**
 * Generate a Token Vault Unique ID (placeholder - actual implementation depends on Token Vault)
 */
function generateTokenVaultId(): string {
  // Generate an 8-digit unique identifier (NREF format from NamClear)
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return timestamp + random;
}

/**
 * Determine Point of Initiation Method
 */
function getPointOfInitiationMethod(
  presenter: 'PAYEE' | 'PAYER' | 'MERCHANT' | 'CUSTOMER',
  isDynamic: boolean
): PointOfInitiationMethod {
  if (presenter === 'PAYEE' || presenter === 'MERCHANT') {
    return isDynamic ? PointOfInitiationMethod.PAYEE_DYNAMIC : PointOfInitiationMethod.PAYEE_STATIC;
  } else {
    return isDynamic ? PointOfInitiationMethod.PAYER_DYNAMIC : PointOfInitiationMethod.PAYER_STATIC;
  }
}

/**
 * Determine Initiation Mode
 */
function getInitiationMode(
  isDynamic: boolean,
  isSecure: boolean,
  isMandate: boolean,
  isOnline: boolean
): InitiationMode {
  if (isOnline) {
    if (isMandate) return InitiationMode.ONLINE_DYNAMIC_SECURE_MANDATE;
    if (isSecure) return isDynamic ? InitiationMode.ONLINE_DYNAMIC_SECURE : InitiationMode.ONLINE_STATIC_SECURE;
    return isDynamic ? InitiationMode.ONLINE_DYNAMIC : InitiationMode.ONLINE_STATIC;
  } else {
    if (isMandate) return isDynamic ? InitiationMode.DYNAMIC_SECURE_MANDATE_OFFLINE : InitiationMode.STATIC_SECURE_MANDATE_OFFLINE;
    if (isSecure) return isDynamic ? InitiationMode.DYNAMIC_SECURE_OFFLINE : InitiationMode.STATIC_SECURE_OFFLINE;
    return isDynamic ? InitiationMode.DYNAMIC_OFFLINE : InitiationMode.STATIC_OFFLINE;
  }
}

/**
 * Build IPP Payee/Payer Alias Template (Tags 26, 29)
 */
function buildIPPAliasTemplate(
  alias: string,
  orgId?: string,
  merchantId?: string,
  minimumAmount?: number
): string {
  let content = buildTLV(IPP_TEMPLATE_TAGS.GLOBALLY_UNIQUE_IDENTIFIER, IPP_GUID);
  content += buildTLV(IPP_TEMPLATE_TAGS.FULL_FORM_ALIAS, alias);
  
  if (orgId) {
    content += buildTLV(IPP_TEMPLATE_TAGS.ORG_ID, orgId);
  }
  if (merchantId) {
    content += buildTLV(IPP_TEMPLATE_TAGS.MERCHANT_ID, merchantId);
  }
  if (minimumAmount !== undefined && minimumAmount > 0) {
    content += buildTLV(IPP_TEMPLATE_TAGS.MINIMUM_AMOUNT, formatAmount(minimumAmount));
  }
  
  return content;
}

/**
 * Build IPP Reference Template (Tag 27)
 */
function buildIPPReferenceTemplate(
  transactionReference: string,
  referenceUrl?: string,
  category?: '01' | '02'
): string {
  let content = buildTLV(IPP_TEMPLATE_TAGS.GLOBALLY_UNIQUE_IDENTIFIER, IPP_GUID);
  content += buildTLV('01', transactionReference); // Transaction Reference
  
  if (referenceUrl) {
    content += buildTLV('02', referenceUrl);
    if (category) {
      content += buildTLV('03', category);
    }
  }
  
  return content;
}

/**
 * Build Existing Payment System Template (Tags 17, 28)
 */
function buildExistingPaymentSystemTemplate(
  pspId: string,
  identifier: string,
  guid: string = NAMCLEAR_NRTC_GUID
): string {
  let content = buildTLV('00', guid);
  content += buildTLV('01', pspId);
  content += buildTLV('02', identifier);
  return content;
}

/**
 * Build Additional Data Field (Tag 62)
 */
function buildAdditionalDataField(input: NAMQRGenerationInput): string {
  let content = '';
  
  if (input.transaction?.reference) {
    content += buildTLV(ADDITIONAL_DATA_TAGS.REFERENCE_LABEL, input.transaction.reference);
  }
  if (input.transaction?.description) {
    content += buildTLV(ADDITIONAL_DATA_TAGS.SHORT_DESCRIPTION, input.transaction.description.substring(0, 25));
  }
  if (input.merchant?.storeLabel) {
    content += buildTLV(ADDITIONAL_DATA_TAGS.STORE_LABEL, input.merchant.storeLabel);
  }
  if (input.merchant?.terminalLabel) {
    content += buildTLV(ADDITIONAL_DATA_TAGS.TERMINAL_LABEL, input.merchant.terminalLabel);
  }
  
  return content;
}

/**
 * Build Template 80 (Unreserved - IPP Deep Linking)
 */
function buildTemplate80(input: NAMQRGenerationInput, initiationMode: InitiationMode): string {
  let content = buildTLV(TEMPLATE_80_TAGS.GLOBALLY_UNIQUE_IDENTIFIER, NAMQR_OPERATOR_GUID);
  content += buildTLV(TEMPLATE_80_TAGS.INITIATION_MODE, initiationMode);
  
  if (input.purpose) {
    content += buildTLV(TEMPLATE_80_TAGS.PURPOSE, input.purpose);
  }
  if (input.merchant?.type) {
    content += buildTLV(TEMPLATE_80_TAGS.MERCHANT_TYPE, input.merchant.type);
  }
  if (input.merchant?.genre) {
    content += buildTLV(TEMPLATE_80_TAGS.MERCHANT_GENRE, input.merchant.genre);
  }
  if (input.merchant?.onboardingType) {
    content += buildTLV(TEMPLATE_80_TAGS.MERCHANT_ONBOARDING_TYPE, input.merchant.onboardingType);
  }
  if (input.merchant?.brand) {
    content += buildTLV(TEMPLATE_80_TAGS.MERCHANT_BRAND, input.merchant.brand.substring(0, 25));
  }
  
  return content;
}

/**
 * Build Template 82 (Transaction Details)
 */
function buildTemplate82(input: NAMQRGenerationInput): string {
  let content = buildTLV(TEMPLATE_82_TAGS.GLOBALLY_UNIQUE_IDENTIFIER, NAMQR_OPERATOR_GUID);
  
  if (input.transaction?.expiry) {
    content += buildTLV(TEMPLATE_82_TAGS.NAMQR_EXPIRY, formatISODateTime(input.transaction.expiry));
  }
  
  // Add creation timestamp
  content += buildTLV(TEMPLATE_82_TAGS.NAMQR_CREATION_TIMESTAMP, formatISODateTime(new Date()));
  
  return content;
}

/**
 * Build Template 83 (Mandate Information)
 */
function buildTemplate83(input: NAMQRGenerationInput): string {
  if (!input.mandate) return '';
  
  let content = buildTLV(TEMPLATE_83_TAGS.GLOBALLY_UNIQUE_IDENTIFIER, NAMQR_OPERATOR_GUID);
  content += buildTLV(TEMPLATE_83_TAGS.MANDATE_NAME, input.mandate.name.substring(0, 25));
  content += buildTLV(TEMPLATE_83_TAGS.VALIDITY_START, formatDateDDMMYYYY(input.mandate.validityStart));
  content += buildTLV(TEMPLATE_83_TAGS.VALIDITY_END, formatDateDDMMYYYY(input.mandate.validityEnd));
  
  if (input.mandate.amountRule) {
    content += buildTLV(TEMPLATE_83_TAGS.AMOUNT_RULE, input.mandate.amountRule);
  }
  
  content += buildTLV(TEMPLATE_83_TAGS.RECURRENCE, input.mandate.recurrence);
  
  if (input.mandate.revocable !== undefined) {
    content += buildTLV(TEMPLATE_83_TAGS.REVOCABLE, input.mandate.revocable ? 'Y' : 'N');
  }
  
  return content;
}

/**
 * Generate NAMQR Code String
 * 
 * @param input - Generation input parameters
 * @returns Generation result with QR string or errors
 */
export function generateNAMQRCode(input: NAMQRGenerationInput): NAMQRGenerationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate required fields
  if (!input.payeeInfo.name) {
    errors.push('Payee name is required');
  }
  if (!input.payeeInfo.city) {
    errors.push('Payee city is required');
  }
  if (input.type === 'P2M' && !input.merchant?.mcc) {
    errors.push('Merchant Category Code (MCC) is required for P2M transactions');
  }
  if (input.paymentStream === 'IPP' && !input.payeeInfo.ippAlias) {
    errors.push('IPP full form alias is required for IPP transactions');
  }
  
  if (errors.length > 0) {
    return { success: false, errors, warnings };
  }
  
  try {
    let qrString = '';
    
    // 1. Payload Format Indicator (Tag 00) - Always first
    qrString += buildTLV(NAMQR_TAGS.PAYLOAD_FORMAT_INDICATOR, '01');
    
    // 2. Point of Initiation Method (Tag 01)
    const poim = getPointOfInitiationMethod(input.presenter, input.isDynamic);
    qrString += buildTLV(NAMQR_TAGS.POINT_OF_INITIATION_METHOD, poim);
    
    // 3. Payee/Payer Account Information (Tags 02-51)
    if (input.paymentStream === 'IPP') {
      // IPP Templates
      if (input.presenter === 'PAYEE' || input.presenter === 'MERCHANT') {
        // Tag 26 - IPP Payee Alias
        const aliasContent = buildIPPAliasTemplate(
          input.payeeInfo.ippAlias!,
          input.payeeInfo.orgId,
          input.payeeInfo.merchantId
        );
        qrString += buildTemplate(NAMQR_TAGS.IPP_PAYEE_ALIAS, aliasContent);
        
        // Tag 27 - Transaction Reference (for dynamic)
        if (input.isDynamic && input.transaction?.reference) {
          const refContent = buildIPPReferenceTemplate(input.transaction.reference);
          qrString += buildTemplate(NAMQR_TAGS.IPP_PAYEE_REFERENCE, refContent);
        }
      } else {
        // Tag 29 - IPP Payer Alias
        const aliasContent = buildIPPAliasTemplate(
          input.payeeInfo.ippAlias!,
          input.payeeInfo.orgId
        );
        qrString += buildTemplate(NAMQR_TAGS.IPP_PAYER_ALIAS, aliasContent);
      }
    } else if (input.paymentStream === 'NRTC' || input.paymentStream === 'EnCR' || input.paymentStream === 'EnDO') {
      // Existing payment system templates
      if (input.payeeInfo.pspId && input.payeeInfo.identifier) {
        const tag = input.presenter === 'PAYER' || input.presenter === 'CUSTOMER' 
          ? NAMQR_TAGS.PAYER_EXISTING_SYSTEM 
          : NAMQR_TAGS.PAYEE_EXISTING_SYSTEM;
        const content = buildExistingPaymentSystemTemplate(
          input.payeeInfo.pspId,
          input.payeeInfo.identifier
        );
        qrString += buildTemplate(tag, content);
      }
    }
    
    // 4. Merchant Category Code (Tag 52)
    const mcc = input.type === 'P2P' || input.type === 'VOUCHER' ? P2P_MCC : input.merchant?.mcc || P2P_MCC;
    qrString += buildTLV(NAMQR_TAGS.MERCHANT_CATEGORY_CODE, mcc);
    
    // 5. Transaction Currency (Tag 53) - for dynamic
    if (input.isDynamic || input.presenter === 'PAYER') {
      const currency = input.transaction?.currency || NAD_CURRENCY_CODE;
      qrString += buildTLV(NAMQR_TAGS.TRANSACTION_CURRENCY, currency);
    }
    
    // 6. Transaction Amount (Tag 54) - for dynamic
    if (input.isDynamic && input.transaction?.amount !== undefined && input.transaction.amount > 0) {
      qrString += buildTLV(NAMQR_TAGS.TRANSACTION_AMOUNT, formatAmount(input.transaction.amount));
    }
    
    // 7. Country Code (Tag 58)
    qrString += buildTLV(NAMQR_TAGS.COUNTRY_CODE, input.payeeInfo.countryCode || NAMIBIA_COUNTRY_CODE);
    
    // 8. Payee Name (Tag 59) - max 25 chars
    qrString += buildTLV(NAMQR_TAGS.PAYEE_NAME, input.payeeInfo.name.substring(0, 25));
    
    // 9. Payee City (Tag 60) - max 15 chars
    qrString += buildTLV(NAMQR_TAGS.PAYEE_CITY, input.payeeInfo.city.substring(0, 15));
    
    // 10. Postal Code (Tag 61) - optional
    if (input.payeeInfo.postalCode) {
      qrString += buildTLV(NAMQR_TAGS.POSTAL_CODE, input.payeeInfo.postalCode.substring(0, 10));
    }
    
    // 11. Additional Data Field (Tag 62) - optional
    const additionalData = buildAdditionalDataField(input);
    if (additionalData) {
      qrString += buildTemplate(NAMQR_TAGS.ADDITIONAL_DATA_FIELD, additionalData);
    }
    
    // 12. Token Vault Unique ID (Tag 65)
    const tokenVaultId = input.tokenVaultId || generateTokenVaultId();
    qrString += buildTLV(NAMQR_TAGS.TOKEN_VAULT_UNIQUE_ID, tokenVaultId);
    
    // 13. Template 80 - Unreserved (IPP Deep Linking)
    const initiationMode = getInitiationMode(
      input.isDynamic,
      true, // Secure by default
      input.type === 'MANDATE',
      input.paymentStream === 'IPP'
    );
    const template80Content = buildTemplate80(input, initiationMode);
    qrString += buildTemplate(NAMQR_TAGS.UNRESERVED_TEMPLATE_80, template80Content);
    
    // 14. Template 82 - Transaction Details (for dynamic)
    if (input.isDynamic) {
      const template82Content = buildTemplate82(input);
      if (template82Content) {
        qrString += buildTemplate(NAMQR_TAGS.UNRESERVED_TEMPLATE_82, template82Content);
      }
    }
    
    // 15. Template 83 - Mandate (for recurring)
    if (input.type === 'MANDATE' && input.mandate) {
      const template83Content = buildTemplate83(input);
      qrString += buildTemplate(NAMQR_TAGS.UNRESERVED_TEMPLATE_83, template83Content);
    }
    
    // 16. CRC (Tag 63) - Always last
    const crcTag = buildCRCTag(qrString);
    qrString += crcTag;
    
    // Validate payload length
    if (qrString.length > MAX_PAYLOAD_LENGTH) {
      warnings.push(`Payload length (${qrString.length}) exceeds recommended maximum (${MAX_PAYLOAD_LENGTH})`);
    }
    
    // Build NAMQRCode object for Token Vault storage (NAMQR v5.0 compliance)
    // Note: This is a simplified structure for storage - full structure is in qrString
    const namqrCodeData: Partial<NAMQRCode> = {
      payloadFormatIndicator: '01',
      pointOfInitiationMethod: poim,
      merchantCategoryCode: mcc,
      countryCode: input.payeeInfo.countryCode || NAMIBIA_COUNTRY_CODE,
      payeeName: input.payeeInfo.name.substring(0, 25),
      payeeCity: input.payeeInfo.city.substring(0, 15),
      tokenVaultUniqueId: tokenVaultId,
      ...(input.transaction?.currency && { transactionCurrency: input.transaction.currency }),
      ...(input.transaction?.amount && { transactionAmount: input.transaction.amount }),
      ...(input.payeeInfo.postalCode && { postalCode: input.payeeInfo.postalCode }),
    };
    
    // Add IPP alias if present
    if (input.paymentStream === 'IPP' && input.payeeInfo.ippAlias) {
      namqrCodeData.ippPayeeAlias = {
        globallyUniqueIdentifier: IPP_GUID,
        fullFormAlias: input.payeeInfo.ippAlias,
        ...(input.payeeInfo.orgId && { orgId: input.payeeInfo.orgId }),
        ...(input.payeeInfo.merchantId && { merchantId: input.payeeInfo.merchantId }),
      };
    }
    
    // Add Template 80 if present
    if (template80Content) {
      namqrCodeData.template80 = {
        globallyUniqueIdentifier: NAMQR_OPERATOR_GUID,
        initiationMode,
        ...(input.purpose && { purpose: input.purpose }),
      };
    }
    
    // Store in Token Vault database (NAMQR v5.0 compliance requirement)
    // This is done asynchronously to not block QR generation
    if (typeof window === 'undefined') {
      // Server-side: Store in Token Vault
      import('@/services/tokenVaultStorage')
        .then(({ storeTokenVaultParameters }) => {
          storeTokenVaultParameters({
            tokenVaultId,
            namqrData: namqrCodeData as NAMQRCode,
            voucherId: input.type === 'VOUCHER' ? input.payeeInfo.merchantId : undefined,
            merchantId: input.type === 'P2M' ? input.payeeInfo.merchantId : undefined,
            purposeCode: input.purpose?.toString(),
            amount: input.transaction?.amount,
            currency: input.transaction?.currency || NAD_CURRENCY_CODE,
            isStatic: !input.isDynamic,
            expiresAt: input.transaction?.expiry,
          }).catch((err) => {
            // Log error but don't fail QR generation
            console.error('Failed to store Token Vault parameters:', err);
          });
        })
        .catch(() => {
          // Token Vault storage is optional for now (graceful degradation)
        });
    }
    
    return {
      success: true,
      qrString,
      data: namqrCodeData,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, errors, warnings };
  }
}

/**
 * Generate Static P2P NAMQR Code
 */
export function generateP2PStaticQR(
  payeeName: string,
  payeeCity: string,
  ippAlias: string,
  tokenVaultId?: string
): NAMQRGenerationResult {
  return generateNAMQRCode({
    type: 'P2P',
    presenter: 'PAYEE',
    isDynamic: false,
    paymentStream: 'IPP',
    payeeInfo: {
      name: payeeName,
      city: payeeCity,
      ippAlias,
    },
    tokenVaultId,
  });
}

/**
 * Generate Dynamic P2P NAMQR Code
 */
export function generateP2PDynamicQR(
  payeeName: string,
  payeeCity: string,
  ippAlias: string,
  amount: number,
  reference?: string,
  description?: string,
  expiryMinutes: number = 15
): NAMQRGenerationResult {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + expiryMinutes);
  
  return generateNAMQRCode({
    type: 'P2P',
    presenter: 'PAYEE',
    isDynamic: true,
    paymentStream: 'IPP',
    payeeInfo: {
      name: payeeName,
      city: payeeCity,
      ippAlias,
    },
    transaction: {
      amount,
      currency: NAD_CURRENCY_CODE,
      reference,
      description,
      expiry,
    },
  });
}

/**
 * Generate Merchant Static NAMQR Code
 */
export function generateMerchantStaticQR(
  merchantName: string,
  merchantCity: string,
  ippAlias: string,
  mcc: string,
  storeLabel?: string,
  terminalLabel?: string
): NAMQRGenerationResult {
  return generateNAMQRCode({
    type: 'P2M',
    presenter: 'MERCHANT',
    isDynamic: false,
    paymentStream: 'IPP',
    payeeInfo: {
      name: merchantName,
      city: merchantCity,
      ippAlias,
    },
    merchant: {
      mcc,
      storeLabel,
      terminalLabel,
    },
  });
}

/**
 * Generate Merchant Dynamic NAMQR Code
 */
export function generateMerchantDynamicQR(
  merchantName: string,
  merchantCity: string,
  ippAlias: string,
  mcc: string,
  amount: number,
  invoiceReference: string,
  description?: string,
  expiryMinutes: number = 30
): NAMQRGenerationResult {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + expiryMinutes);
  
  return generateNAMQRCode({
    type: 'P2M',
    presenter: 'MERCHANT',
    isDynamic: true,
    paymentStream: 'IPP',
    payeeInfo: {
      name: merchantName,
      city: merchantCity,
      ippAlias,
    },
    merchant: {
      mcc,
    },
    transaction: {
      amount,
      currency: NAD_CURRENCY_CODE,
      reference: invoiceReference,
      description,
      expiry,
    },
  });
}

/**
 * Generate ATM Cash Withdrawal NAMQR Code
 */
export function generateATMWithdrawalQR(
  bankName: string,
  atmLocation: string,
  ippAlias: string,
  amount: number,
  expiryMinutes: number = 5
): NAMQRGenerationResult {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + expiryMinutes);
  
  return generateNAMQRCode({
    type: 'ATM',
    presenter: 'MERCHANT',
    isDynamic: true,
    paymentStream: 'IPP',
    payeeInfo: {
      name: bankName,
      city: atmLocation,
      ippAlias,
    },
    merchant: {
      mcc: '6011', // ATM MCC
    },
    transaction: {
      amount,
      currency: NAD_CURRENCY_CODE,
      description: 'ATM Cash Withdrawal',
      expiry,
    },
    purpose: Purpose.METRO_ATM_NAMQR,
  });
}
