/**
 * NAMQR Code Standards v5.0 Type Definitions
 * 
 * Based on Bank of Namibia NAMQR Code Standards Version 5.0 (09 May 2025)
 * Aligned with EMVCo QR Code specifications and IPP (Instant Payment Project)
 * 
 * @file types/namqr.ts
 * @version 5.0
 */

// =============================================================================
// NAMQR Tag Definitions
// =============================================================================

/** NAMQR Standard Tags (00-99) */
export const NAMQR_TAGS = {
  // Core Tags
  PAYLOAD_FORMAT_INDICATOR: '00',
  POINT_OF_INITIATION_METHOD: '01',
  
  // Card Payment Networks (02-16)
  VISA_1: '02',
  VISA_2: '03',
  MASTERCARD_1: '04',
  MASTERCARD_2: '05',
  NAMIBIA_DOMESTIC_1: '06',
  NAMIBIA_DOMESTIC_2: '07',
  NAMQR_OPERATOR: '08',
  DISCOVER_1: '09',
  DISCOVER_2: '10',
  AMEX_1: '11',
  AMEX_2: '12',
  JCB_1: '13',
  JCB_2: '14',
  UNIONPAY_1: '15',
  UNIONPAY_2: '16',
  
  // Payment System Templates (17-51)
  PAYEE_EXISTING_SYSTEM: '17',
  RESERVED_DYNAMIC_18: '18',
  RESERVED_DYNAMIC_25: '25',
  IPP_PAYEE_ALIAS: '26',
  IPP_PAYEE_REFERENCE: '27',
  PAYER_EXISTING_SYSTEM: '28',
  IPP_PAYER_ALIAS: '29',
  RESERVED_DYNAMIC_30: '30',
  RESERVED_DYNAMIC_51: '51',
  
  // Transaction Information
  MERCHANT_CATEGORY_CODE: '52',
  TRANSACTION_CURRENCY: '53',
  TRANSACTION_AMOUNT: '54',
  TIP_CONVENIENCE_INDICATOR: '55',
  CONVENIENCE_FEE_FIXED: '56',
  CONVENIENCE_FEE_PERCENTAGE: '57',
  COUNTRY_CODE: '58',
  PAYEE_NAME: '59',
  PAYEE_CITY: '60',
  POSTAL_CODE: '61',
  ADDITIONAL_DATA_FIELD: '62',
  CRC: '63',
  PAYEE_LANGUAGE_TEMPLATE: '64',
  TOKEN_VAULT_UNIQUE_ID: '65',
  DIGITAL_SIGNATURE: '66',
  
  // Reserved for EMVCo (67-79)
  EMVCO_RESERVED_67: '67',
  EMVCO_RESERVED_79: '79',
  
  // Unreserved Templates (80-84)
  UNRESERVED_TEMPLATE_80: '80',
  UNRESERVED_TEMPLATE_81: '81',
  UNRESERVED_TEMPLATE_82: '82',
  UNRESERVED_TEMPLATE_83: '83',
  UNRESERVED_TEMPLATE_84: '84',
} as const;

/** Additional Data Field Sub-Tags (under tag 62) */
export const ADDITIONAL_DATA_TAGS = {
  BILL_NUMBER: '01',
  MOBILE_NUMBER: '02',
  STORE_LABEL: '03',
  LOYALTY_NUMBER: '04',
  REFERENCE_LABEL: '05',
  CUSTOMER_LABEL: '06',
  TERMINAL_LABEL: '07',
  SHORT_DESCRIPTION: '08',
  ADDITIONAL_PAYER_DATA_REQUEST: '09',
  MERCHANT_TAX_ID: '10',
  PAYEE_CHANNEL: '11',
  RESERVED_12_49: '12',
  PAYMENT_LINK: '50',
  RESERVED_51_99: '51',
} as const;

/** Template 80 Sub-Tags (Unreserved - IPP Deep Linking) */
export const TEMPLATE_80_TAGS = {
  GLOBALLY_UNIQUE_IDENTIFIER: '00',
  INITIATION_MODE: '01',
  PURPOSE: '02',
  MERCHANT_TYPE: '03',
  MERCHANT_GENRE: '04',
  MERCHANT_ONBOARDING_TYPE: '05',
  MERCHANT_BRAND: '06',
  BASE_AMOUNT: '07',
  BASE_CURRENCY: '08',
} as const;

