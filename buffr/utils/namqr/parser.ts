/**
 * NAMQR Code Parser
 * 
 * Parses NAMQR code strings per Bank of Namibia NAMQR Code Standards v5.0.
 * Extracts all TLV data objects and converts to structured data.
 * 
 * @file utils/namqr/parser.ts
 * @version 1.0
 */

import {
  NAMQRCode,
  NAMQRParseResult,
  TLVObject,
  PointOfInitiationMethod,
  InitiationMode,
  Purpose,
  TipConvenienceIndicator,
  RecurrenceFrequency,
  AdditionalDataField,
  IPPAliasTemplate,
  IPPReferenceTemplate,
  Template80,
  Template81,
  Template82,
  Template83,
  Template84,
  ExistingPaymentSystemTemplate,
  NAMQR_TAGS,
  ADDITIONAL_DATA_TAGS,
  TEMPLATE_80_TAGS,
  TEMPLATE_81_TAGS,
  TEMPLATE_82_TAGS,
  TEMPLATE_83_TAGS,
  TEMPLATE_84_TAGS,
  IPP_TEMPLATE_TAGS,
} from '../../types/namqr';
import { validateCRC16 } from './crc';

/**
 * Parse a single TLV object from a string at a given position
 * 
 * @param data - The NAMQR string
 * @param position - Current position in the string
 * @returns Parsed TLV object and new position, or null if parsing failed
 */
function parseTLV(data: string, position: number): { tlv: TLVObject; newPosition: number } | null {
  if (position + 4 > data.length) {
    return null;
  }
  
  const tag = data.substring(position, position + 2);
  const lengthStr = data.substring(position + 2, position + 4);
  const length = parseInt(lengthStr, 10);
  
  if (isNaN(length) || position + 4 + length > data.length) {
    return null;
  }
  
  const value = data.substring(position + 4, position + 4 + length);
  
  return {
    tlv: { tag, length, value },
    newPosition: position + 4 + length,
  };
}

/**
 * Parse all TLV objects from a NAMQR string
 * 
 * @param data - The NAMQR string to parse
 * @returns Array of TLV objects
 */
export function parseTLVObjects(data: string): TLVObject[] {
  const tlvObjects: TLVObject[] = [];
  let position = 0;
  
  while (position < data.length) {
    const result = parseTLV(data, position);
    if (!result) {
      break;
    }
    tlvObjects.push(result.tlv);
    position = result.newPosition;
  }
  
  return tlvObjects;
}

/**
 * Parse nested TLV objects within a template
 * 
 * @param templateValue - The template value string
 * @returns Map of tag to value
 */
function parseNestedTLV(templateValue: string): Map<string, string> {
  const result = new Map<string, string>();
  const tlvObjects = parseTLVObjects(templateValue);
  
  for (const tlv of tlvObjects) {
    result.set(tlv.tag, tlv.value);
  }
  
  return result;
}

/**
 * Parse IPP Alias Template (Tags 26, 29)
 */
function parseIPPAliasTemplate(value: string): IPPAliasTemplate | null {
  const nested = parseNestedTLV(value);
  
  const guid = nested.get(IPP_TEMPLATE_TAGS.GLOBALLY_UNIQUE_IDENTIFIER);
  const alias = nested.get(IPP_TEMPLATE_TAGS.FULL_FORM_ALIAS);
  
  if (!guid || !alias) {
    return null;
  }
  
  const minAmountStr = nested.get(IPP_TEMPLATE_TAGS.MINIMUM_AMOUNT);
  
  return {
    globallyUniqueIdentifier: guid,
    fullFormAlias: alias,
    orgId: nested.get(IPP_TEMPLATE_TAGS.ORG_ID),
    merchantId: nested.get(IPP_TEMPLATE_TAGS.MERCHANT_ID),
    minimumAmount: minAmountStr ? parseFloat(minAmountStr) : undefined,
  };
}

/**
 * Parse IPP Reference Template (Tag 27)
 */
function parseIPPReferenceTemplate(value: string): IPPReferenceTemplate | null {
  const nested = parseNestedTLV(value);
  
  const guid = nested.get('00');
  const transactionRef = nested.get('01');
  
  if (!guid || !transactionRef) {
    return null;
  }
  
  return {
    globallyUniqueIdentifier: guid,
    transactionReference: transactionRef,
    referenceUrl: nested.get('02'),
    category: nested.get('03') as '01' | '02' | undefined,
  };
}

/**
 * Parse Existing Payment System Template (Tags 17, 28)
 */
