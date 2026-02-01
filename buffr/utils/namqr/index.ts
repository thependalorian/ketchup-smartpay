/**
 * NAMQR Code Utilities - Main Export
 * 
 * Provides comprehensive NAMQR code generation, parsing, and validation
 * per Bank of Namibia NAMQR Code Standards v5.0.
 * 
 * @file utils/namqr/index.ts
 * @version 1.0
 */

// CRC Utilities
export {
  calculateCRC16,
  validateCRC16,
  appendCRC16,
  buildCRCTag,
} from './crc';

// Generator Utilities
export {
  generateNAMQRCode,
  generateP2PStaticQR,
  generateP2PDynamicQR,
  generateMerchantStaticQR,
  generateMerchantDynamicQR,
  generateATMWithdrawalQR,
} from './generator';

// Parser Utilities
export {
  parseNAMQRCode,
  parseTLVObjects,
  extractPaymentInfo,
} from './parser';

// Validator Utilities
export {
  validateNAMQRCode,
  validateWithTokenVault,
  validateSignedQR,
  quickValidate,
} from './validator';

// Re-export types
export type {
  NAMQRCode,
  NAMQRGenerationInput,
  NAMQRGenerationResult,
  NAMQRParseResult,
  NAMQRValidationResult,
  TLVObject,
  IPPAliasTemplate,
  IPPReferenceTemplate,
  AdditionalDataField,
  Template80,
  Template81,
  Template82,
  Template83,
  Template84,
  ExistingPaymentSystemTemplate,
  CardNetworkTemplate,
  PayeeLanguageTemplate,
  PaymentLink,
  SplitDetails,
  EMVCoApplicationTemplate,
  EMVCoCustomerPresentedData,
} from '../../types/namqr';

// Re-export enums and constants
export {
  PointOfInitiationMethod,
  InitiationMode,
  Purpose,
  TipConvenienceIndicator,
  PayeeChannelMedia,
  PayeeChannelLocation,
  PayeeChannelPresence,
  RecurrenceFrequency,
  TransactionType,
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
  NAD_CURRENCY_ALPHA,
  P2P_MCC,
  MAX_PAYLOAD_LENGTH,
  NAMIBIA_BANK_BICS,
  CRC_POLYNOMIAL,
  CRC_INITIAL_VALUE,
} from '../../types/namqr';