/** Template 81 Sub-Tags (Invoice Information) */
export const TEMPLATE_81_TAGS = {
  GLOBALLY_UNIQUE_IDENTIFIER: '00',
  INVOICE_DATE: '01',
  INVOICE_NAME: '02',
} as const;

/** Template 82 Sub-Tags (Transaction Details) */
export const TEMPLATE_82_TAGS = {
  GLOBALLY_UNIQUE_IDENTIFIER: '00',
  TRANSACTION_ID: '01',
  NAMQR_EXPIRY: '02',
  NAMQR_CREATION_TIMESTAMP: '03',
  TIER: '04',
  TRANSACTION_TYPE: '05',
  CONSENT: '06',
} as const;

/** Template 83 Sub-Tags (Mandate Information) */
export const TEMPLATE_83_TAGS = {
  GLOBALLY_UNIQUE_IDENTIFIER: '00',
  MANDATE_NAME: '01',
  MANDATE_TYPE: '02',
  VALIDITY_START: '03',
  VALIDITY_END: '04',
  AMOUNT_RULE: '05',
  RECURRENCE: '06',
  RECURRENCE_RULE_VALUE: '07',
  RECURRENCE_RULE_TYPE: '08',
  REVOCABLE: '09',
  SHARE_TO_PAYEE: '10',
  BLOCK: '11',
  UMN: '12',
  SKIP: '13',
} as const;

/** Template 84 Sub-Tags (Split/Discount) */
export const TEMPLATE_84_TAGS = {
  GLOBALLY_UNIQUE_IDENTIFIER: '00',
  SPLIT: '01',
} as const;

/** IPP Template Sub-Tags (26, 27, 28, 29) */
export const IPP_TEMPLATE_TAGS = {
  GLOBALLY_UNIQUE_IDENTIFIER: '00',
  FULL_FORM_ALIAS: '01',
  ORG_ID: '02',
  MERCHANT_ID: '03',
  MINIMUM_AMOUNT: '04',
  TRANSACTION_REFERENCE: '01', // For tag 27
  REFERENCE_URL: '02',
  CATEGORY: '03',
} as const;

// =============================================================================
// Enums and Types
// =============================================================================

/** Point of Initiation Method values */
export enum PointOfInitiationMethod {
  PAYEE_STATIC = '11',
  PAYEE_DYNAMIC = '12',
  PAYER_STATIC = '13',
  PAYER_DYNAMIC = '14',
}

/** Initiation Mode values (Template 80) */
export enum InitiationMode {
  STATIC_OFFLINE = '01',
  STATIC_SECURE_OFFLINE = '02',
  STATIC_SECURE_MANDATE_OFFLINE = '13',
  DYNAMIC_OFFLINE = '15',
  DYNAMIC_SECURE_OFFLINE = '16',
  DYNAMIC_SECURE_MANDATE_OFFLINE = '17',
  ATM_QR_DYNAMIC = '18',
  ONLINE_STATIC = '19',
  ONLINE_STATIC_SECURE = '20',
  ONLINE_STATIC_MANDATE = '21',
  ONLINE_DYNAMIC = '22',
  ONLINE_DYNAMIC_SECURE = '23',
  ONLINE_DYNAMIC_SECURE_MANDATE = '24',
}

/** Purpose codes (Template 80) */
export enum Purpose {
  DEFAULT = '00',
  NAMFISA = '01',
  AMC = '02',
  TRAVEL = '03',
  HOSPITALITY = '04',
  HOSPITAL = '05',
  TELECOM = '06',
  INSURANCE = '07',
  EDUCATION = '08',
  GIFTING = '09',
  INTERNATIONAL = '11',
  METRO_ATM_NAMQR = '12',
  NON_METRO_ATM_NAMQR = '13',
  SI = '14',
  CORPORATE_DISBURSEMENT = '15',
  GOVERNMENT_VOUCHER = '18',
  PRIVATE_CORPORATE_VOUCHER = '19',
}

/** Tip/Convenience Indicator values */
export enum TipConvenienceIndicator {
  PROMPT_TIP = '01',
  FIXED_FEE = '02',
  PERCENTAGE_FEE = '03',
}

