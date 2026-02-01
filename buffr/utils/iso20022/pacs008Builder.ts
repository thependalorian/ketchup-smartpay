/**
 * pacs.008 Payment Message Builder
 * 
 * Location: utils/iso20022/pacs008Builder.ts
 * Purpose: Build ISO 20022 pacs.008 (Customer Credit Transfer) messages
 * 
 * === PMPG COMPLIANCE - NOVEMBER 2025 DEADLINE ===
 * 
 * pacs.008 replaces MT103/MT103 STP messages after November 22, 2025.
 * This builder creates compliant payment messages for interbank transfers.
 * 
 * Message Flow:
 * MT103/MT103 STP → pacs.008 (Customer Credit Transfer)
 * 
 * Key Requirements:
 * - Structured postal addresses (hybrid format from November 2025)
 * - ISO 3166-1 Alpha-2 country codes
 * - CBPR+ compliance for cross-border payments
 * - UETR (Unique End-to-end Transaction Reference) for tracking
 */

import type {
  Pacs008Message,
  CreditTransferTransactionInfo,
  ISO20022PostalAddress,
  PartyIdentification,
  ActiveCurrencyAndAmount,
  PaymentIdentification,
  MessageValidationResult,
  ValidationError,
  ValidationWarning,
} from '../../types/iso20022';

import { validatePostalAddress, normalizePostalAddress } from './addressValidator';

// ============================================================================
// MESSAGE BUILDER
// ============================================================================

/**
 * Input data for building a pacs.008 message from Buffr transaction
 */
export interface Pacs008BuilderInput {
  /**
   * Buffr transaction ID
   */
  transactionId: string;

  /**
   * Amount and currency
   */
  amount: number;
  currency: 'NAD' | 'ZAR' | 'USD' | 'EUR' | string;

  /**
   * Sender (Debtor) information
   */
  sender: {
    name: string;
    buffrId?: string;
    accountId?: string;
    address?: Partial<ISO20022PostalAddress>;
  };

  /**
   * Recipient (Creditor) information
   */
  recipient: {
    name: string;
    buffrId?: string;
    accountId?: string;
    address?: Partial<ISO20022PostalAddress>;
  };

  /**
   * Payment reference/note
   */
  reference?: string;

  /**
   * Payment purpose code
   */
  purposeCode?: string;

  /**
   * Is cross-border payment
   */
  isCrossBorder?: boolean;

  /**
   * Sender's bank BIC (optional, defaults to Buffr's bank)
   */
  senderBankBIC?: string;

  /**
   * Recipient's bank BIC (optional)
   */
  recipientBankBIC?: string;

  /**
   * Charge bearer
   */
  chargeBearer?: 'DEBT' | 'CRED' | 'SHAR' | 'SLEV';

  /**
   * Requested execution date (ISO format)
   */
  requestedExecutionDate?: string;
}

/**
 * Result of building a pacs.008 message
 */
export interface Pacs008BuilderResult {
  success: boolean;
  message?: Pacs008Message;
  xml?: string;
  json?: string;
  validation: MessageValidationResult;
}

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 14);
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `BUFFR${timestamp}${random}`;
}

/**
 * Generate UETR (Unique End-to-end Transaction Reference)
 * UUID v4 format required for cross-border payments
 */
