/**
 * ISO 20022 Type Definitions for Buffr Payment System
 * 
 * Location: types/iso20022.ts
 * Purpose: Type definitions for ISO 20022 payment messaging compliance
 * 
 * === PMPG COMPLIANCE - NOVEMBER 2025 DEADLINE ===
 * 
 * The Payments Market Practice Group (PMPG) mandates that after November 22, 2025,
 * legacy FIN MT messages will no longer be accepted. All payments must use
 * ISO 20022 formatted messages.
 * 
 * Key Message Types:
 * - pacs.008: Customer Credit Transfer (replaces MT103)
 * - pacs.009: Financial Institution Credit Transfer (replaces MT202)
 * - pain.001: Customer Credit Transfer Initiation
 * 
 * Address Requirements:
 * - Hybrid postal address format available November 2025
 * - Unstructured format retired November 2026
 * - Minimum: ISO 3166 Country Code + Town Name
 * 
 * References:
 * - PMPG "Managing the End-of-Coexistence: Key Considerations" (July 2025)
 * - ISO 20022 Universal Financial Message Scheme
 * - Swift CBPR+ Guidelines
 */

// ============================================================================
// ISO 3166-1 ALPHA-2 COUNTRY CODES (SADC + Common)
// ============================================================================

/**
 * ISO 3166-1 Alpha-2 Country Codes
 * Focus on SADC region and common international destinations
 */
export type ISO3166CountryCode =
  // SADC Countries
  | 'NA' // Namibia
  | 'ZA' // South Africa
  | 'BW' // Botswana
  | 'ZW' // Zimbabwe
  | 'MZ' // Mozambique
  | 'ZM' // Zambia
  | 'AO' // Angola
  | 'TZ' // Tanzania
  | 'MW' // Malawi
  | 'MU' // Mauritius
  | 'SC' // Seychelles
  | 'CD' // Democratic Republic of Congo
  | 'MG' // Madagascar
  | 'SZ' // Eswatini
  | 'LS' // Lesotho
  | 'KM' // Comoros
  // Common International
  | 'US' // United States
  | 'GB' // United Kingdom
  | 'DE' // Germany
  | 'FR' // France
  | 'CN' // China
  | 'IN' // India
  | 'AE' // United Arab Emirates
  | string; // Allow other valid ISO codes

// ============================================================================
// POSTAL ADDRESS TYPES (ISO 20022 Compliant)
// ============================================================================

/**
 * ISO 20022 Structured Postal Address
 * Required for all payment messages after November 2025
 * 
 * @see PMPG Hybrid Postal Address Guidance
 */
export interface ISO20022PostalAddress {
  /**
   * ISO 3166-1 Alpha-2 Country Code (REQUIRED)
   * @example "NA" for Namibia
   */
  country: ISO3166CountryCode;

  /**
   * Town/City Name (REQUIRED)
   * @example "Windhoek"
   */
  townName: string;

  /**
   * Street Name (RECOMMENDED)
   * @example "Independence Avenue"
   */
  streetName?: string;

  /**
   * Building Number (RECOMMENDED)
   * @example "123"
   */
  buildingNumber?: string;

  /**
   * Building Name (OPTIONAL)
   * @example "FNB Building"
   */
  buildingName?: string;

  /**
   * Floor Number (OPTIONAL)
   * @example "5"
   */
  floor?: string;

  /**
   * Post Box Number (OPTIONAL)
   * @example "PO Box 1234"
   */
  postBox?: string;

  /**
   * Room Number (OPTIONAL)
   * @example "Suite 301"
   */
  room?: string;

  /**
   * Post/ZIP Code (RECOMMENDED)
   * @example "10001"
   */
  postCode?: string;

  /**
   * District Name (OPTIONAL)
   * @example "Khomas"
   */
  districtName?: string;

  /**
   * Country Sub-Division (Province/State) (OPTIONAL)
   * @example "Khomas Region"
   */
  countrySubDivision?: string;

  /**
   * Department (OPTIONAL)
   * For organizations
   */
  department?: string;

  /**
   * Sub-Department (OPTIONAL)
   * For organizations
   */
  subDepartment?: string;
}

/**
 * Hybrid Postal Address (Transitional Format)
 * Allows mix of structured and unstructured elements
 * Valid until November 2026 when unstructured is retired
 */
export interface HybridPostalAddress extends Partial<ISO20022PostalAddress> {
  /**
   * ISO 3166-1 Alpha-2 Country Code (REQUIRED)
   */
  country: ISO3166CountryCode;

  /**
   * Town/City Name (REQUIRED)
   */
  townName: string;

  /**
   * Unstructured Address Lines (DEPRECATED - use structured fields)
   * Max 7 lines, max 70 characters each
   * Will be retired November 2026
   */
  addressLine?: string[];
}

// ============================================================================
// PARTY IDENTIFICATION TYPES
// ============================================================================

/**
 * Party (Debtor/Creditor) Identification
 */
export interface PartyIdentification {
  /**
   * Party Name
   * @example "George Nekwaya"
   */
  name: string;