/** Payee Channel - Media (First character) */
export enum PayeeChannelMedia {
  PRINT_STICKER = '0',
  PRINT_BILL = '1',
  PRINT_MAGAZINE = '2',
  PRINT_OTHER = '3',
  SCREEN_POS = '4',
  SCREEN_WEBSITE = '5',
  SCREEN_APP = '6',
  SCREEN_OTHER = '7',
  SCREEN_ATM = '8',
  PICK_FROM_GALLERY = '9',
}

/** Payee Channel - Transaction Location (Second character) */
export enum PayeeChannelLocation {
  AT_PAYEE_PREMISES = '0',
  NOT_AT_PAYEE_PREMISES = '1',
  REMOTE_COMMERCE = '2',
  OTHER = '3',
}

/** Payee Channel - Payee Presence (Third character) */
export enum PayeeChannelPresence {
  ATTENDED = '0',
  UNATTENDED = '1',
  SEMI_ATTENDED = '2',
  OTHER = '3',
}

/** Recurrence frequency (Mandate) */
export enum RecurrenceFrequency {
  ONETIME = 'ONETIME',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  FORTNIGHTLY = 'FORTNIGHTLY',
  MONTHLY = 'MONTHLY',
  BIMONTHLY = 'BIMONTHLY',
  QUARTERLY = 'QUARTERLY',
  HALFYEARLY = 'HALFYEARLY',
  YEARLY = 'YEARLY',
  ASPRESENTED = 'ASPRESENTED',
}

/** Transaction Type */
export enum TransactionType {
  PAY = 'PAY',
  COLLECT = 'COLLECT',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  REVOKE = 'REVOKE',
  PAUSE = 'PAUSE',
  UNPAUSE = 'UNPAUSE',
}

/** Merchant Type */
export type MerchantType = 'LARGE' | 'SMALL';

/** Merchant Genre */
export type MerchantGenre = 'ONLINE' | 'OFFLINE';

/** Merchant On-boarding Type */
export type MerchantOnboardingType = 'BANK' | 'AGGREGATOR' | 'NETWORK' | 'TPAP';

/** Amount Rule for Mandates */
export type AmountRule = 'MAX' | 'EXACT';

/** Recurrence Rule Type */
export type RecurrenceRuleType = 'BEFORE' | 'ON' | 'AFTER';

/** City Tier */
export type CityTier = 'TIER1' | 'TIER2' | 'TIER3' | 'TIER4' | 'TIER5' | 'TIER6';

// =============================================================================
// Interface Definitions
// =============================================================================

/** TLV (Tag-Length-Value) data object */
export interface TLVObject {
  tag: string;
  length: number;
  value: string;
}

/** IPP Full Form Alias Template (Tags 26, 29) */
export interface IPPAliasTemplate {
  globallyUniqueIdentifier: string;
  fullFormAlias: string;
  orgId?: string;
  merchantId?: string;
  minimumAmount?: number;
}

/** IPP Reference Template (Tag 27) */
export interface IPPReferenceTemplate {
  globallyUniqueIdentifier: string;
  transactionReference: string;
  referenceUrl?: string;
  category?: '01' | '02'; // 01=Advertisement, 02=Invoice
}

/** Additional Data Field (Tag 62) */
export interface AdditionalDataField {
  billNumber?: string;
  mobileNumber?: string;
  storeLabel?: string;
  loyaltyNumber?: string;
  referenceLabel?: string;
  customerLabel?: string;
  terminalLabel?: string;
  shortDescription?: string;
  additionalPayerDataRequest?: string;
  merchantTaxId?: string;
  payeeChannel?: string;
  paymentLink?: PaymentLink;
}

/** Payment Link (Tag 62, sub-tag 50) */
export interface PaymentLink {
  globallyUniqueIdentifier: string;
  paymentUrl: string;
}

/** Payee Language Template (Tag 64) */
export interface PayeeLanguageTemplate {
  languagePreference: string; // ISO 639
  payeeNameAlternate: string;
  payeeCityAlternate?: string;
}

/** Template 80 - Unreserved (IPP Deep Linking) */
export interface Template80 {
  globallyUniqueIdentifier: string;
  initiationMode: InitiationMode;
  purpose?: Purpose;
  merchantType?: MerchantType;
  merchantGenre?: MerchantGenre;
  merchantOnboardingType?: MerchantOnboardingType;
  merchantBrand?: string;
  baseAmount?: number;
  baseCurrency?: string;
}

/** Template 81 - Invoice Information */
export interface Template81 {
  globallyUniqueIdentifier: string;
  invoiceDate?: string; // ISO DateTime
  invoiceName?: string;
}