function generateUETR(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate payment identification
 */
function generatePaymentIdentification(
  transactionId: string,
  isCrossBorder: boolean
): PaymentIdentification {
  const identification: PaymentIdentification = {
    instructionId: `BUFFR-${transactionId.substring(0, 16)}`,
    endToEndId: transactionId,
    txId: `TX-${transactionId}`,
  };

  // UETR required for cross-border payments
  if (isCrossBorder) {
    identification.uetr = generateUETR();
  }

  return identification;
}

/**
 * Format amount for ISO 20022 (string with 2 decimal places)
 */
function formatAmount(amount: number, currency: string): ActiveCurrencyAndAmount {
  return {
    currency,
    amount: amount.toFixed(2),
  };
}

/**
 * Build party identification from input
 */
function buildPartyIdentification(
  input: {
    name: string;
    buffrId?: string;
    accountId?: string;
    address?: Partial<ISO20022PostalAddress>;
  },
  errors: ValidationError[],
  warnings: ValidationWarning[]
): PartyIdentification {
  const party: PartyIdentification = {
    name: input.name,
  };

  // Validate and add address if provided
  if (input.address) {
    const addressValidation = validatePostalAddress(input.address);
    
    if (addressValidation.isValid && addressValidation.normalizedAddress) {
      party.postalAddress = addressValidation.normalizedAddress;
    } else {
      addressValidation.errors.forEach(err => {
        errors.push({
          field: 'address',
          code: 'ADDR001',
          message: err,
          severity: 'error',
        });
      });
    }
    
    addressValidation.warnings.forEach(warn => {
      warnings.push({
        field: 'address',
        code: 'ADDR_WARN',
        message: warn,
        severity: 'warning',
      });
    });
  } else {
    warnings.push({
      field: 'address',
      code: 'ADDR002',
      message: 'Postal address is recommended for ISO 20022 compliance',
      severity: 'warning',
    });
  }

  // Add private identification if Buffr ID provided
  if (input.buffrId) {
    party.privateId = {
      other: {
        id: input.buffrId,
        schemeName: {
          proprietary: 'BUFFRID',
        },
        issuer: 'BUFFR',
      },
    };
  }

  return party;
}

/**
 * Build pacs.008 message from Buffr transaction data
 */
export function buildPacs008Message(input: Pacs008BuilderInput): Pacs008BuilderResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate required fields
  if (!input.transactionId) {
    errors.push({
      field: 'transactionId',
      code: 'TXID001',
      message: 'Transaction ID is required',
      severity: 'error',
    });
  }

  if (!input.amount || input.amount <= 0) {
    errors.push({
      field: 'amount',
      code: 'AMT001',
      message: 'Valid positive amount is required',
      severity: 'error',
    });
  }

  if (!input.sender?.name) {
    errors.push({
      field: 'sender.name',
      code: 'SNDR001',
      message: 'Sender name is required',
      severity: 'error',
    });
  }

  if (!input.recipient?.name) {
    errors.push({
      field: 'recipient.name',
      code: 'RCPT001',
      message: 'Recipient name is required',
      severity: 'error',
    });
  }

  // If there are validation errors, return early
  if (errors.length > 0) {
    return {
      success: false,
      validation: {
        isValid: false,
        errors,
        warnings,
      },
    };
  }

  // Build party identifications
  const debtor = buildPartyIdentification(input.sender, errors, warnings);
  const creditor = buildPartyIdentification(input.recipient, errors, warnings);

  // Build credit transfer transaction info
  const ctxTxInfo: CreditTransferTransactionInfo = {
    paymentId: generatePaymentIdentification(
      input.transactionId,
      input.isCrossBorder || false
    ),
    interbankSettlementAmount: formatAmount(input.amount, input.currency),
    chargeBearer: input.chargeBearer || 'SHAR',
    debtor,
    creditor,
  };

  // Add debtor account if provided
  if (input.sender.accountId) {
    ctxTxInfo.debtorAccount = {
      other: {
        id: input.sender.accountId,
        schemeName: 'BUFFR',
      },
    };
  }

  // Add creditor account if provided
  if (input.recipient.accountId) {
    ctxTxInfo.creditorAccount = {
      other: {
        id: input.recipient.accountId,
        schemeName: 'BUFFR',
      },
    };
  }

  // Add bank information if provided
  if (input.senderBankBIC) {
    ctxTxInfo.debtorAgent = {
      financialInstitutionId: {
        bic: input.senderBankBIC,
      },
    };
  }

  if (input.recipientBankBIC) {
    ctxTxInfo.creditorAgent = {
      financialInstitutionId: {
        bic: input.recipientBankBIC,
      },
    };
  }

  // Add purpose if provided
  if (input.purposeCode) {
    ctxTxInfo.purpose = {
      code: input.purposeCode,
    };
  }

  // Add remittance information if reference provided
  if (input.reference) {
    ctxTxInfo.remittanceInfo = {
      unstructured: [input.reference.substring(0, 140)], // Max 140 chars per line
    };
  }

  // Build the pacs.008 message
  const now = new Date().toISOString();
  const message: Pacs008Message = {
    groupHeader: {
      msgId: generateMessageId(),
      creationDateTime: now,
      numberOfTransactions: 1,
      settlementMethod: 'CLRG', // Clearing system
      totalInterbankSettlementAmount: formatAmount(input.amount, input.currency),
      interbankSettlementDate: input.requestedExecutionDate || now.split('T')[0],
    },
    creditTransferTransactionInfo: [ctxTxInfo],
  };

  // Return success result
  return {
    success: true,
    message,
    json: JSON.stringify(message, null, 2),
    validation: {
      isValid: errors.length === 0,
      errors,
      warnings,
    },
  };
}

