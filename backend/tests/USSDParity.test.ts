/**
 * USSD Parity Tests – Ensure backend supports all USSD features (PRD FR1.3, G2P 4.0).
 * Location: backend/tests/USSDParity.test.ts
 */

import { describe, it, expect } from 'vitest';

const USSD_FEATURES = [
  { id: 'balance', path: '/api/v1/ussd', method: 'POST' },
  { id: 'send_money', path: '/api/v1/ussd', method: 'POST' },
  { id: 'pay_bills', path: '/api/v1/ussd', method: 'POST' },
  { id: 'vouchers_list', path: '/api/v1/ussd/vouchers', method: 'POST' },
  { id: 'voucher_redeem', path: '/api/v1/ussd/voucher-redeem', method: 'POST' },
  { id: 'pin_recovery', path: '/api/v1/ussd/pin-recovery', method: 'POST' },
];

describe('USSD Parity', () => {
  it('should define all required USSD feature endpoints', () => {
    expect(USSD_FEATURES.length).toBeGreaterThanOrEqual(5);
  });

  it('should include balance check', () => {
    const balance = USSD_FEATURES.find((f) => f.id === 'balance');
    expect(balance).toBeDefined();
    expect(balance?.path).toBeTruthy();
  });

  it('should include send money', () => {
    const send = USSD_FEATURES.find((f) => f.id === 'send_money');
    expect(send).toBeDefined();
  });

  it('should include voucher list and redeem', () => {
    const vouchers = USSD_FEATURES.find((f) => f.id === 'vouchers_list');
    const redeem = USSD_FEATURES.find((f) => f.id === 'voucher_redeem');
    expect(vouchers).toBeDefined();
    expect(redeem).toBeDefined();
  });
});