  /**
   * Postal Address (REQUIRED for cross-border)
   */
  postalAddress?: ISO20022PostalAddress;

  /**
   * Organisation Identification (for corporates)
   */
  organisationId?: OrganisationIdentification;

  /**
   * Private Identification (for individuals)
   */
  privateId?: PrivateIdentification;

  /**
   * Country of Residence
   */
  countryOfResidence?: ISO3166CountryCode;

  /**
   * Contact Details
   */
  contactDetails?: ContactDetails;
}

/**
 * Organisation Identification
 */
export interface OrganisationIdentification {
  /**
   * Business Identifier Code (BIC)
   * @example "FIABORNANXXX"
   */
  bic?: string;

  /**
   * Legal Entity Identifier (LEI)
   * 20-character alphanumeric code
   */
  lei?: string;

  /**
   * Other identification
   */
  other?: {
    id: string;
    schemeName?: {
      code?: string;
      proprietary?: string;
    };
    issuer?: string;
  };
}

/**
 * Private (Individual) Identification
 */
export interface PrivateIdentification {
  /**
   * Date and Place of Birth
   */
  dateAndPlaceOfBirth?: {
    birthDate: string; // YYYY-MM-DD
    provinceOfBirth?: string;
    cityOfBirth?: string;
    countryOfBirth: ISO3166CountryCode;
  };

  /**
   * Other identification (Passport, National ID, etc.)
   */
  other?: {
    id: string;
    schemeName?: {
      code?: 'ARNU' | 'CCPT' | 'CUST' | 'DRLC' | 'EMPL' | 'NIDN' | 'SOSE' | 'TXID';
      proprietary?: string;
    };
    issuer?: string;
  };
}

/**
 * Contact Details
 */
export interface ContactDetails {
  /**
   * Name Prefix (e.g., Mr, Mrs, Dr)
   */
  namePrefix?: string;

  /**
   * Full Name
   */
  name?: string;

  /**
   * Phone Number (E.164 format)
   * @example "+264612345678"
   */
  phoneNumber?: string;

  /**
   * Mobile Number (E.164 format)
   */
  mobileNumber?: string;

  /**
   * Fax Number
   */
  faxNumber?: string;

  /**
   * Email Address
   */
  emailAddress?: string;

  /**
   * Other Contact (URL, social media, etc.)
   */
  other?: string;
}

// ============================================================================
// PAYMENT MESSAGE TYPES
// ============================================================================

/**
 * Currency and Amount
 */
export interface ActiveCurrencyAndAmount {
  /**
   * ISO 4217 Currency Code
   * @example "NAD" for Namibian Dollar
   */
  currency: 'NAD' | 'ZAR' | 'USD' | 'EUR' | 'GBP' | string;

  /**
   * Amount (decimal string for precision)
   * @example "1500.00"
   */
  amount: string;
}

/**
 * Payment Identification
 */
export interface PaymentIdentification {
  /**
   * Instruction Identification (unique from initiating party)
   * Max 35 characters
   */
  instructionId: string;

  /**
   * End-to-End Identification
   * Max 35 characters
   */
  endToEndId: string;

  /**
   * Transaction Identification (Buffr internal reference)
   * Max 35 characters
   */
  txId?: string;

  /**
   * UETR (Unique End-to-end Transaction Reference)
   * UUID format, required for cross-border
   */
  uetr?: string;
}

/**
 * pacs.008 - Customer Credit Transfer (FI to FI)
 * Replaces MT103/MT103 STP after November 22, 2025
 */
export interface Pacs008Message {
  /**
   * Group Header
   */
  groupHeader: {
    /**
     * Message Identification
     */
    msgId: string;

    /**
     * Creation Date Time (ISO 8601)
     */
    creationDateTime: string;

    /**
     * Number of Transactions
     */
    numberOfTransactions: number;

    /**
     * Settlement Method
     */
    settlementMethod: 'INDA' | 'INGA' | 'COVE' | 'CLRG';

    /**
     * Settlement Information
     */
    settlementInformation?: {
      settlementAccount?: string;
      clearingSystem?: string;
    };

    /**
     * Total Interbank Settlement Amount
     */
    totalInterbankSettlementAmount?: ActiveCurrencyAndAmount;

    /**
     * Interbank Settlement Date
     */
    interbankSettlementDate?: string;
  };

  /**
   * Credit Transfer Transaction Information
   */
  creditTransferTransactionInfo: CreditTransferTransactionInfo[];
}

/**
 * Credit Transfer Transaction Information
 */
export interface CreditTransferTransactionInfo {
  /**
   * Payment Identification
   */
  paymentId: PaymentIdentification;

  /**
   * Payment Type Information
   */
  paymentTypeInfo?: {
    instructionPriority?: 'HIGH' | 'NORM';
    serviceLevel?: {
      code?: 'SEPA' | 'SDVA' | 'PRPT';
      proprietary?: string;
    };
    localInstrument?: {
      code?: string;
      proprietary?: string;
    };
    categoryPurpose?: {
      code?: string;
      proprietary?: string;
    };
  };

