/**
 * ISO 20022 Adapter – Full ISO 20022 message support for Open Banking
 *
 * Location: backend/src/services/openbanking/ISO20022Adapter.ts
 * Purpose: Build and parse ISO 20022 (pain.001, pain.002, camt.052/053) for PIS/AIS interoperability.
 * References: CONSOLIDATED_PRD integration requirements, Namibian Open Banking Standards.
 */
export interface ISO20022PaymentInfo {
    MessageIdentification: string;
    CreationDateTime: string;
    NumberOfTransactions: number;
    ControlSum: number;
    DebtorName: string;
    DebtorAccount: {
        IBAN?: string;
        Other?: {
            Identification: string;
        };
    };
    CreditorName: string;
    CreditorAccount: {
        IBAN?: string;
        Other?: {
            Identification: string;
        };
    };
    Amount: number;
    Currency: string;
    RemittanceInformation?: string;
    EndToEndId?: string;
}
/**
 * Build ISO 20022 pain.001 (Customer Credit Transfer) payload for payment initiation.
 * Simplified schema; production would use full XSD validation.
 */
export declare function buildPain001(paymentId: string, debtorName: string, debtorAccountId: string, creditorName: string, creditorAccountId: string, amount: number, currency: string, reference?: string, endToEndId?: string): Record<string, unknown>;
/**
 * Parse ISO 20022 pain.002 (Payment Status) response.
 */
export declare function parsePain002(xmlOrJson: string | Record<string, unknown>): {
    OriginalMessageId?: string;
    Status: 'ACCP' | 'RJCT' | 'PDNG';
    StatusReason?: string;
};
/**
 * Build camt.052 (Bank-to-Customer Account Report) request for balance inquiry.
 */
export declare function buildCamt052Request(accountId: string, fromDate?: string): Record<string, unknown>;
/**
 * Build camt.053 (Bank-to-Customer Statement) for account statement / transaction list.
 * References: ISO 20022 camt.053.001.02 / camt.053.001.08.
 * When toDate is omitted, uses current time (suitable for “from date to now” queries).
 */
export declare function buildCamt053Request(accountId: string, fromDate: string, toDate?: string): Record<string, unknown>;
/**
 * Parse camt.053 (Bank-to-Customer Statement) response – entries and balances.
 */
export declare function parseCamt053(xmlOrJson: string | Record<string, unknown>): {
    accountId?: string;
    balances: {
        type: string;
        amount: number;
        currency: string;
        date: string;
    }[];
    entries: {
        amount: number;
        currency: string;
        date: string;
        creditDebit: string;
        ref?: string;
    }[];
};
/**
 * Build pacs.008 (FI to FI Customer Credit Transfer) for interbank settlement.
 * References: ISO 20022 pacs.008.001.08.
 */
export declare function buildPacs008(messageId: string, debtorBic: string, debtorAccountId: string, creditorBic: string, creditorAccountId: string, amount: number, currency: string, endToEndId: string, reference?: string): Record<string, unknown>;
/**
 * Parse pacs.008 (inbound interbank transfer) – extract key fields.
 */
export declare function parsePacs008(xmlOrJson: string | Record<string, unknown>): {
    messageId?: string;
    endToEndId?: string;
    amount?: number;
    currency?: string;
    debtorAccountId?: string;
    creditorAccountId?: string;
};
/**
 * Simple JSON to XML (ISO 20022 style). Handles @-prefixed attributes and primitives.
 * Production should use XSD-validated serialisation.
 */
export declare function jsonToXml(obj: Record<string, unknown>, rootName?: string): string;
/**
 * Simple XML to JSON (minimal). Handles trivial single-level tags only.
 * For full ISO 20022 parsing in production, use xml2js or fast-xml-parser:
 *   import xml2js from 'xml2js'; const doc = await xml2js.parseStringPromise(xml, { explicitArray: false });
 */
export declare function xmlToJson(xml: string): Record<string, unknown>;
/**
 * Validate pain.001 payload – required fields for Namibian Open Banking / ISO 20022.
 * Returns list of missing field names; empty array if valid.
 */
export declare function validatePain001(doc: Record<string, unknown>): string[];
export declare const iso20022Adapter: {
    buildPain001: typeof buildPain001;
    parsePain002: typeof parsePain002;
    buildCamt052Request: typeof buildCamt052Request;
    buildCamt053Request: typeof buildCamt053Request;
    parseCamt053: typeof parseCamt053;
    buildPacs008: typeof buildPacs008;
    parsePacs008: typeof parsePacs008;
    jsonToXml: typeof jsonToXml;
    xmlToJson: typeof xmlToJson;
    validatePain001: typeof validatePain001;
};
//# sourceMappingURL=ISO20022Adapter.d.ts.map