/**
 * ISO 20022 Adapter – Full ISO 20022 message support for Open Banking
 *
 * Location: backend/src/services/openbanking/ISO20022Adapter.ts
 * Purpose: Build and parse ISO 20022 (pain.001, pain.002, camt.052/053) for PIS/AIS interoperability.
 * References: CONSOLIDATED_PRD integration requirements, Namibian Open Banking Standards.
 */

import { log, logError } from '../../utils/logger';

export interface ISO20022PaymentInfo {
  MessageIdentification: string;
  CreationDateTime: string;
  NumberOfTransactions: number;
  ControlSum: number;
  DebtorName: string;
  DebtorAccount: { IBAN?: string; Other?: { Identification: string } };
  CreditorName: string;
  CreditorAccount: { IBAN?: string; Other?: { Identification: string } };
  Amount: number;
  Currency: string;
  RemittanceInformation?: string;
  EndToEndId?: string;
}

/**
 * Build ISO 20022 pain.001 (Customer Credit Transfer) payload for payment initiation.
 * Simplified schema; production would use full XSD validation.
 */
export function buildPain001(
  paymentId: string,
  debtorName: string,
  debtorAccountId: string,
  creditorName: string,
  creditorAccountId: string,
  amount: number,
  currency: string,
  reference?: string,
  endToEndId?: string
): Record<string, unknown> {
  const creationDateTime = new Date().toISOString();
  const doc: Record<string, unknown> = {
    Document: {
      '@xmlns': 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.09',
      CstmrCdtTrfInitn: {
        GrpHdr: {
          MsgId: paymentId,
          CreDtTm: creationDateTime,
          NbOfTxs: '1',
          CtrlSum: amount.toFixed(2),
          InitgPty: { Nm: debtorName },
        },
        PmtInf: {
          PmtInfId: paymentId,
          PmtMtd: 'TRF',
          ReqdExctnDt: creationDateTime.slice(0, 10),
          Dbtr: { Nm: debtorName },
          DbtrAcct: {
            Id: { Othr: { Id: debtorAccountId } },
          },
          DbtrAgt: { FinInstnId: { BIC: process.env.BIC_DEBTOR || 'SWNANANX' } },
          CdtTrfTxInf: {
            PmtId: {
              InstrId: paymentId,
              EndToEndId: endToEndId || paymentId,
            },
            Amt: { '@Amount': amount.toFixed(2), '@Ccy': currency },
            CdtrAgt: { FinInstnId: { BIC: process.env.BIC_CREDITOR || 'SWNANANX' } },
            Cdtr: { Nm: creditorName },
            CdtrAcct: {
              Id: { Othr: { Id: creditorAccountId } },
            },
            RmtInf: reference ? { Ustrd: reference } : undefined,
          },
        },
      },
    },
  };
  return doc;
}

/**
 * Parse ISO 20022 pain.002 (Payment Status) response.
 */
export function parsePain002(xmlOrJson: string | Record<string, unknown>): {
  OriginalMessageId?: string;
  Status: 'ACCP' | 'RJCT' | 'PDNG';
  StatusReason?: string;
} {
  try {
    const doc = typeof xmlOrJson === 'string' ? JSON.parse(xmlOrJson) : xmlOrJson;
    const txInf = doc?.Document?.CstmrPmtStsRpt?.OrgnlGrpInfAndSts ?? doc?.OrgnlGrpInfAndSts;
    const status = txInf?.TxSts ?? 'PDNG';
    return {
      OriginalMessageId: txInf?.OrgnlMsgId,
      Status: status === 'ACCP' ? 'ACCP' : status === 'RJCT' ? 'RJCT' : 'PDNG',
      StatusReason: txInf?.StsRsnInf?.[0]?.Rsn?.Cd,
    };
  } catch (e) {
    logError('Parse pain.002 failed', e);
    return { Status: 'PDNG' };
  }
}

/**
 * Build camt.052 (Bank-to-Customer Account Report) request for balance inquiry.
 */
export function buildCamt052Request(accountId: string, fromDate?: string): Record<string, unknown> {
  return {
    Document: {
      '@xmlns': 'urn:iso:std:iso:20022:tech:xsd:camt.052.001.08',
      BkToCstmrAcctRpt: {
        GrpHdr: {
          MsgId: `camt052-${accountId}-${Date.now()}`,
          CreDtTm: new Date().toISOString(),
        },
        Rpt: {
          Id: accountId,
          Acct: { Id: { Othr: { Id: accountId } } },
          Bal: [],
          CreDtTm: new Date().toISOString(),
        },
      },
    },
    ...(fromDate && { FromDate: fromDate }),
  };
}