function parseExistingPaymentSystemTemplate(value: string): ExistingPaymentSystemTemplate | null {
  const nested = parseNestedTLV(value);
  
  const guid = nested.get('00');
  const pspId = nested.get('01');
  const identifier = nested.get('02');
  
  if (!guid || !pspId || !identifier) {
    return null;
  }
  
  return {
    globallyUniqueIdentifier: guid,
    payeePspId: pspId,
    payeeIdentifier: identifier,
  };
}

/**
 * Parse Additional Data Field (Tag 62)
 */
function parseAdditionalDataField(value: string): AdditionalDataField {
  const nested = parseNestedTLV(value);
  
  const result: AdditionalDataField = {};
  
  if (nested.has(ADDITIONAL_DATA_TAGS.BILL_NUMBER)) {
    result.billNumber = nested.get(ADDITIONAL_DATA_TAGS.BILL_NUMBER);
  }
  if (nested.has(ADDITIONAL_DATA_TAGS.MOBILE_NUMBER)) {
    result.mobileNumber = nested.get(ADDITIONAL_DATA_TAGS.MOBILE_NUMBER);
  }
  if (nested.has(ADDITIONAL_DATA_TAGS.STORE_LABEL)) {
    result.storeLabel = nested.get(ADDITIONAL_DATA_TAGS.STORE_LABEL);
  }
  if (nested.has(ADDITIONAL_DATA_TAGS.LOYALTY_NUMBER)) {
    result.loyaltyNumber = nested.get(ADDITIONAL_DATA_TAGS.LOYALTY_NUMBER);
  }
  if (nested.has(ADDITIONAL_DATA_TAGS.REFERENCE_LABEL)) {
    result.referenceLabel = nested.get(ADDITIONAL_DATA_TAGS.REFERENCE_LABEL);
  }
  if (nested.has(ADDITIONAL_DATA_TAGS.CUSTOMER_LABEL)) {
    result.customerLabel = nested.get(ADDITIONAL_DATA_TAGS.CUSTOMER_LABEL);
  }
  if (nested.has(ADDITIONAL_DATA_TAGS.TERMINAL_LABEL)) {
    result.terminalLabel = nested.get(ADDITIONAL_DATA_TAGS.TERMINAL_LABEL);
  }
  if (nested.has(ADDITIONAL_DATA_TAGS.SHORT_DESCRIPTION)) {
    result.shortDescription = nested.get(ADDITIONAL_DATA_TAGS.SHORT_DESCRIPTION);
  }
  if (nested.has(ADDITIONAL_DATA_TAGS.ADDITIONAL_PAYER_DATA_REQUEST)) {
    result.additionalPayerDataRequest = nested.get(ADDITIONAL_DATA_TAGS.ADDITIONAL_PAYER_DATA_REQUEST);
  }
  if (nested.has(ADDITIONAL_DATA_TAGS.MERCHANT_TAX_ID)) {
    result.merchantTaxId = nested.get(ADDITIONAL_DATA_TAGS.MERCHANT_TAX_ID);
  }
  if (nested.has(ADDITIONAL_DATA_TAGS.PAYEE_CHANNEL)) {
    result.payeeChannel = nested.get(ADDITIONAL_DATA_TAGS.PAYEE_CHANNEL);
  }
  
  return result;
}

/**
 * Parse Template 80 (Unreserved - IPP Deep Linking)
 */
function parseTemplate80(value: string): Template80 | null {
  const nested = parseNestedTLV(value);
  
  const guid = nested.get(TEMPLATE_80_TAGS.GLOBALLY_UNIQUE_IDENTIFIER);
  const initiationMode = nested.get(TEMPLATE_80_TAGS.INITIATION_MODE);
  
  if (!guid || !initiationMode) {
    return null;
  }
  
  const baseAmountStr = nested.get(TEMPLATE_80_TAGS.BASE_AMOUNT);
  
  return {
    globallyUniqueIdentifier: guid,
    initiationMode: initiationMode as InitiationMode,
    purpose: nested.get(TEMPLATE_80_TAGS.PURPOSE) as Purpose | undefined,
    merchantType: nested.get(TEMPLATE_80_TAGS.MERCHANT_TYPE) as 'LARGE' | 'SMALL' | undefined,
    merchantGenre: nested.get(TEMPLATE_80_TAGS.MERCHANT_GENRE) as 'ONLINE' | 'OFFLINE' | undefined,
    merchantOnboardingType: nested.get(TEMPLATE_80_TAGS.MERCHANT_ONBOARDING_TYPE) as any,
    merchantBrand: nested.get(TEMPLATE_80_TAGS.MERCHANT_BRAND),
    baseAmount: baseAmountStr ? parseFloat(baseAmountStr) : undefined,
    baseCurrency: nested.get(TEMPLATE_80_TAGS.BASE_CURRENCY),
  };
}