/**
 * Convert pacs.008 message to XML format
 * (Simplified XML generation - in production, use proper XML library)
 */
export function pacs008ToXML(message: Pacs008Message): string {
  const xml: string[] = [];
  
  xml.push('<?xml version="1.0" encoding="UTF-8"?>');
  xml.push('<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">');
  xml.push('  <FIToFICstmrCdtTrf>');
  
  // Group Header
  xml.push('    <GrpHdr>');
  xml.push(`      <MsgId>${escapeXML(message.groupHeader.msgId)}</MsgId>`);
  xml.push(`      <CreDtTm>${message.groupHeader.creationDateTime}</CreDtTm>`);
  xml.push(`      <NbOfTxs>${message.groupHeader.numberOfTransactions}</NbOfTxs>`);
  xml.push(`      <SttlmInf>`);
  xml.push(`        <SttlmMtd>${message.groupHeader.settlementMethod}</SttlmMtd>`);
  xml.push(`      </SttlmInf>`);
  if (message.groupHeader.totalInterbankSettlementAmount) {
    xml.push(`      <TtlIntrBkSttlmAmt Ccy="${message.groupHeader.totalInterbankSettlementAmount.currency}">${message.groupHeader.totalInterbankSettlementAmount.amount}</TtlIntrBkSttlmAmt>`);
  }
  if (message.groupHeader.interbankSettlementDate) {
    xml.push(`      <IntrBkSttlmDt>${message.groupHeader.interbankSettlementDate}</IntrBkSttlmDt>`);
  }
  xml.push('    </GrpHdr>');
  
  // Credit Transfer Transaction Information
  for (const txInfo of message.creditTransferTransactionInfo) {
    xml.push('    <CdtTrfTxInf>');
    
    // Payment ID
    xml.push('      <PmtId>');
    xml.push(`        <InstrId>${escapeXML(txInfo.paymentId.instructionId)}</InstrId>`);
    xml.push(`        <EndToEndId>${escapeXML(txInfo.paymentId.endToEndId)}</EndToEndId>`);
    if (txInfo.paymentId.uetr) {
      xml.push(`        <UETR>${txInfo.paymentId.uetr}</UETR>`);
    }
    xml.push('      </PmtId>');
    
    // Amount
    xml.push(`      <IntrBkSttlmAmt Ccy="${txInfo.interbankSettlementAmount.currency}">${txInfo.interbankSettlementAmount.amount}</IntrBkSttlmAmt>`);
    
    // Charge Bearer
    xml.push(`      <ChrgBr>${txInfo.chargeBearer}</ChrgBr>`);
    
    // Debtor
    xml.push('      <Dbtr>');
    xml.push(`        <Nm>${escapeXML(txInfo.debtor.name)}</Nm>`);
    if (txInfo.debtor.postalAddress) {
      xml.push(formatAddressXML(txInfo.debtor.postalAddress, '        '));
    }
    xml.push('      </Dbtr>');
    
    // Debtor Account
    if (txInfo.debtorAccount?.other) {
      xml.push('      <DbtrAcct>');
      xml.push('        <Id>');
      xml.push('          <Othr>');
      xml.push(`            <Id>${escapeXML(txInfo.debtorAccount.other.id)}</Id>`);
      xml.push('          </Othr>');
      xml.push('        </Id>');
      xml.push('      </DbtrAcct>');
    }
    
    // Debtor Agent
    if (txInfo.debtorAgent) {
      xml.push('      <DbtrAgt>');
      xml.push('        <FinInstnId>');
      xml.push(`          <BICFI>${txInfo.debtorAgent.financialInstitutionId.bic}</BICFI>`);
      xml.push('        </FinInstnId>');
      xml.push('      </DbtrAgt>');
    }
    
    // Creditor Agent
    if (txInfo.creditorAgent) {
      xml.push('      <CdtrAgt>');
      xml.push('        <FinInstnId>');
      xml.push(`          <BICFI>${txInfo.creditorAgent.financialInstitutionId.bic}</BICFI>`);
      xml.push('        </FinInstnId>');
      xml.push('      </CdtrAgt>');
    }
    
    // Creditor
    xml.push('      <Cdtr>');
    xml.push(`        <Nm>${escapeXML(txInfo.creditor.name)}</Nm>`);
    if (txInfo.creditor.postalAddress) {
      xml.push(formatAddressXML(txInfo.creditor.postalAddress, '        '));
    }
    xml.push('      </Cdtr>');
    
    // Creditor Account
    if (txInfo.creditorAccount?.other) {
      xml.push('      <CdtrAcct>');
      xml.push('        <Id>');
      xml.push('          <Othr>');
      xml.push(`            <Id>${escapeXML(txInfo.creditorAccount.other.id)}</Id>`);
      xml.push('          </Othr>');
      xml.push('        </Id>');
      xml.push('      </CdtrAcct>');
    }
    
    // Remittance Information
    if (txInfo.remittanceInfo?.unstructured) {
      xml.push('      <RmtInf>');
      for (const line of txInfo.remittanceInfo.unstructured) {
        xml.push(`        <Ustrd>${escapeXML(line)}</Ustrd>`);
      }
      xml.push('      </RmtInf>');
    }
    
    xml.push('    </CdtTrfTxInf>');
  }
  
  xml.push('  </FIToFICstmrCdtTrf>');
  xml.push('</Document>');
  
  return xml.join('\n');
}