/** Template 82 - Transaction Details */
export interface Template82 {
  globallyUniqueIdentifier: string;
  transactionId?: string;
  namqrExpiry?: string; // ISO DateTime
  namqrCreationTimestamp?: string;
  tier?: CityTier;
  transactionType?: TransactionType;
  consent?: string;
}

/** Template 83 - Mandate Information */
export interface Template83 {
  globallyUniqueIdentifier: string;
  mandateName: string;
  mandateType?: string;
  validityStart: string; // ddmmyyyy
  validityEnd: string;
  amountRule?: AmountRule;
  recurrence: RecurrenceFrequency;
  recurrenceRuleValue?: string;
  recurrenceRuleType?: RecurrenceRuleType;
  revocable?: 'Y' | 'N';
  shareToPayee?: 'Y' | 'N';
  block?: 'Y' | 'N';
  umn?: string; // Unique Mandate Number
  skip?: string;
}

/** Template 84 - Split/Discount */
export interface Template84 {
  globallyUniqueIdentifier: string;
  split?: SplitDetails;
}

/** Split Details */
export interface SplitDetails {
  discount?: number;
  discountPercent?: number;
  cashback?: number;
  cashbackPercent?: number;
  fx?: number;
  markup?: number;
}

/** Card Payment Network Template (Tags 02-16) */
export interface CardNetworkTemplate {
  globallyUniqueIdentifier: string;
  payeeAccountNumber?: string;
  expiryDate?: string;
  serviceCode?: string;
}

/** Existing Payment System Template (Tag 17, 28) */
export interface ExistingPaymentSystemTemplate {
  globallyUniqueIdentifier: string;
  payeePspId: string;
  payeeIdentifier: string;
}

// =============================================================================
// Main NAMQR Code Interface
// =============================================================================

/** Complete NAMQR Code Data Structure */
export interface NAMQRCode {
  // Core fields (mandatory)
  payloadFormatIndicator: '01' | '99';
  pointOfInitiationMethod: PointOfInitiationMethod;
  
  // Payee Account Information (at least one required for tags 02-51)
  cardNetworkTemplates?: Record<string, CardNetworkTemplate>;
  existingPaymentSystemPayee?: ExistingPaymentSystemTemplate; // Tag 17
  ippPayeeAlias?: IPPAliasTemplate; // Tag 26
  ippPayeeReference?: IPPReferenceTemplate; // Tag 27
  existingPaymentSystemPayer?: ExistingPaymentSystemTemplate; // Tag 28
  ippPayerAlias?: IPPAliasTemplate; // Tag 29
  
  // Transaction details
  merchantCategoryCode: string; // 4 digits, '0000' for P2P
  transactionCurrency?: string; // ISO 4217 numeric
  transactionAmount?: number;
  tipConvenienceIndicator?: TipConvenienceIndicator;
  convenienceFeeFixed?: number;
  convenienceFeePercentage?: number;
  
  // Location info (mandatory)
  countryCode: string; // ISO 3166-1 alpha-2
  payeeName: string; // max 25 chars
  payeeCity: string; // max 15 chars
  postalCode?: string;
  
  // Additional data
  additionalDataField?: AdditionalDataField;
  payeeLanguageTemplate?: PayeeLanguageTemplate;
  
  // Security & Validation
  tokenVaultUniqueId: string;
  digitalSignature?: string;
  crc?: string; // Calculated automatically
  
  // Unreserved Templates
  template80?: Template80;
  template81?: Template81;
  template82?: Template82;
  template83?: Template83;
  template84?: Template84;
}

/** NAMQR Generation Input */
export interface NAMQRGenerationInput {
  /** Type of QR code to generate */
  type: 'P2P' | 'P2M' | 'ATM' | 'MANDATE' | 'VOUCHER' | 'INTERNATIONAL';
  
  /** Who presents the QR */
  presenter: 'PAYEE' | 'PAYER' | 'MERCHANT' | 'CUSTOMER';
  
  /** Static or Dynamic */
  isDynamic: boolean;
  
  /** Payment stream to use */
  paymentStream: 'NRTC' | 'EnDO' | 'EnCR' | 'POSD' | 'POSC' | 'IPP' | 'ATM';
  