/**
 * Build camt.053 (Bank-to-Customer Statement) for account statement / transaction list.
 * References: ISO 20022 camt.053.001.02 / camt.053.001.08.
 * When toDate is omitted, uses current time (suitable for “from date to now” queries).
 */
export function buildCamt053Request(
  accountId: string,
  fromDate: string,
  toDate?: string
): Record<string, unknown> {
  const msgId = `camt053-${accountId}-${Date.now()}`;
  const toDtTm = toDate ?? new Date().toISOString();
  return {
    Document: {
      '@xmlns': 'urn:iso:std:iso:20022:tech:xsd:camt.053.001.02',
      BkToCstmrStmt: {
        GrpHdr: {
          MsgId: msgId,
          CreDtTm: new Date().toISOString(),
        },
        Stmt: {
          Id: accountId,
          Acct: { Id: { Othr: { Id: accountId } } },
          FrToDt: {
            FrDtTm: fromDate,
            ToDtTm: toDtTm,
          },
          Bal: [],
          Ntry: [],
          CreDtTm: new Date().toISOString(),
        },
      },
    },
  };
}

/**
 * Parse camt.053 (Bank-to-Customer Statement) response – entries and balances.
 */
export function parseCamt053(xmlOrJson: string | Record<string, unknown>): {
  accountId?: string;
  balances: { type: string; amount: number; currency: string; date: string }[];
  entries: { amount: number; currency: string; date: string; creditDebit: string; ref?: string }[];
} {
  try {
    const doc = typeof xmlOrJson === 'string' ? JSON.parse(xmlOrJson) : xmlOrJson;
    const stmt = doc?.Document?.BkToCstmrStmt?.Stmt ?? doc?.Stmt;
    const bal = (stmt?.Bal ?? []) as Array<{ Tp?: { CdOrPrtry?: { Cd?: string } }; Amt?: number; Ccy?: string; Dt?: { Dt?: string } }>;
    const entries = (stmt?.Ntry ?? []) as Array<{ Amt?: number; Ccy?: string; BookgDt?: { Dt?: string }; CdtDbtInd?: string; NtryRef?: string }>;
    return {
      accountId: stmt?.Acct?.Id?.Othr?.Id ?? stmt?.Id,
      balances: bal.map((b) => ({
        type: b.Tp?.CdOrPrtry?.Cd ?? 'OPBD',
        amount: Number(b.Amt) ?? 0,
        currency: b.Ccy ?? 'NAD',
        date: b.Dt?.Dt ?? '',
      })),
      entries: entries.map((e) => ({
        amount: Number(e.Amt) ?? 0,
        currency: e.Ccy ?? 'NAD',
        date: e.BookgDt?.Dt ?? '',
        creditDebit: e.CdtDbtInd ?? 'DBIT',
        ref: e.NtryRef,
      })),
    };
  } catch (e) {
    logError('Parse camt.053 failed', e);
    return { balances: [], entries: [] };
  }
}

/**
 * Build pacs.008 (FI to FI Customer Credit Transfer) for interbank settlement.
 * References: ISO 20022 pacs.008.001.08.
 */
export function buildPacs008(
  messageId: string,
  debtorBic: string,
  debtorAccountId: string,
  creditorBic: string,
  creditorAccountId: string,
  amount: number,
  currency: string,
  endToEndId: string,
  reference?: string
): Record<string, unknown> {
  const creationDateTime = new Date().toISOString();
  return {
    Document: {
      '@xmlns': 'urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08',
      FICdtTrf: {
        GrpHdr: {
          MsgId: messageId,
          CreDtTm: creationDateTime,
          NbOfTxs: '1',
          SttlmInf: { SttlmMtd: 'CLRG' },
        },
        CdtTrfTxInf: {
          PmtId: { EndToEndId: endToEndId },
          IntrBkSttlmAmt: { '@Amount': amount.toFixed(2), '@Ccy': currency },
          InstgAgt: { FinInstnId: { BIC: debtorBic } },
          InstdAgt: { FinInstnId: { BIC: creditorBic } },
          Dbtr: { Acct: { Id: { Othr: { Id: debtorAccountId } } } },
          Cdtr: { Acct: { Id: { Othr: { Id: creditorAccountId } } } },
          RmtInf: reference ? { Ustrd: reference } : undefined,
        },
      },
    },
  };
}

/**
 * Parse pacs.008 (inbound interbank transfer) – extract key fields.
 */