/**
 * Format postal address as XML
 */
function formatAddressXML(address: ISO20022PostalAddress, indent: string): string {
  const lines: string[] = [];
  lines.push(`${indent}<PstlAdr>`);
  
  if (address.streetName) {
    lines.push(`${indent}  <StrtNm>${escapeXML(address.streetName)}</StrtNm>`);
  }
  if (address.buildingNumber) {
    lines.push(`${indent}  <BldgNb>${escapeXML(address.buildingNumber)}</BldgNb>`);
  }
  if (address.postCode) {
    lines.push(`${indent}  <PstCd>${escapeXML(address.postCode)}</PstCd>`);
  }
  lines.push(`${indent}  <TwnNm>${escapeXML(address.townName)}</TwnNm>`);
  if (address.countrySubDivision) {
    lines.push(`${indent}  <CtrySubDvsn>${escapeXML(address.countrySubDivision)}</CtrySubDvsn>`);
  }
  lines.push(`${indent}  <Ctry>${address.country}</Ctry>`);
  
  lines.push(`${indent}</PstlAdr>`);
  return lines.join('\n');
}

/**
 * Escape special XML characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Validate a pacs.008 message for CBPR+ compliance
 */
export function validatePacs008ForCBPRPlus(message: Pacs008Message): MessageValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check UETR for cross-border
  for (const txInfo of message.creditTransferTransactionInfo) {
    if (!txInfo.paymentId.uetr) {
      warnings.push({
        field: 'paymentId.uetr',
        code: 'UETR001',
        message: 'UETR is recommended for cross-border payments and may be required by some correspondents',
        severity: 'warning',
      });
    }

    // Check debtor address
    if (!txInfo.debtor.postalAddress) {
      errors.push({
        field: 'debtor.postalAddress',
        code: 'DBTR_ADDR001',
        message: 'Debtor postal address is required for CBPR+ compliance',
        severity: 'error',
      });
    } else {
      const validation = validatePostalAddress(txInfo.debtor.postalAddress);
      if (!validation.isValid) {
        validation.errors.forEach(err => {
          errors.push({
            field: 'debtor.postalAddress',
            code: 'DBTR_ADDR002',
            message: err,
            severity: 'error',
          });
        });
      }
    }

    // Check creditor address
    if (!txInfo.creditor.postalAddress) {
      errors.push({
        field: 'creditor.postalAddress',
        code: 'CDTR_ADDR001',
        message: 'Creditor postal address is required for CBPR+ compliance',
        severity: 'error',
      });
    } else {
      const validation = validatePostalAddress(txInfo.creditor.postalAddress);
      if (!validation.isValid) {
        validation.errors.forEach(err => {
          errors.push({
            field: 'creditor.postalAddress',
            code: 'CDTR_ADDR002',
            message: err,
            severity: 'error',
          });
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
