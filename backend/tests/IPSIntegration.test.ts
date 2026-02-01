/**
 * IPS Integration Tests – End-to-end IPS and Open Banking (PRD FR2.6).
 * Location: backend/tests/IPSIntegration.test.ts
 * Covers: success flow, failure flow, participant directory, ISO 20022 pain.001/pain.002, receivePayment.
 */

import { describe, it, expect } from 'vitest';
import { IPSIntegrationService } from '../src/services/ips/IPSIntegrationService';
import { iso20022Adapter } from '../src/services/openbanking/ISO20022Adapter';

const ips = new IPSIntegrationService();

describe('IPS Integration', () => {
  it('should initiate payment and return accepted when gateway not configured', async () => {
    const result = await ips.initiatePayment({
      requestId: 'req-1',
      debtorParticipantId: 'BON',
      debtorAccountId: 'acc-1',
      creditorParticipantId: 'BON',
      creditorAccountId: 'acc-2',
      amount: '100.00',
      currency: 'NAD',
    });
    expect(result.status).toBe('accepted');
    expect(result.paymentId).toBe('req-1');
  });

  it('should reject sendPayment when creditor participant not in directory', async () => {
    const result = await ips.sendPayment(
      {
        requestId: 'req-unknown',
        debtorParticipantId: 'BON',
        debtorAccountId: 'acc-1',
        creditorParticipantId: 'UNKNOWN_BANK',
        creditorAccountId: 'acc-2',
        amount: '50.00',
        currency: 'NAD',
      },
      'Debtor Name',
      'Creditor Name'
    );
    expect(result.status).toBe('rejected');
    expect(result.statusReason).toContain('participant');
  });

  it('should reject sendPayment when amount invalid', async () => {
    const result = await ips.sendPayment(
      {
        requestId: 'req-invalid',
        debtorParticipantId: 'BON',
        debtorAccountId: 'acc-1',
        creditorParticipantId: 'BON',
        creditorAccountId: 'acc-2',
        amount: '-10',
        currency: 'NAD',
      },
      'Debtor',
      'Creditor'
    );
    expect(result.status).toBe('rejected');
    expect(result.statusReasonCode).toBe('AM09');
  });

  it('should return participant directory', () => {
    const dir = ips.getParticipantDirectory();
    expect(Array.isArray(dir)).toBe(true);
    expect(dir.some((p) => p.participantId === 'BON')).toBe(true);
  });

  it('should acknowledge receivePayment (pain.002) and return status', async () => {
    const ack = await ips.receivePayment({
      OrgnlGrpInfAndSts: { OrgnlMsgId: 'req-1', TxSts: 'ACCP' },
    });
    expect(ack.acknowledged).toBe(true);
    expect(ack.status).toBe('ACCP');
  });

  it('should build pain.001 payload', () => {
    const doc = iso20022Adapter.buildPain001(
      'pay-1',
      'Debtor Name',
      'acc-1',
      'Creditor Name',
      'acc-2',
      100.5,
      'NAD',
      'ref'
    );
    expect(doc?.Document?.CstmrCdtTrfInitn?.GrpHdr?.MsgId).toBe('pay-1');
  });

  it('should parse pain.002 status', () => {
    const parsed = iso20022Adapter.parsePain002('{}');
    expect(parsed.Status).toBe('PDNG');
  });

  it('should validate pain.001 – missing fields', () => {
    const missing = iso20022Adapter.validatePain001({});
    expect(missing.length).toBeGreaterThan(0);
    expect(missing).toContain('GrpHdr.MsgId');
  });
});