export function parsePacs008(xmlOrJson: string | Record<string, unknown>): {
  messageId?: string;
  endToEndId?: string;
  amount?: number;
  currency?: string;
  debtorAccountId?: string;
  creditorAccountId?: string;
} {
  try {
    const doc = typeof xmlOrJson === 'string' ? JSON.parse(xmlOrJson) : xmlOrJson;
    const grp = doc?.Document?.FICdtTrf?.GrpHdr ?? doc?.GrpHdr;
    const tx = doc?.Document?.FICdtTrf?.CdtTrfTxInf ?? doc?.CdtTrfTxInf;
    return {
      messageId: grp?.MsgId,
      endToEndId: tx?.PmtId?.EndToEndId,
      amount: tx?.IntrBkSttlmAmt?.['@Amount'] != null ? parseFloat(String(tx.IntrBkSttlmAmt['@Amount'])) : undefined,
      currency: tx?.IntrBkSttlmAmt?.['@Ccy'],
      debtorAccountId: tx?.Dbtr?.Acct?.Id?.Othr?.Id,
      creditorAccountId: tx?.Cdtr?.Acct?.Id?.Othr?.Id,
    };
  } catch (e) {
    logError('Parse pacs.008 failed', e);
    return {};
  }
}

/**
 * Simple JSON to XML (ISO 20022 style). Handles @-prefixed attributes and primitives.
 * Production should use XSD-validated serialisation.
 */
export function jsonToXml(obj: Record<string, unknown>, rootName = 'Document'): string {
  function escape(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
  function toXml(key: string, value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return `<${key}>${escape(String(value))}</${key}>`;
    }
    if (Array.isArray(value)) {
      return value.map((v) => toXml(key, v)).join('');
    }
    if (typeof value === 'object') {
      const attrs: string[] = [];
      const children: string[] = [];
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (k.startsWith('@')) attrs.push(`${k.slice(1)}="${escape(String(v))}"`);
        else children.push(toXml(k, v));
      }
      const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';
      return `<${key}${attrStr}>${children.join('')}</${key}>`;
    }
    return '';
  }
  const inner = obj[rootName] != null ? toXml(rootName, obj[rootName]) : Object.entries(obj).map(([k, v]) => toXml(k, v)).join('');
  return '<?xml version="1.0" encoding="UTF-8"?>' + (inner.startsWith('<') ? inner : `<${rootName}>${inner}</${rootName}>`);
}

/**
 * Simple XML to JSON (minimal). Handles trivial single-level tags only.
 * For full ISO 20022 parsing in production, use xml2js or fast-xml-parser:
 *   import xml2js from 'xml2js'; const doc = await xml2js.parseStringPromise(xml, { explicitArray: false });
 */
export function xmlToJson(xml: string): Record<string, unknown> {
  try {
    const tagRegex = /<([^>\s]+)([^>]*)>([^<]*)<\/\1>/g;
    const out: Record<string, unknown> = {};
    let m: RegExpExecArray | null;
    while ((m = tagRegex.exec(xml)) !== null) {
      const [, tag, attrs, text] = m;
      const key = tag.replace(/^[^:]+:/, '');
      if (attrs?.trim()) {
        const attrObj: Record<string, string> = {};
        attrs.replace(/(\w+)=["']([^"']+)["']/g, (_, k, v) => {
          attrObj['@' + k] = v;
          return '';
        });
        out[key] = { ...attrObj, _: text?.trim() ?? '' };
      } else {
        out[key] = text?.trim() ?? '';
      }
    }
    return out;
  } catch (e) {
    logError('xmlToJson failed', e);
    return {};
  }
}

/**
 * Validate pain.001 payload – required fields for Namibian Open Banking / ISO 20022.
 * Returns list of missing field names; empty array if valid.
 */
export function validatePain001(doc: Record<string, unknown>): string[] {
  const missing: string[] = [];
  const root = doc?.Document as Record<string, unknown> | undefined;
  const pain = root?.CstmrCdtTrfInitn as Record<string, unknown> | undefined;
  const grp = pain?.GrpHdr as Record<string, unknown> | undefined;
  const pmt = pain?.PmtInf as Record<string, unknown> | undefined;
  const tx = pmt?.CdtTrfTxInf as Record<string, unknown> | undefined;
  if (!grp?.MsgId) missing.push('GrpHdr.MsgId');
  if (!grp?.CreDtTm) missing.push('GrpHdr.CreDtTm');
  if (!pmt?.Dbtr) missing.push('PmtInf.Dbtr');
  if (!pmt?.DbtrAcct) missing.push('PmtInf.DbtrAcct');
  if (!tx?.Amt) missing.push('CdtTrfTxInf.Amt');
  if (!tx?.Cdtr) missing.push('CdtTrfTxInf.Cdtr');
  if (!tx?.CdtrAcct) missing.push('CdtTrfTxInf.CdtrAcct');
  return missing;
}

export const iso20022Adapter = {
  buildPain001,
  parsePain002,
  buildCamt052Request,
  buildCamt053Request,
  parseCamt053,
  buildPacs008,
  parsePacs008,
  jsonToXml,
  xmlToJson,
  validatePain001,
};