/**
 * Parse Template 81 (Invoice Information)
 */
function parseTemplate81(value: string): Template81 | null {
  const nested = parseNestedTLV(value);
  
  const guid = nested.get(TEMPLATE_81_TAGS.GLOBALLY_UNIQUE_IDENTIFIER);
  
  if (!guid) {
    return null;
  }
  
  return {
    globallyUniqueIdentifier: guid,
    invoiceDate: nested.get(TEMPLATE_81_TAGS.INVOICE_DATE),
    invoiceName: nested.get(TEMPLATE_81_TAGS.INVOICE_NAME),
  };
}

/**
 * Parse Template 82 (Transaction Details)
 */
function parseTemplate82(value: string): Template82 | null {
  const nested = parseNestedTLV(value);
  
  const guid = nested.get(TEMPLATE_82_TAGS.GLOBALLY_UNIQUE_IDENTIFIER);
  
  if (!guid) {
    return null;
  }
  
  return {
    globallyUniqueIdentifier: guid,
    transactionId: nested.get(TEMPLATE_82_TAGS.TRANSACTION_ID),
    namqrExpiry: nested.get(TEMPLATE_82_TAGS.NAMQR_EXPIRY),
    namqrCreationTimestamp: nested.get(TEMPLATE_82_TAGS.NAMQR_CREATION_TIMESTAMP),
    tier: nested.get(TEMPLATE_82_TAGS.TIER) as any,
    transactionType: nested.get(TEMPLATE_82_TAGS.TRANSACTION_TYPE) as any,
    consent: nested.get(TEMPLATE_82_TAGS.CONSENT),
  };
}

/**
 * Parse Template 83 (Mandate Information)
 */
function parseTemplate83(value: string): Template83 | null {
  const nested = parseNestedTLV(value);
  
  const guid = nested.get(TEMPLATE_83_TAGS.GLOBALLY_UNIQUE_IDENTIFIER);
  const mandateName = nested.get(TEMPLATE_83_TAGS.MANDATE_NAME);
  const validityStart = nested.get(TEMPLATE_83_TAGS.VALIDITY_START);
  const validityEnd = nested.get(TEMPLATE_83_TAGS.VALIDITY_END);
  const recurrence = nested.get(TEMPLATE_83_TAGS.RECURRENCE);
  
  if (!guid || !mandateName || !validityStart || !validityEnd || !recurrence) {
    return null;
  }
  
  return {
    globallyUniqueIdentifier: guid,
    mandateName,
    mandateType: nested.get(TEMPLATE_83_TAGS.MANDATE_TYPE),
    validityStart,
    validityEnd,
    amountRule: nested.get(TEMPLATE_83_TAGS.AMOUNT_RULE) as 'MAX' | 'EXACT' | undefined,
    recurrence: recurrence as RecurrenceFrequency,
    recurrenceRuleValue: nested.get(TEMPLATE_83_TAGS.RECURRENCE_RULE_VALUE),
    recurrenceRuleType: nested.get(TEMPLATE_83_TAGS.RECURRENCE_RULE_TYPE) as any,
    revocable: nested.get(TEMPLATE_83_TAGS.REVOCABLE) as 'Y' | 'N' | undefined,
    shareToPayee: nested.get(TEMPLATE_83_TAGS.SHARE_TO_PAYEE) as 'Y' | 'N' | undefined,
    block: nested.get(TEMPLATE_83_TAGS.BLOCK) as 'Y' | 'N' | undefined,
    umn: nested.get(TEMPLATE_83_TAGS.UMN),
    skip: nested.get(TEMPLATE_83_TAGS.SKIP),
  };
}

/**
 * Parse a NAMQR code string into structured data
 * 
 * @param qrString - The NAMQR code string to parse
 * @returns Parse result with structured data or errors
 */