  /** Payee/Payer information */
  payeeInfo: {
    name: string;
    city: string;
    countryCode?: string;
    postalCode?: string;
    ippAlias?: string;
    pspId?: string;
    identifier?: string;
    merchantId?: string;
    orgId?: string;
  };
  
  /** Transaction details (for dynamic QR) */
  transaction?: {
    amount?: number;
    currency?: string; // NAD = 516
    reference?: string;
    description?: string;
    expiry?: Date;
  };
  
  /** Merchant details (for P2M) */
  merchant?: {
    mcc: string;
    storeLabel?: string;
    terminalLabel?: string;
    type?: MerchantType;
    genre?: MerchantGenre;
    onboardingType?: MerchantOnboardingType;
    brand?: string;
  };
  
  /** Mandate details (for recurring) */
  mandate?: {
    name: string;
    validityStart: Date;
    validityEnd: Date;
    recurrence: RecurrenceFrequency;
    amountRule?: AmountRule;
    revocable?: boolean;
  };
  
  /** Purpose (optional) */
  purpose?: Purpose;
  
  /** Token Vault ID (optional, can be generated) */
  tokenVaultId?: string;
}

/** NAMQR Parsing Result */
export interface NAMQRParseResult {
  success: boolean;
  data?: NAMQRCode;
  errors: string[];
  warnings: string[];
  rawTlvObjects?: TLVObject[];
}

/** NAMQR Validation Result */
export interface NAMQRValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  crcValid?: boolean;
  signatureValid?: boolean;
}

/** NAMQR Generation Result */
export interface NAMQRGenerationResult {
  success: boolean;
  qrString?: string;
  data?: NAMQRCode;
  errors: string[];
  warnings: string[];
}

// =============================================================================
// EMVCo Customer Presented Card Chip Data (when tag 00 = '99')
// =============================================================================

/** EMVCo Application Template */
export interface EMVCoApplicationTemplate {
  adfName: string; // Tag 4F
  applicationLabel?: string; // Tag 50
  track2EquivalentData?: string; // Tag 57
  applicationPan?: string; // Tag 5A
  cardholderName?: string; // Tag 5F20
  languagePreference?: string; // Tag 5F2D
  issuerUrl?: string; // Tag 5F50
  applicationVersionNumber?: string; // Tag 9F08
  tokenRequestorId?: string; // Tag 9F19
  par?: string; // Tag 9F24
  last4DigitsPan?: string; // Tag 9F25
}

/** EMVCo Customer Presented QR Data */
export interface EMVCoCustomerPresentedData {
  payloadFormatIndicator: string; // Tag 85 = 'CPV01'
  applicationTemplates: EMVCoApplicationTemplate[];
  commonDataTemplate?: Record<string, string>;
  applicationSpecificTransparent?: Record<string, string>;
  commonDataTransparent?: Record<string, string>;
}

// =============================================================================
// Constants
// =============================================================================

/** Namibia country code */
export const NAMIBIA_COUNTRY_CODE = 'NA';

/** Namibia currency code (ISO 4217 numeric) */
export const NAD_CURRENCY_CODE = '516';

/** Namibia currency code (ISO 4217 alpha) */
export const NAD_CURRENCY_ALPHA = 'NAD';

/** IPP Globally Unique Identifier */
export const IPP_GUID = 'na.com.operator.IPP';

/** NAMQR Operator GUID */
export const NAMQR_OPERATOR_GUID = 'na.com.operator.namqr';

/** NamClear NRTC GUID */
export const NAMCLEAR_NRTC_GUID = 'na.com.namclear.nrtc';

/** Maximum NAMQR payload length */
export const MAX_PAYLOAD_LENGTH = 512;

/** CRC polynomial for ISO/IEC 13239 */
export const CRC_POLYNOMIAL = 0x1021;

/** CRC initial value */
export const CRC_INITIAL_VALUE = 0xFFFF;

/** Standard MCC for P2P transactions */
export const P2P_MCC = '0000';

/** Standard Namibia bank BICs */
export const NAMIBIA_BANK_BICS = {
  BANK_WINDHOEK: 'BWNANANX',
  FNB_NAMIBIA: 'FIABORWNXXX',
  NEDBANK_NAMIBIA: 'NEDBNACCXXX',
  STANDARD_BANK_NAMIBIA: 'SBICNANX',
} as const;

export type NamibiaBankBIC = typeof NAMIBIA_BANK_BICS[keyof typeof NAMIBIA_BANK_BICS];
