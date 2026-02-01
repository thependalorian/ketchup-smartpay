/**
 * ISO 20022 Utilities Index
 * 
 * Location: utils/iso20022/index.ts
 * Purpose: Export all ISO 20022 utilities for payment message compliance
 * 
 * === PMPG COMPLIANCE - NOVEMBER 2025 DEADLINE ===
 * 
 * After November 22, 2025, FIN MT messages will no longer be accepted.
 * All interbank payments must use ISO 20022 formatted messages.
 */

// Address Validation
export {
  isValidCountryCode,
  isValidTownName,
  isValidStreetName,
  isValidBuildingNumber,
  isValidPostCode,
  validatePostalAddress,
  validateHybridAddress,
  normalizeCountryCode,
  normalizePostalAddress,
  formatAddressForDisplay,
  formatAddressMultiLine,
  createNamibianAddressTemplate,
  getCountryName,
  isFullyStructuredAddress,
  COUNTRY_NAMES,
} from './addressValidator';

// pacs.008 Message Builder
export {
  buildPacs008Message,
  pacs008ToXML,
  validatePacs008ForCBPRPlus,
} from './pacs008Builder';

export type {
  Pacs008BuilderInput,
  Pacs008BuilderResult,
} from './pacs008Builder';

// Re-export types for convenience
export type {
  ISO20022PostalAddress,
  HybridPostalAddress,
  ISO3166CountryCode,
  AddressValidationResult,
  PartyIdentification,
  ActiveCurrencyAndAmount,
  PaymentIdentification,
  Pacs008Message,
  Pain001Message,
  CreditTransferTransactionInfo,
} from '../../types/iso20022';

// Re-export constants
export {
  NAMIBIAN_BANK_BICS,
  NAMIBIAN_PAYMENT_SYSTEMS,
} from '../../types/iso20022';
