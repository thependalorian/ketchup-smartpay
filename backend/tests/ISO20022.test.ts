/**
 * ISO 20022 Adapter Tests – pain.001, pain.002, camt.053, pacs.008, validation, XML/JSON.
 * Location: backend/tests/ISO20022.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  buildPain001,
  parsePain002,
  buildCamt053Request,
  parseCamt053,
  buildPacs008,
  parsePacs008,
  validatePain001,
  jsonToXml,
} from '../src/services/openbanking/ISO20022Adapter';

describe('ISO 20022 Adapter', () => {
  describe('pain.001', () => {
    it('should build valid pain.001 with required fields', () => {
      const doc = buildPain001('pay-1', 'Debtor', 'acc-1', 'Creditor', 'acc-2', 100, 'NAD', 'ref', 'e2e-1');
      expect(doc?.Document?.CstmrCdtTrfInitn?.GrpHdr?.MsgId).toBe('pay-1');
      expect(doc?.Document?.CstmrCdtTrfInitn?.PmtInf?.Dbtr?.Nm).toBe('Debtor');
      expect(doc?.Document?.CstmrCdtTrfInitn?.PmtInf?.CdtTrfTxInf?.Amt?.['@Amount']).toBe('100.00');
    });

    it('should validate pain.001 – valid doc has no missing required fields', () => {
      const doc = buildPain001('pay-1', 'D', 'acc-1', 'C', 'acc-2', 50, 'NAD');
      const missing = validatePain001(doc);
      expect(missing).toEqual([]);
    });

    it('should validate pain.001 – empty doc has missing fields', () => {
      const missing = validatePain001({});
      expect(missing.length).toBeGreaterThan(0);
    });
  });

  describe('pain.002', () => {
    it('should parse pain.002 with ACCP', () => {
      const parsed = parsePain002({
        Document: {
          CstmrPmtStsRpt: {
            OrgnlGrpInfAndSts: { OrgnlMsgId: 'pay-1', TxSts: 'ACCP' },
          },
        },
      });
      expect(parsed.Status).toBe('ACCP');
      expect(parsed.OriginalMessageId).toBe('pay-1');
    });

    it('should parse pain.002 with RJCT', () => {
      const parsed = parsePain002({ OrgnlGrpInfAndSts: { TxSts: 'RJCT', StsRsnInf: [{ Rsn: { Cd: 'NSUF' } }] } });
      expect(parsed.Status).toBe('RJCT');
      expect(parsed.StatusReason).toBe('NSUF');
    });
  });

  describe('camt.053', () => {
    it('should build camt.053 request', () => {
      const doc = buildCamt053Request('acc-1', '2026-01-01', '2026-01-31');
      expect(doc?.Document?.BkToCstmrStmt?.Stmt?.Acct?.Id?.Othr?.Id).toBe('acc-1');
      expect(doc?.Document?.BkToCstmrStmt?.Stmt?.FrToDt?.FrDtTm).toBe('2026-01-01');
    });

    it('should parse camt.053 response', () => {
      const parsed = parseCamt053({
        Document: {
          BkToCstmrStmt: {
            Stmt: {
              Id: 'acc-1',
              Acct: { Id: { Othr: { Id: 'acc-1' } } },
              Bal: [{ Amt: 1000, Ccy: 'NAD', Tp: { CdOrPrtry: { Cd: 'OPBD' } } }],
              Ntry: [{ Amt: 100, Ccy: 'NAD', CdtDbtInd: 'CRDT', BookgDt: { Dt: '2026-01-15' } }],
            },
          },
        },
      });
      expect(parsed.accountId).toBe('acc-1');
      expect(parsed.balances.length).toBe(1);
      expect(parsed.entries.length).toBe(1);
    });
  });

  describe('pacs.008', () => {
    it('should build pacs.008 for interbank', () => {
      const doc = buildPacs008('msg-1', 'SWNANANX', 'acc-1', 'FIRNNANX', 'acc-2', 500, 'NAD', 'e2e-1', 'ref');
      expect(doc?.Document?.FICdtTrf?.GrpHdr?.MsgId).toBe('msg-1');
      expect(doc?.Document?.FICdtTrf?.CdtTrfTxInf?.IntrBkSttlmAmt?.['@Amount']).toBe('500.00');
    });

    it('should parse pacs.008', () => {
      const parsed = parsePacs008({
        Document: {
          FICdtTrf: {
            GrpHdr: { MsgId: 'msg-1' },
            CdtTrfTxInf: {
              PmtId: { EndToEndId: 'e2e-1' },
              IntrBkSttlmAmt: { '@Amount': '200', '@Ccy': 'NAD' },
              Dbtr: { Acct: { Id: { Othr: { Id: 'db-acc' } } } },
              Cdtr: { Acct: { Id: { Othr: { Id: 'cr-acc' } } } },
            },
          },
        },
      });
      expect(parsed.messageId).toBe('msg-1');
      expect(parsed.endToEndId).toBe('e2e-1');
      expect(parsed.amount).toBe(200);
      expect(parsed.debtorAccountId).toBe('db-acc');
      expect(parsed.creditorAccountId).toBe('cr-acc');
    });
  });

  describe('jsonToXml', () => {
    it('should convert simple object to XML', () => {
      const xml = jsonToXml({ Document: { Root: { MsgId: 'test' } } });
      expect(xml).toContain('<?xml version="1.0"');
      expect(xml).toContain('MsgId');
      expect(xml).toContain('test');
    });
  });
});
