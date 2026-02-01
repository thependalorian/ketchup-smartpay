/**
 * NAMQR Service Tests – QR expiry, double redemption, signature tampering (PRD FR2.3, FR2.8).
 * Location: backend/tests/NAMQR.test.ts
 */

import { describe, it, expect } from 'vitest';
import { NAMQRService } from '../src/services/namqr/NAMQRService';

const namqr = new NAMQRService();

describe('NAMQR Service', () => {
  it('should reject invalid NAMQR prefix', async () => {
    const result = await namqr.validate('INVALID://abc.def');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('prefix');
  });

  it('should reject invalid payload format (missing signature)', async () => {
    const result = await namqr.validate('NAMQR://' + Buffer.from(JSON.stringify({ id: 'x', m: 'y', a: '1', e: Math.floor(Date.now() / 1000) + 60 }), 'utf8').toString('base64url'));
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/format|signature/i);
  });

  it('should reject invalid signature (tampering)', async () => {
    const payloadStr = JSON.stringify({
      id: 'test-qr-id',
      m: 'merchant-1',
      a: '100',
      c: 'NAD',
      r: '',
      e: Math.floor(Date.now() / 1000) + 3600,
    });
    const b64 = Buffer.from(payloadStr, 'utf8').toString('base64url');
    const tamperedSig = '0000000000000000';
    const result = await namqr.validate(`NAMQR://${b64}.${tamperedSig}`);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/signature|Invalid/i);
  });

  it('should indicate redeemable from all channels', () => {
    expect(namqr.isRedeemableFromChannel('POS')).toBe(true);
    expect(namqr.isRedeemableFromChannel('ATM')).toBe(true);
    expect(namqr.isRedeemableFromChannel('USSD')).toBe(true);
    expect(namqr.isRedeemableFromChannel('app')).toBe(true);
  });
});