export function parseNAMQRCode(qrString: string): NAMQRParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!qrString || qrString.length === 0) {
    errors.push('Empty QR code string');
    return { success: false, errors, warnings };
  }
  
  // Parse all TLV objects
  const tlvObjects = parseTLVObjects(qrString);
  
  if (tlvObjects.length === 0) {
    errors.push('No TLV objects found in QR code');
    return { success: false, errors, warnings, rawTlvObjects: [] };
  }
  
  // Create a map for easy lookup
  const tlvMap = new Map<string, string>();
  for (const tlv of tlvObjects) {
    tlvMap.set(tlv.tag, tlv.value);
  }
  
  // Validate CRC
  const crcResult = validateCRC16(qrString);
  if (!crcResult.isValid) {
    errors.push(`CRC validation failed. Expected: ${crcResult.expectedCrc}, Got: ${crcResult.actualCrc}`);
  }
  
  // Parse mandatory fields
  const payloadFormatIndicator = tlvMap.get(NAMQR_TAGS.PAYLOAD_FORMAT_INDICATOR);
  if (!payloadFormatIndicator) {
    errors.push('Missing Payload Format Indicator (tag 00)');
  } else if (payloadFormatIndicator !== '01' && payloadFormatIndicator !== '99') {
    warnings.push(`Unexpected Payload Format Indicator: ${payloadFormatIndicator}`);
  }
  
  const pointOfInitiationMethod = tlvMap.get(NAMQR_TAGS.POINT_OF_INITIATION_METHOD);
  if (!pointOfInitiationMethod) {
    errors.push('Missing Point of Initiation Method (tag 01)');
  }
  
  const merchantCategoryCode = tlvMap.get(NAMQR_TAGS.MERCHANT_CATEGORY_CODE);
  if (!merchantCategoryCode) {
    errors.push('Missing Merchant Category Code (tag 52)');
  }
  
  const countryCode = tlvMap.get(NAMQR_TAGS.COUNTRY_CODE);
  if (!countryCode) {
    errors.push('Missing Country Code (tag 58)');
  }
  
  const payeeName = tlvMap.get(NAMQR_TAGS.PAYEE_NAME);
  if (!payeeName) {
    errors.push('Missing Payee Name (tag 59)');
  }
  
  const payeeCity = tlvMap.get(NAMQR_TAGS.PAYEE_CITY);
  if (!payeeCity) {
    errors.push('Missing Payee City (tag 60)');
  }
  
  const tokenVaultUniqueId = tlvMap.get(NAMQR_TAGS.TOKEN_VAULT_UNIQUE_ID);
  if (!tokenVaultUniqueId) {
    warnings.push('Missing Token Vault Unique ID (tag 65)');
  }
  
  if (errors.length > 0) {
    return { success: false, errors, warnings, rawTlvObjects: tlvObjects };
  }
  
  // Build the NAMQRCode object
  const data: NAMQRCode = {
    payloadFormatIndicator: payloadFormatIndicator as '01' | '99',
    pointOfInitiationMethod: pointOfInitiationMethod as PointOfInitiationMethod,
    merchantCategoryCode: merchantCategoryCode!,
    countryCode: countryCode!,
    payeeName: payeeName!,
    payeeCity: payeeCity!,
    tokenVaultUniqueId: tokenVaultUniqueId || '',
  };
  
  // Parse optional fields
  if (tlvMap.has(NAMQR_TAGS.TRANSACTION_CURRENCY)) {
    data.transactionCurrency = tlvMap.get(NAMQR_TAGS.TRANSACTION_CURRENCY);
  }
  
  if (tlvMap.has(NAMQR_TAGS.TRANSACTION_AMOUNT)) {
    const amountStr = tlvMap.get(NAMQR_TAGS.TRANSACTION_AMOUNT);
    data.transactionAmount = amountStr ? parseFloat(amountStr) : undefined;
  }
  
  if (tlvMap.has(NAMQR_TAGS.TIP_CONVENIENCE_INDICATOR)) {
    data.tipConvenienceIndicator = tlvMap.get(NAMQR_TAGS.TIP_CONVENIENCE_INDICATOR) as TipConvenienceIndicator;
  }
  
  if (tlvMap.has(NAMQR_TAGS.CONVENIENCE_FEE_FIXED)) {
    const feeStr = tlvMap.get(NAMQR_TAGS.CONVENIENCE_FEE_FIXED);
    data.convenienceFeeFixed = feeStr ? parseFloat(feeStr) : undefined;
  }
  
  if (tlvMap.has(NAMQR_TAGS.CONVENIENCE_FEE_PERCENTAGE)) {
    const feeStr = tlvMap.get(NAMQR_TAGS.CONVENIENCE_FEE_PERCENTAGE);
    data.convenienceFeePercentage = feeStr ? parseFloat(feeStr) : undefined;
  }
  
  if (tlvMap.has(NAMQR_TAGS.POSTAL_CODE)) {
    data.postalCode = tlvMap.get(NAMQR_TAGS.POSTAL_CODE);
  }
  
  if (tlvMap.has(NAMQR_TAGS.DIGITAL_SIGNATURE)) {
    data.digitalSignature = tlvMap.get(NAMQR_TAGS.DIGITAL_SIGNATURE);
  }
  
  if (tlvMap.has(NAMQR_TAGS.CRC)) {
    data.crc = tlvMap.get(NAMQR_TAGS.CRC);
  }
  
  // Parse templates
  if (tlvMap.has(NAMQR_TAGS.IPP_PAYEE_ALIAS)) {
    data.ippPayeeAlias = parseIPPAliasTemplate(tlvMap.get(NAMQR_TAGS.IPP_PAYEE_ALIAS)!) || undefined;
  }
  
  if (tlvMap.has(NAMQR_TAGS.IPP_PAYEE_REFERENCE)) {
    data.ippPayeeReference = parseIPPReferenceTemplate(tlvMap.get(NAMQR_TAGS.IPP_PAYEE_REFERENCE)!) || undefined;
  }
  
  if (tlvMap.has(NAMQR_TAGS.PAYER_EXISTING_SYSTEM)) {
    data.existingPaymentSystemPayer = parseExistingPaymentSystemTemplate(tlvMap.get(NAMQR_TAGS.PAYER_EXISTING_SYSTEM)!) || undefined;
  }
  
  if (tlvMap.has(NAMQR_TAGS.IPP_PAYER_ALIAS)) {
    data.ippPayerAlias = parseIPPAliasTemplate(tlvMap.get(NAMQR_TAGS.IPP_PAYER_ALIAS)!) || undefined;
  }
  
  if (tlvMap.has(NAMQR_TAGS.PAYEE_EXISTING_SYSTEM)) {
    data.existingPaymentSystemPayee = parseExistingPaymentSystemTemplate(tlvMap.get(NAMQR_TAGS.PAYEE_EXISTING_SYSTEM)!) || undefined;
  }
  
  if (tlvMap.has(NAMQR_TAGS.ADDITIONAL_DATA_FIELD)) {
    data.additionalDataField = parseAdditionalDataField(tlvMap.get(NAMQR_TAGS.ADDITIONAL_DATA_FIELD)!);
  }
  
  if (tlvMap.has(NAMQR_TAGS.UNRESERVED_TEMPLATE_80)) {
    data.template80 = parseTemplate80(tlvMap.get(NAMQR_TAGS.UNRESERVED_TEMPLATE_80)!) || undefined;
  }
  
  if (tlvMap.has(NAMQR_TAGS.UNRESERVED_TEMPLATE_81)) {
    data.template81 = parseTemplate81(tlvMap.get(NAMQR_TAGS.UNRESERVED_TEMPLATE_81)!) || undefined;
  }
  
  if (tlvMap.has(NAMQR_TAGS.UNRESERVED_TEMPLATE_82)) {
    data.template82 = parseTemplate82(tlvMap.get(NAMQR_TAGS.UNRESERVED_TEMPLATE_82)!) || undefined;
  }
  
  if (tlvMap.has(NAMQR_TAGS.UNRESERVED_TEMPLATE_83)) {
    data.template83 = parseTemplate83(tlvMap.get(NAMQR_TAGS.UNRESERVED_TEMPLATE_83)!) || undefined;
  }
  
  return {
    success: true,
    data,
    errors,
    warnings,
    rawTlvObjects: tlvObjects,
  };
}

/**
 * Extract basic payment information from a NAMQR code
 * 
 * @param qrString - The NAMQR code string
 * @returns Basic payment info or null if parsing failed
 */
export function extractPaymentInfo(qrString: string): {
  payeeName: string;
  amount?: number;
  currency?: string;
  reference?: string;
  isStatic: boolean;
} | null {
  const result = parseNAMQRCode(qrString);
  
  if (!result.success || !result.data) {
    return null;
  }
  
  const data = result.data;
  const isStatic = data.pointOfInitiationMethod === PointOfInitiationMethod.PAYEE_STATIC ||
                   data.pointOfInitiationMethod === PointOfInitiationMethod.PAYER_STATIC;
  
  return {
    payeeName: data.payeeName,
    amount: data.transactionAmount,
    currency: data.transactionCurrency,
    reference: data.additionalDataField?.referenceLabel,
    isStatic,
  };
}