  /**
   * Interbank Settlement Amount
   */
  interbankSettlementAmount: ActiveCurrencyAndAmount;

  /**
   * Instructed Amount (original currency if different)
   */
  instructedAmount?: ActiveCurrencyAndAmount;

  /**
   * Exchange Rate Information
   */
  exchangeRateInfo?: {
    unitCurrency?: string;
    exchangeRate?: string;
    rateType?: 'SPOT' | 'SALE' | 'AGRD';
  };

  /**
   * Charge Bearer
   */
  chargeBearer: 'DEBT' | 'CRED' | 'SHAR' | 'SLEV';

  /**
   * Instructing Agent (sender's bank)
   */
  instructingAgent?: {
    financialInstitutionId: {
      bic: string;
      name?: string;
    };
  };

  /**
   * Instructed Agent (receiver's bank)
   */
  instructedAgent?: {
    financialInstitutionId: {
      bic: string;
      name?: string;
    };
  };

  /**
   * Debtor (payer)
   */
  debtor: PartyIdentification;

  /**
   * Debtor Account
   */
  debtorAccount?: {
    iban?: string;
    other?: {
      id: string;
      schemeName?: string;
    };
  };

  /**
   * Debtor Agent (debtor's bank)
   */
  debtorAgent?: {
    financialInstitutionId: {
      bic: string;
      name?: string;
      postalAddress?: ISO20022PostalAddress;
    };
  };

  /**
   * Creditor Agent (creditor's bank)
   */
  creditorAgent?: {
    financialInstitutionId: {
      bic: string;
      name?: string;
      postalAddress?: ISO20022PostalAddress;
    };
  };

  /**
   * Creditor (payee)
   */
  creditor: PartyIdentification;

  /**
   * Creditor Account
   */
  creditorAccount?: {
    iban?: string;
    other?: {
      id: string;
      schemeName?: string;
    };
  };

  /**
   * Purpose of Payment
   */
  purpose?: {
    code?: string;
    proprietary?: string;
  };

  /**
   * Remittance Information
   */
  remittanceInfo?: {
    unstructured?: string[];
    structured?: {
      creditorReferenceInfo?: {
        type?: string;
        reference?: string;
      };
    };
  };
}

/**
 * pain.001 - Customer Credit Transfer Initiation
 * Payment initiation from customer to bank
 */
export interface Pain001Message {
  /**
   * Group Header
   */
  groupHeader: {
    msgId: string;
    creationDateTime: string;
    numberOfTransactions: number;
    controlSum?: string;
    initiatingParty: PartyIdentification;
  };

  /**
   * Payment Information
   */
  paymentInfo: PaymentInformation[];
}

/**
 * Payment Information Block
 */
export interface PaymentInformation {
  /**
   * Payment Information Identification
   */
  paymentInfoId: string;

  /**
   * Payment Method
   */
  paymentMethod: 'CHK' | 'TRF' | 'TRA';

  /**
   * Batch Booking
   */
  batchBooking?: boolean;

  /**
   * Requested Execution Date
   */
  requestedExecutionDate: string;

  /**
   * Debtor (initiating party)
   */
  debtor: PartyIdentification;

  /**
   * Debtor Account
   */
  debtorAccount: {
    iban?: string;
    other?: {
      id: string;
      schemeName?: string;
    };
    currency?: string;
  };

  /**
   * Debtor Agent
   */
  debtorAgent: {
    financialInstitutionId: {
      bic: string;
    };
  };

  /**
   * Credit Transfer Transaction Information
   */
  creditTransferTransactionInfo: CreditTransferTransactionInfo[];
}

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

/**
 * Address Validation Result
 */
export interface AddressValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  normalizedAddress?: ISO20022PostalAddress;
}

/**
 * Message Validation Result
 */
export interface MessageValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation Error
 */
export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error';
}

/**
 * Validation Warning
 */
export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  severity: 'warning';
}

// ============================================================================
// NAMIBIAN BANKING IDENTIFIERS
// ============================================================================

/**
 * Namibian Commercial Bank BICs
 */
export const NAMIBIAN_BANK_BICS = {
  BANK_WINDHOEK: 'BABORNANXXX',
  FNB_NAMIBIA: 'FIABORNANXXX',
  NEDBANK_NAMIBIA: 'NEDBNANNXXX',
  STANDARD_BANK: 'SABORNANXXX',
  LETSHEGO: 'LETHNANNXXX',
  TRUSTCO: 'TRUSTNANNXX',
  NAMPOST: 'NPOSTNANXXX',
} as const;

/**
 * Namibian Payment System Identifiers
 */
export const NAMIBIAN_PAYMENT_SYSTEMS = {
  NAMCLEAR: 'NAMCLEAR', // National Clearing System
  IPP: 'NAMIPPE', // Instant Payment Project
  RTGS: 'NAMGRTGS', // Real-Time Gross Settlement
} as const;
